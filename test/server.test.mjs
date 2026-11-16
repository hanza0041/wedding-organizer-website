import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { createApp } from '../server.mjs';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { backupDatabase } from '../scripts/backup.mjs';
import { seedTasks } from '../lib/planning.mjs';

let server, origin, directory;
async function listen(dbPath) { server = createApp({ dbPath }); server.listen(0, '127.0.0.1'); await once(server, 'listening'); origin = `http://127.0.0.1:${server.address().port}`; }
async function close() { await new Promise(r => { server.close(r); server.closeAllConnections(); }); }
function client() {
  let cookie = '';
  return async (path, method = 'GET', data, headers = {}) => {
    const r = await fetch(`${origin}/api/${path}`, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { status: r.status, data: await r.json(), headers: r.headers };
  };
}
before(async () => { directory = mkdtempSync(join(tmpdir(), 'everafter-test-')); await listen(join(directory, 'test.sqlite')); });
after(async () => {
  if (server.listening) await close();
  // Only remove the exact temporary directory created by this test.
  const target = resolve(directory); const parent = resolve(tmpdir());
  assert.ok(relative(parent, target).startsWith('everafter-test-'));
  rmSync(target, { recursive: true, force: true });
});

test('two partners share discussions, decisions, schedule and durable checklists, while rooms stay isolated', async () => {
  const bride = client(), groom = client(), stranger = client(), otherCouple = client();
  assert.equal((await stranger('state')).status, 401);
  const preview = await stranger('preview');
  assert.equal(preview.data.tasks.length, 28);
  assert.equal(preview.data.messages.length, 0);
  assert.equal((await bride('start', 'POST', { bride: 'มะลิ', groom: 'ต้น', weddingDate: '2027-10-20', role: 'bride' })).status, 201);
  const initial = (await bride('state')).data;
  assert.equal(initial.role, 'bride');
  assert.equal(initial.tasks.length, 28);
  assert.equal(initial.tasks.filter(t => t.done).length, 0);
  assert.equal(initial.topics.length, 8);
  assert.equal(initial.invite, undefined);
  const invite = (await bride('invite')).data.invite;
  assert.ok(invite.length > 40);
  assert.equal((await groom('join', 'POST', { invite, role: 'groom' })).status, 200);
  assert.equal((await groom('state')).data.role, 'groom');

  assert.equal((await bride('messages', 'POST', { topic: 'venue', body: 'เราชอบสวนเล็ก ๆ' })).status, 201);
  await groom('messages', 'POST', { topic: 'venue', body: 'เราเห็นด้วย ไปดูกันวันเสาร์นะ' });
  await bride('messages', 'POST', { topic: 'budget', body: 'คุยงบแยกตรงนี้นะ' });
  const conversation = (await groom('state')).data.messages;
  assert.equal(conversation.filter(m => m.topic === 'venue').length, 2);
  assert.equal(conversation.filter(m => m.topic === 'budget').length, 1);
  assert.equal(conversation[0].role, 'bride');
  assert.equal(conversation[1].role, 'groom');
  await groom('decisions', 'POST', { topic: 'venue', body: 'เลือกงานในสวน' });
  assert.equal((await bride('state')).data.decisions.venue, 'เลือกงานในสวน');

  const id = initial.tasks[0].id;
  await bride(`tasks/${id}`, 'PATCH', { done: true });
  assert.equal((await groom('state')).data.tasks.find(t => t.id === id).done, true);
  const added = await groom('tasks', 'POST', { title: 'ดูสถานที่', due: '2027-05-12T14:30', topic: 'venue', owner: 'both', notes: 'เอารายชื่อแขกไปด้วย' });
  assert.equal(added.status, 201);
  assert.equal((await bride('state')).data.tasks.find(t => t.id === added.data.id).due, '2027-05-12T14:30');
  // Both operations must survive even when partners edit different fields concurrently.
  await Promise.all([bride(`tasks/${added.data.id}`, 'PATCH', { done: true }), groom(`tasks/${added.data.id}`, 'PATCH', { notes: 'จดข้อมูลใหม่' })]);
  const concurrentTask = (await bride('state')).data.tasks.find(t => t.id === added.data.id);
  assert.equal(concurrentTask.done, true);
  assert.equal(concurrentTask.notes, 'จดข้อมูลใหม่');

  const beforeShift = (await bride('state')).data;
  await bride('room', 'PATCH', { weddingDate: '2027-10-27', reschedule: true, budget: 350000, venue: 'สวนของเรา' });
  const afterShift = (await groom('state')).data;
  assert.equal(afterShift.room.budget, 350000);
  assert.equal(afterShift.room.venue, 'สวนของเรา');
  for (const t of afterShift.tasks) {
    const old = beforeShift.tasks.find(v => v.id === t.id);
    assert.equal(new Date(`${t.due}+07:00`) - new Date(`${old.due}+07:00`), old.done ? 0 : 7 * 86400000);
  }
  await otherCouple('start', 'POST', { bride: 'คู่', groom: 'อื่น', weddingDate: '2028-02-01' });
  assert.equal((await otherCouple('state')).data.messages.length, 0);
  assert.equal((await otherCouple(`tasks/${id}`, 'PATCH', { done: false })).status, 404);
  assert.equal((await stranger(`tasks/${id}`, 'PATCH', { done: false })).status, 401);
  assert.equal((await otherCouple(`tasks/${id}`, 'DELETE', {})).status, 404);
  assert.equal((await otherCouple('join', 'POST', { invite: 'wrong', role: 'groom' })).status, 404);

  // Invalid data, topic IDs and cross-origin mutations must fail without changing state.
  assert.equal((await bride('tasks', 'POST', { title: 'bad', topic: 'venue', owner: 'both', due: '2027-02-30T10:00' })).status, 400);
  assert.equal((await bride(`tasks/${id}`, 'PATCH', { due: '2027-02-02T25:00' })).status, 400);
  assert.equal((await bride('messages', 'POST', { topic: 'missing', body: 'x' })).status, 400);
  assert.equal((await bride('messages', 'POST', { topic: 'vision', body: '   ' })).status, 400);
  assert.equal((await bride('room', 'PATCH', { budget: -1 })).status, 400);
  assert.equal((await bride('room', 'PATCH', { bride: 'changed' }, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await bride('messages', 'POST', null)).status, 400);
  assert.equal((await bride(`tasks/${id}`, 'PATCH', { done: 'yes' })).status, 400);
  assert.equal((await bride('tasks', 'POST', { title: 'x'.repeat(201), topic: 'vision', owner: 'both', due: '2027-02-01T12:00' })).status, 400);
  const exportResponse = await groom('export');
  assert.match(exportResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(exportResponse.data.messages.length, 3);
  assert.equal(exportResponse.data.invite, undefined);

  const newInvite = (await bride('invite', 'POST', {})).data.invite;
  assert.notEqual(newInvite, invite);
  assert.equal((await stranger('join', 'POST', { invite, role: 'groom' })).status, 404);
  assert.equal((await groom('state')).status, 200);
  assert.equal((await stranger('join', 'POST', { invite: newInvite, role: 'bride' })).status, 200);

  await groom(`tasks/${added.data.id}`, 'DELETE', {});
  assert.ok(!(await bride('state')).data.tasks.some(t => t.id === added.data.id));
  const durable = (await groom('state')).data;
  await close();
  await listen(join(directory, 'test.sqlite'));
  assert.deepEqual((await groom('state')).data, durable);
  assert.equal((await bride('state')).data.messages.length, 3);
});

test('finance tracks cents, installments, contributions, room permissions, conflicts, audit and live backups', async () => {
  const bride = client(), groom = client(), outsider = client();
  await bride('start', 'POST', { bride: 'ฟ้า', groom: 'เมฆ', weddingDate: '2028-01-15' });
  const invite = (await bride('invite')).data.invite;
  await groom('join', 'POST', { invite, role: 'groom' });
  await outsider('start', 'POST', { bride: 'อื่น', groom: 'อื่น', weddingDate: '2028-02-15' });
  const data = { title: 'สถานที่', category: 'venue', vendor: 'สวนสวย', amountCents: 100050, due: '2027-12-01', notes: 'มัดจำสองงวด' };
  const response = await bride('finance/expenses', 'POST', data);
  assert.equal(response.status, 201);
  const id = response.data.id;
  const entry = { id: randomUUID(), expense: id, amountCents: 50025, date: '2026-11-10', payer: 'bride', notes: 'มัดจำ' };
  assert.equal((await bride('finance/payments', 'POST', entry)).status, 201);
  assert.equal((await bride('finance/payments', 'POST', entry)).status, 200);
  assert.equal((await bride('finance/payments', 'POST', { ...entry, amountCents: 10 })).status, 409);
  let f = (await groom('state')).data.finance;
  assert.equal(f.payments.length, 1);
  assert.equal(f.payments[0].amountCents, 50025);
  assert.equal(f.audit[0].role, 'bride');
  const second = { ...entry, id: randomUUID(), payer: 'groom' };
  assert.equal((await groom('finance/payments', 'POST', second)).status, 201);
  assert.equal((await bride('finance/payments', 'POST', { ...entry, id: randomUUID(), amountCents: 1 })).status, 409);
  assert.equal((await bride('finance/expenses/' + id, 'PATCH', { ...data, version: 1, amountCents: 50000 })).status, 409);
  assert.equal((await bride('finance/expenses/' + id, 'PATCH', { ...data, version: 1, amountCents: 200050 })).status, 200);
  assert.equal((await groom('finance/expenses/' + id, 'PATCH', { ...data, version: 1 })).status, 409);
  assert.equal((await outsider('finance/expenses/' + id, 'PATCH', { ...data, version: 2 })).status, 404);
  assert.equal((await outsider('finance/payments', 'POST', { ...entry, id: randomUUID() })).status, 404);
  assert.equal((await outsider('finance/payments/' + entry.id, 'DELETE', {})).status, 404);
  assert.equal((await outsider('state')).data.finance.expenses.length, 0);
  const contribution = { id: randomUUID(), amountCents: 300075, date: '2026-11-10', payer: 'family', notes: 'เงินช่วยจากครอบครัว' };
  assert.equal((await groom('finance/contributions', 'POST', contribution)).status, 201);
  assert.equal((await groom('finance/contributions', 'POST', contribution)).status, 200);
  assert.equal((await bride('state')).data.finance.contributions.length, 1);
  for (const amountCents of [-1, 0, 1.5, 1e13, '100']) assert.equal((await bride('finance/contributions', 'POST', { ...contribution, id: randomUUID(), amountCents })).status, 400);
  assert.equal((await bride('finance/contributions', 'POST', { ...contribution, id: randomUUID(), date: '2026-02-30' })).status, 400);
  assert.equal((await bride('finance/contributions', 'POST', { ...contribution, id: randomUUID(), date: '2099-01-01' })).status, 400);
  assert.equal((await bride('finance/contributions', 'POST', { ...contribution, id: randomUUID(), payer: 'bad' })).status, 400);
  assert.equal((await bride('finance/contributions', 'POST', { ...contribution, id: 'bad' })).status, 400);
  assert.equal((await bride('finance/expenses', 'POST', { ...data, amountCents: 0.1 })).status, 400);

  const conflict = (await bride('finance/expenses', 'POST', { ...data, title: 'ช่างภาพ', amountCents: 30000 })).data.id;
  const results = await Promise.all([bride('finance/payments', 'POST', { ...entry, expense: conflict, id: randomUUID(), amountCents: 20000 }), groom('finance/payments', 'POST', { ...entry, expense: conflict, id: randomUUID(), amountCents: 20000 })]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal((await bride('finance/expenses/' + id, 'DELETE', {})).status, 409);
  assert.equal((await bride('finance/payments/' + entry.id, 'DELETE', {})).status, 200);
  assert.equal((await bride('finance/payments', 'POST', entry)).status, 409);
  assert.equal((await groom('finance/payments/' + second.id, 'DELETE', {})).status, 200);
  assert.equal((await bride('finance/expenses/' + id, 'DELETE', {})).status, 200);
  f = (await bride('state')).data.finance;
  assert.ok(f.audit.some(a => a.action === 'expense_deleted' && a.data.title === 'สถานที่'));
  assert.ok(f.audit.some(a => a.action === 'payment_reversed'));
  assert.equal((await groom('export')).data.finance.payments.length, 1);

  const output = join(directory, 'snapshot.sqlite');
  await backupDatabase(join(directory, 'test.sqlite'), output);
  const backup = new DatabaseSync(output, { readOnly: true });
  assert.equal(backup.prepare('SELECT COUNT(*) AS n FROM payments').get().n, 1);
  assert.equal(backup.prepare('SELECT amountCents FROM contributions').get().amountCents, 300075);
  backup.close();
  assert.equal(existsSync(output + '-wal'), false);
  assert.equal(existsSync(output + '-shm'), false);
  await assert.rejects(() => backupDatabase(join(directory, 'test.sqlite'), output), /refusing to overwrite/);
  await assert.rejects(() => backupDatabase(join(directory, 'missing.sqlite'), join(directory, 'new.sqlite')), /does not exist/);
  await close(); await listen(output);
  assert.deepEqual((await groom('state')).data.finance, f);
  assert.equal((await groom('state')).data.room.bride, 'ฟ้า');
  await close(); await listen(join(directory, 'test.sqlite'));
  assert.deepEqual((await groom('state')).data.finance, f);
});

test('starter timeline adapts to short planning windows without overdue starter dates', () => {
  const tasks = seedTasks('2026-11-19', '2026-11-17');
  assert.equal(tasks.length, 28);
  assert.ok(tasks.every(t => t.due >= '2026-11-17T23:59'));
  assert.equal(tasks.at(-1).due, '2026-11-22T10:00');
});

test('serves the app with security headers and limits static file access', async () => {
  for (const path of ['/', '/app.js', '/styles.css', '/garden.svg', '/favicon.svg']) {
    const r = await fetch(`${origin}${path}`); assert.equal(r.status, 200); assert.ok(r.headers.get('content-security-policy')); assert.ok((await r.text()).length > 50);
  }
  assert.equal((await fetch(`${origin}/server.mjs`)).status, 404);
  assert.equal((await fetch(`${origin}/data/wedding.sqlite`)).status, 404);
  assert.equal((await fetch(`${origin}/.env`)).status, 404);
});
