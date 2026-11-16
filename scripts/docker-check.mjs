// Isolated integration check. Only removes the unique QA project it creates.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = `everafter-qa-${randomBytes(6).toString('hex')}`;
const backupName = `${project}.sqlite`;
const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const port = probe.address().port; await new Promise(r => probe.close(r));
const exec = promisify(execFile);
const docker = async args => (await exec('docker', ['compose', '-p', project, ...args], { cwd: root, windowsHide: true, env: { ...process.env, PORT: String(port) }, timeout: 120000, maxBuffer: 2e6 })).stdout;
let cookie = '';
const api = async (path, method = 'GET', data) => {
  const response = await fetch(`http://127.0.0.1:${port}/api/${path}`, { method, headers: { Cookie: cookie, ...(data ? { 'Content-Type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const next = response.headers.get('set-cookie'); if (next) cookie = next.split(';')[0];
  const result = await response.json(); assert.ok(response.ok, JSON.stringify(result)); return result;
};
try {
  console.log('Building and starting an isolated Docker QA project…');
  await docker(['build', 'app']);
  await docker(['up', '-d', '--no-build', '--wait', '--wait-timeout', '60', 'app']);
  await api('start', 'POST', { bride: 'QA', groom: 'QA', weddingDate: '2028-01-15' });
  const expense = await api('finance/expenses', 'POST', { title: 'Docker persistence check', category: 'venue', amountCents: 123456, due: '2027-12-01' });
  await api('finance/payments', 'POST', { id: randomUUID(), expense: expense.id, amountCents: 23456, date: '2026-11-10', payer: 'bride' });
  const before = await api('state');
  await docker(['exec', '--user', 'root', 'app', 'node', 'scripts/backup.mjs', '/app/data/wedding.sqlite', `/app/backups/${backupName}`]);
  await docker(['exec', 'app', 'node', '--input-type=module', '-e', `import{DatabaseSync}from'node:sqlite';const db=new DatabaseSync('/app/backups/${backupName}',{readOnly:true});if(db.prepare('SELECT amountCents FROM payments').get().amountCents!==23456)process.exit(1);db.close();`]);
  await docker(['up', '-d', '--no-build', '--force-recreate', '--wait', '--wait-timeout', '60', 'app']);
  const after = await api('state');
  assert.deepEqual(after, before);
  console.log('Docker QA passed: Node 24 image, healthy app, finance API, consistent backup, and all data/session preserved after container recreation.');
} finally {
  assert.match(project, /^everafter-qa-[a-f\d]{12}$/);
  await docker(['down', '--volumes']);
  for (const suffix of ['', '-wal', '-shm']) {
    try { unlinkSync(resolve(root, 'backups', backupName + suffix)); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  }
}
