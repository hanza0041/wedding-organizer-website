import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { topics, seedTasks, sources } from './lib/planning.mjs';
import { createFinance, financeCategories, contributors } from './lib/finance.mjs';

const root = dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(join(root, '.env')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
const token = () => randomBytes(32).toString('base64url');
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function string(value, name, max = 200, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max) fail(400, `${name}ไม่ถูกต้อง`);
  return value.trim();
}
function date(value, time = false) {
  if (typeof value !== 'string' || !(time ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) fail(400, 'วันเวลาไม่ถูกต้อง');
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== value.slice(0, 10) || (time && (Number(value.slice(11, 13)) > 23 || Number(value.slice(14)) > 59))) fail(400, 'วันเวลาไม่ถูกต้อง');
  return value;
}
const role = value => ['bride', 'groom', 'both'].includes(value) ? value : fail(400, 'ผู้รับผิดชอบไม่ถูกต้อง');
const topicId = value => topics.some(t => t.id === value) ? value : fail(400, 'ไม่พบหัวข้อนี้');

export function createApp({ dbPath = process.env.DB_PATH || join(root, 'data', 'wedding.sqlite') } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(resolve(dbPath)), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, invite TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(id), role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL REFERENCES rooms(id), topic TEXT NOT NULL, role TEXT NOT NULL, body TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS decisions(room TEXT NOT NULL REFERENCES rooms(id), topic TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(room,topic));
    CREATE INDEX IF NOT EXISTS task_room ON tasks(room);
    CREATE INDEX IF NOT EXISTS message_room ON messages(room);`);
  const finance = createFinance(db);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (err) { db.exec('ROLLBACK'); throw err; } };
  function session(req) {
    const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('wedding_session='))?.slice(16);
    const s = cookie && get('SELECT * FROM sessions WHERE token=?', hash(cookie));
    if (!s) fail(401, 'กรุณาเปิดพื้นที่ของเราหรือเข้าร่วมผ่านลิงก์เชิญ');
    return s;
  }
  function setSession(req, res, room, who) {
    const key = token();
    run('INSERT INTO sessions VALUES(?,?,?)', hash(key), room, who);
    const secure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
    res.setHeader('Set-Cookie', `wedding_session=${key}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure ? '; Secure' : ''}`);
  }
  async function body(req) {
    let data = '';
    for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 20000) fail(413, 'ข้อมูลยาวเกินไป'); }
    try { const parsed = JSON.parse(data || '{}'); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400, 'ข้อมูล JSON ไม่ถูกต้อง'); return parsed; } catch { fail(400, 'ข้อมูล JSON ไม่ถูกต้อง'); }
  }
  function state(s) {
    const room = JSON.parse(get('SELECT data FROM rooms WHERE id=?', s.room).data);
    return { room, role: s.role, topics, sources, finance: finance.state(s.room),
      tasks: all('SELECT id,data FROM tasks WHERE room=? ORDER BY rowid', s.room).map(t => ({ id: t.id, ...JSON.parse(t.data) })),
      messages: all('SELECT id,topic,role,body,created FROM messages WHERE room=? ORDER BY id', s.room),
      decisions: Object.fromEntries(all('SELECT topic,body FROM decisions WHERE room=?', s.room).map(d => [d.topic, d.body])) };
  }
  const buckets = new Map();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      if (path === '/api/health') return json(200, { ok: true });
      if (path === '/api/preview' && req.method === 'GET') {
        const d = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 180);
        const weddingDate = d.toISOString().slice(0, 10);
        return json(200, { room: { bride: 'เรา', groom: 'เธอ', weddingDate, venue: '', budget: 0 }, role: 'bride', topics, sources, tasks: seedTasks(weddingDate).map((t, i) => ({ id: `preview-${i}`, ...t })), messages: [], decisions: {}, finance: { categories: financeCategories, contributors, expenses: [], payments: [], contributions: [], audit: [] } });
      }
      if (!path.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') fail(405, 'Method not allowed');
        const files = { '/': 'index.html', '/app.js': 'app.js', '/styles.css': 'styles.css', '/garden.svg': 'garden.svg', '/favicon.svg': 'favicon.svg' };
        if (!files[path]) fail(404, 'ไม่พบหน้านี้');
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
        res.writeHead(200, { 'Content-Type': `${types[extname(files[path])]}; charset=utf-8`, 'Cache-Control': 'no-cache' });
        return res.end(req.method === 'HEAD' ? undefined : readFileSync(join(root, 'public', files[path])));
      }
      if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) fail(405, 'Method not allowed');
      if (req.method !== 'GET') {
        if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'ต้องส่งข้อมูล JSON');
        // JSON-only writes reject cross-site forms. Origin check also protects same-site subdomains.
        if (req.headers.origin) {
          let host; try { host = new URL(req.headers.origin).host; } catch { fail(403, 'Origin ไม่ถูกต้อง'); }
          if (host !== req.headers.host) fail(403, 'ไม่อนุญาตคำขอข้ามเว็บไซต์');
        }
        const key = req.socket.remoteAddress;
        const now = Date.now();
        const bucket = buckets.get(key);
        if (bucket && bucket.until > now) { if (++bucket.count > 180) fail(429, 'ลองใหม่อีกสักครู่'); }
        else { if (buckets.size > 10000) buckets.clear(); buckets.set(key, { count: 1, until: now + 60000 }); }
      }
      if (path === '/api/start' && req.method === 'POST') {
        const b = await body(req);
        const weddingDate = date(b.weddingDate);
        const who = role(b.role || 'bride');
        if (who === 'both') fail(400, 'เลือกเจ้าบ่าวหรือเจ้าสาว');
        const id = randomUUID();
        transaction(() => {
          run('INSERT INTO rooms VALUES(?,?,?)', id, token(), JSON.stringify({ bride: string(b.bride, 'ชื่อเจ้าสาว', 60), groom: string(b.groom, 'ชื่อเจ้าบ่าว', 60), weddingDate, venue: '', budget: 0, created: new Date().toISOString() }));
          for (const task of seedTasks(weddingDate, new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }))) run('INSERT INTO tasks VALUES(?,?,?)', randomUUID(), id, JSON.stringify(task));
          setSession(req, res, id, who);
        });
        return json(201, { ok: true });
      }
      if (path === '/api/join' && req.method === 'POST') {
        const b = await body(req);
        const invite = string(b.invite, 'ลิงก์เชิญ', 100);
        const room = get('SELECT id FROM rooms WHERE invite=?', invite);
        if (!room) fail(404, 'ลิงก์เชิญไม่ถูกต้องหรือถูกเปลี่ยนแล้ว');
        const who = role(b.role);
        if (who === 'both') fail(400, 'เลือกเจ้าบ่าวหรือเจ้าสาว');
        setSession(req, res, room.id, who);
        return json(200, { ok: true });
      }
      const s = session(req);
      if (path.startsWith('/api/finance/')) {
        const result = finance.route(path, req.method, await body(req), s);
        return json(result.status, result.data);
      }
      if (path === '/api/state' && req.method === 'GET') return json(200, state(s));
      if (path === '/api/invite' && req.method === 'GET') return json(200, { invite: get('SELECT invite FROM rooms WHERE id=?', s.room).invite });
      if (path === '/api/invite' && req.method === 'POST') { await body(req); const invite = token(); run('UPDATE rooms SET invite=? WHERE id=?', invite, s.room); return json(200, { invite }); }
      if (path === '/api/room' && req.method === 'PATCH') {
        const b = await body(req);
        const room = JSON.parse(get('SELECT data FROM rooms WHERE id=?', s.room).data);
        for (const field of ['bride', 'groom', 'venue']) if (field in b) room[field] = string(b[field], field, field === 'venue' ? 200 : 60, field === 'venue');
        if ('budget' in b) { if (!Number.isFinite(b.budget) || b.budget < 0 || b.budget > 1e10) fail(400, 'งบประมาณไม่ถูกต้อง'); room.budget = b.budget; }
        if ('weddingDate' in b) {
          const next = date(b.weddingDate);
          if (b.reschedule) {
            const offset = Math.round((new Date(next) - new Date(room.weddingDate)) / 86400000);
            transaction(() => {
              for (const t of all('SELECT id,data FROM tasks WHERE room=?', s.room)) {
                const task = JSON.parse(t.data);
                if (task.done) continue;
                const d = new Date(task.due.slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + offset);
                task.due = d.toISOString().slice(0, 10) + task.due.slice(10);
                run('UPDATE tasks SET data=? WHERE id=?', JSON.stringify(task), t.id);
              }
              room.weddingDate = next;
              run('UPDATE rooms SET data=? WHERE id=?', JSON.stringify(room), s.room);
            });
            return json(200, { ok: true });
          }
          room.weddingDate = next;
        }
        run('UPDATE rooms SET data=? WHERE id=?', JSON.stringify(room), s.room);
        return json(200, { ok: true });
      }
      if (path === '/api/tasks' && req.method === 'POST') {
        const b = await body(req);
        const id = randomUUID();
        const data = { title: string(b.title, 'ชื่องาน'), topic: topicId(b.topic), owner: role(b.owner), due: date(b.due, true), notes: string(b.notes || '', 'บันทึก', 3000, true), done: false };
        run('INSERT INTO tasks VALUES(?,?,?)', id, s.room, JSON.stringify(data));
        return json(201, { id });
      }
      if (path.startsWith('/api/tasks/')) {
        const id = path.slice(11);
        const b = ['PATCH', 'DELETE'].includes(req.method) ? await body(req) : null;
        const task = get('SELECT data FROM tasks WHERE id=? AND room=?', id, s.room);
        if (!task) fail(404, 'ไม่พบงานนี้');
        if (req.method === 'DELETE') { run('DELETE FROM tasks WHERE id=? AND room=?', id, s.room); return json(200, { ok: true }); }
        if (req.method === 'PATCH') {
          const data = JSON.parse(task.data);
          if ('title' in b) data.title = string(b.title, 'ชื่องาน');
          if ('topic' in b) data.topic = topicId(b.topic);
          if ('owner' in b) data.owner = role(b.owner);
          if ('due' in b) data.due = date(b.due, true);
          if ('notes' in b) data.notes = string(b.notes, 'บันทึก', 3000, true);
          if ('done' in b) { if (typeof b.done !== 'boolean') fail(400, 'สถานะไม่ถูกต้อง'); data.done = b.done; }
          run('UPDATE tasks SET data=? WHERE id=? AND room=?', JSON.stringify(data), id, s.room);
          return json(200, { ok: true });
        }
      }
      if (path === '/api/messages' && req.method === 'POST') {
        const b = await body(req);
        run('INSERT INTO messages(room,topic,role,body,created) VALUES(?,?,?,?,?)', s.room, topicId(b.topic), s.role, string(b.body, 'ข้อความ', 4000), new Date().toISOString());
        return json(201, { ok: true });
      }
      if (path === '/api/decisions' && req.method === 'POST') {
        const b = await body(req);
        run('INSERT INTO decisions VALUES(?,?,?) ON CONFLICT(room,topic) DO UPDATE SET body=excluded.body', s.room, topicId(b.topic), string(b.body, 'ข้อสรุป', 3000, true));
        return json(200, { ok: true });
      }
      if (path === '/api/export' && req.method === 'GET') { res.setHeader('Content-Disposition', 'attachment; filename="our-wedding.json"'); return json(200, state(s)); }
      fail(404, 'ไม่พบข้อมูลนี้');
    } catch (err) { if (!err.status) console.error(err); json(err.status || 500, { error: err.status ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' }); }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createApp();
  const port = Number(process.env.PORT || 3001);
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Our Ever After is ready at http://${process.env.HOST || '127.0.0.1'}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
