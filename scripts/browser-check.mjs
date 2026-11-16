// Optional local browser QA using an installed Chrome/Edge, without npm dependencies.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

const executable = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!executable) throw new Error('Set CHROME_PATH to a local Chrome or Edge binary.');
const directory = mkdtempSync(join(tmpdir(), 'everafter-browser-'));
const output = resolve('test-artifacts'); mkdirSync(output, { recursive: true });
const server = createApp({ dbPath: join(directory, 'browser.sqlite') });
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = join(directory, 'chrome');
const chrome = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws, counter = 0;
const waiting = new Map(), errors = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
function send(method, params = {}, sessionId) {
  const id = ++counter;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    waiting.set(id, { resolve: result => { clearTimeout(timeout); resolve(result); }, reject: err => { clearTimeout(timeout); reject(err); } });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function tab(url, width = 1440, height = 1150) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 });
  const evaluate = async expression => {
    const result = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
    return result.result.value;
  };
  const until = async expression => { for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await delay(100); } throw new Error(`Browser condition timed out: ${expression}`); };
  await cmd('Page.navigate', { url });
  await until('!!document.querySelector(".hero")');
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const fill = (selector, value) => evaluate(`{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));}`);
  const screenshot = async file => {
    await evaluate('document.fonts.ready');
    await delay(400); // Wait for page-entry and responsive sidebar transitions.
    const result = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(output, file), Buffer.from(result.data, 'base64'));
  };
  return { cmd, evaluate, until, click, fill, screenshot };
}
try {
  let port;
  for (let i = 0; i < 150; i++) {
    try { port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch {}
    if (chrome.exitCode !== null) throw new Error(`Chrome exited: ${chrome.exitCode}`);
    await delay(100);
  }
  if (!port) throw new Error('Chrome debugging endpoint did not start.');
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await once(ws, 'open');
  ws.addEventListener('message', e => {
    const message = JSON.parse(e.data);
    if (message.id) { const pending = waiting.get(message.id); if (pending) { waiting.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  const bride = await tab(origin);
  assert.ok(await bride.evaluate('document.querySelector(".preview-notice").textContent.includes("ตัวอย่าง")'));
  assert.ok(await bride.evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await bride.screenshot('desktop-preview.png');
  await bride.click('[data-action="start"]');
  await bride.fill('#bride', 'มะลิ'); await bride.fill('#groom', 'ต้น');
  await bride.fill('#weddingDate', '2027-10-20');
  await bride.evaluate('document.querySelector("#start-form").requestSubmit()');
  await bride.until('!!document.querySelector("#invite-url")');
  const inviteUrl = await bride.evaluate('document.querySelector("#invite-url").value');
  await bride.click('[data-modal-action="close"]');
  assert.ok(await bride.evaluate('document.querySelector(".partner-card").textContent.includes("มะลิ")'));
  await bride.screenshot('desktop-dashboard.png');

  const groom = await tab(inviteUrl);
  await groom.until('!!document.querySelector("#join-form")');
  await groom.evaluate('document.querySelector("#join-form").requestSubmit()');
  await groom.until('!document.querySelector("dialog").open && document.querySelector(".partner-card").textContent.includes("เจ้าบ่าว")');
  await bride.click('[data-action="topic"][data-id="venue"]');
  await groom.click('[data-action="topic"][data-id="venue"]');
  await bride.fill('#message-draft', 'ไปดูสถานที่ในสวนด้วยกันนะ ♡');
  await bride.evaluate('document.querySelector("#message-form").requestSubmit()');
  await groom.until('document.querySelector(".conversation").textContent.includes("ไปดูสถานที่ในสวนด้วยกันนะ")');
  await groom.fill('#message-draft', 'ได้เลย วันเสาร์บ่ายสองนะ');
  await groom.evaluate('document.querySelector("#message-form").requestSubmit()');
  await bride.until('document.querySelector(".conversation").textContent.includes("วันเสาร์บ่ายสองนะ")');
  await bride.click('[data-action="decision"]');
  await bride.fill('#decision-body', 'ดูสถานที่ในสวน วันเสาร์ 14:00 น.');
  await bride.evaluate('document.querySelector("#decision-form").requestSubmit()');
  await groom.until('document.querySelector(".decision p").textContent.includes("วันเสาร์ 14:00")');
  await groom.screenshot('discussion.png');
  await bride.click('[data-action="nav"][data-id="checklist"]');
  await groom.click('[data-action="nav"][data-id="checklist"]');
  const initialCount = await groom.evaluate('document.querySelectorAll(".all-tasks .task-row").length');
  await bride.click('.all-tasks .check');
  await groom.until(`document.querySelectorAll('.all-tasks .task-row').length === ${initialCount - 1}`);
  await bride.click('[data-action="add-task"]');
  await bride.fill('#task-title', 'นัดดูสวนวันเสาร์');
  await bride.fill('#task-due', '2027-02-13T14:00');
  await bride.evaluate('document.querySelector("#task-topic").value="venue";document.querySelector("#task-form").requestSubmit()');
  await groom.until('document.querySelector(".all-tasks").textContent.includes("นัดดูสวนวันเสาร์")');
  await groom.fill('#search', 'นัดดูสวน');
  assert.equal(await groom.evaluate('document.querySelectorAll(".all-tasks .task-row").length'), 1);
  await groom.click('.all-tasks .task-title');
  assert.equal(await groom.evaluate('document.querySelector("#task-due").value'), '2027-02-13T14:00');
  await groom.fill('#task-notes', 'นำรายชื่อแขกไปด้วย');
  await groom.evaluate('document.querySelector("#task-form").requestSubmit()');
  await bride.until('document.querySelector(".all-tasks").textContent.includes("มีบันทึก")');
  await bride.click('[data-action="nav"][data-id="calendar"]');
  assert.equal(await bride.evaluate('document.querySelectorAll(".weekday").length'), 7);
  await bride.click('[data-action="month-next"]');
  assert.ok(await bride.evaluate('document.querySelector(".calendar-header h2").textContent.length > 5'));
  await bride.screenshot('calendar.png');
  await bride.click('[data-action="nav"][data-id="guide"]');
  assert.equal(await bride.evaluate('document.querySelectorAll(".source-card a").length'), 3);
  await bride.click('[data-action="settings"]');
  await bride.fill('#venue', 'สวนของเรา'); await bride.fill('#budget', '350000');
  await bride.evaluate('document.querySelector("#settings-form").requestSubmit()');
  await bride.until('!document.querySelector("dialog").open');
  await bride.click('[data-action="nav"][data-id="overview"]');
  await bride.until('document.querySelector(".hero-date").textContent.includes("สวนของเรา")');
  await bride.click('[data-action="nav"][data-id="finance"]');
  await groom.click('[data-action="nav"][data-id="finance"]');
  await bride.click('[data-action="add-expense"]');
  await bride.fill('#expense-title', 'แพ็กเกจสวนและอาหาร');
  await bride.fill('#expense-amount', '1000.50');
  await bride.fill('#expense-due', '2027-09-20');
  await bride.fill('#expense-vendor', 'สวนริมแม่น้ำ');
  await bride.evaluate('document.querySelector("#expense-form").requestSubmit()');
  await groom.until('document.querySelector(".expense-panel").textContent.includes("แพ็กเกจสวนและอาหาร")');
  await bride.click('[data-action="add-payment"]');
  await bride.fill('#entry-amount', '300.25');
  await bride.fill('#entry-notes', 'มัดจำงวดแรก');
  await bride.evaluate('document.querySelector("#money-entry-form").requestSubmit()');
  await groom.until('document.querySelector("#finance-paid").textContent.includes("300.25")');
  await groom.click('[data-action="add-payment"]');
  assert.equal(await groom.evaluate('document.querySelector("#entry-amount").value'), '700.25');
  await groom.evaluate('document.querySelector("#entry-payer").value="groom";document.querySelector("#money-entry-form").requestSubmit()');
  await bride.until('document.querySelector("#finance-paid").textContent.includes("1,000.50")');
  await bride.click('[data-action="add-contribution"]');
  await bride.fill('#entry-amount', '1500.50');
  await bride.fill('#entry-notes', 'เงินเก็บเตรียมงานของเรา');
  await bride.evaluate('document.querySelector("#entry-payer").value="family";document.querySelector("#money-entry-form").requestSubmit()');
  await groom.until('document.querySelector(".funds-summary").textContent.includes("500.00")');
  await groom.fill('#expense-search', 'แพ็กเกจสวน');
  assert.equal(await groom.evaluate('document.querySelectorAll(".expense-table tbody tr").length'), 1);
  await groom.click('.expense-table .task-title');
  await groom.fill('#expense-vendor', 'สวนริมแม่น้ำ สาขาเชียงใหม่');
  await groom.evaluate('document.querySelector("#expense-form").requestSubmit()');
  await bride.until('document.querySelector(".expense-table").textContent.includes("สาขาเชียงใหม่")');
  await bride.screenshot('finance-desktop.png');
  await bride.click('[data-action="finance-audit"]');
  assert.ok(await bride.evaluate('document.querySelector(".audit-list").textContent.includes("บันทึกการจ่าย")'));
  await bride.click('[data-modal-action="close"]');
  await bride.cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await bride.evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await bride.screenshot('finance-mobile.png');
  await bride.click('[data-action="nav"][data-id="overview"]');
  assert.ok(await bride.evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await bride.screenshot('mobile-dashboard.png');
  await bride.click('[data-action="menu"]');
  assert.ok(await bride.evaluate('document.querySelector(".sidebar").classList.contains("open")'));
  await bride.click('[data-action="nav"][data-id="calendar"]');
  assert.ok(await bride.evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await bride.screenshot('mobile-calendar.png');
  assert.deepEqual(errors, []);
  console.log('Browser QA passed: separate partner sessions, invitations, two-way messaging, shared decisions, live checklist updates, tasks, calendar, settings, research links, expenses, installment payments with exact cents, contributions, shared finance updates, audit history, and mobile layouts.');
  console.log(`Screenshots: ${output}`);
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  chrome.kill('SIGTERM');
  await new Promise(r => { server.close(r); server.closeAllConnections(); });
  await delay(500);
  const target = resolve(directory), parent = resolve(tmpdir());
  if (relative(parent, target).startsWith('everafter-browser-')) {
    try { rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { console.log('Temporary browser profile still in use; close the QA browser to remove it.'); }
  }
}
