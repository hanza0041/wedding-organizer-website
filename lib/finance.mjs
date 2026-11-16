import { randomUUID } from 'node:crypto';

export const financeCategories = [
  { id: 'venue', name: 'สถานที่ & อาหาร' }, { id: 'outfits', name: 'ชุด & แหวน & ความงาม' },
  { id: 'vendors', name: 'ภาพถ่าย & ดนตรี & ตกแต่ง' }, { id: 'ceremony', name: 'พิธีการ' },
  { id: 'guests', name: 'การ์ด & ของชำร่วย & แขก' }, { id: 'other', name: 'อื่น ๆ' }
];
export const contributors = [{ id: 'bride', name: 'เจ้าสาว' }, { id: 'groom', name: 'เจ้าบ่าว' }, { id: 'shared', name: 'เงินกองกลาง' }, { id: 'family', name: 'ครอบครัว' }, { id: 'other', name: 'อื่น ๆ' }];
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, label, max = 200, optional = false) => {
  if (typeof v !== 'string' || (!optional && !v.trim()) || v.length > max) fail(400, `${label}ไม่ถูกต้อง`);
  return v.trim();
};
const amount = (v, positive = false) => {
  if (!Number.isSafeInteger(v) || v < (positive ? 1 : 0) || v > 1e12) fail(400, 'จำนวนเงินไม่ถูกต้อง (รองรับทศนิยมไม่เกิน 2 ตำแหน่ง)');
  return v;
};
const date = (v, optional = false) => {
  if (optional && (v === '' || v === null)) return '';
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(400, 'วันที่ไม่ถูกต้อง');
  const d = new Date(v + 'T12:00:00Z');
  if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== v) fail(400, 'วันที่ไม่ถูกต้อง');
  return v;
};
const contributor = v => contributors.some(c => c.id === v) ? v : fail(400, 'ผู้จ่ายหรือแหล่งเงินไม่ถูกต้อง');
const requestId = v => typeof v === 'string' && /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v) ? v : fail(400, 'รหัสรายการไม่ถูกต้อง');

export function createFinance(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(id), title TEXT NOT NULL, category TEXT NOT NULL,
    vendor TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(amountCents>=0), due TEXT NOT NULL,
    notes TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(id), expense TEXT NOT NULL REFERENCES expenses(id),
    amountCents INTEGER NOT NULL CHECK(amountCents>0), date TEXT NOT NULL, payer TEXT NOT NULL, notes TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS contributions (
    id TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(id), amountCents INTEGER NOT NULL CHECK(amountCents>0),
    date TEXT NOT NULL, payer TEXT NOT NULL, notes TEXT NOT NULL, created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS finance_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL REFERENCES rooms(id), role TEXT NOT NULL,
    action TEXT NOT NULL, entity TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS expense_room ON expenses(room);
    CREATE INDEX IF NOT EXISTS payment_room ON payments(room);
    CREATE INDEX IF NOT EXISTS contribution_room ON contributions(room);
    CREATE INDEX IF NOT EXISTS audit_room ON finance_audit(room);`);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (err) { db.exec('ROLLBACK'); throw err; } };
  const audit = (s, action, entity, data) => run('INSERT INTO finance_audit(room,role,action,entity,data,created) VALUES(?,?,?,?,?,?)', s.room, s.role, action, entity, JSON.stringify(data), new Date().toISOString());
  const expense = (id, room) => get('SELECT id,title,category,vendor,amountCents,due,notes,version,created FROM expenses WHERE id=? AND room=?', id, room) || fail(404, 'ไม่พบค่าใช้จ่ายนี้');
  const paid = (id, room) => get('SELECT COALESCE(SUM(amountCents),0) AS amount FROM payments WHERE expense=? AND room=?', id, room).amount;
  function state(room) {
    return {
      categories: financeCategories, contributors,
      expenses: all('SELECT id,title,category,vendor,amountCents,due,notes,version,created FROM expenses WHERE room=? ORDER BY created,id', room),
      payments: all('SELECT id,expense,amountCents,date,payer,notes,created FROM payments WHERE room=? ORDER BY date,created,id', room),
      contributions: all('SELECT id,amountCents,date,payer,notes,created FROM contributions WHERE room=? ORDER BY date,created,id', room),
      audit: all('SELECT id,role,action,entity,data,created FROM finance_audit WHERE room=? ORDER BY id DESC LIMIT 100', room).map(a => ({ ...a, data: JSON.parse(a.data) }))
    };
  }
  function route(path, method, b, s) {
    const parts = path.split('/').filter(Boolean);
    const collection = parts[2], id = parts[3];
    if (parts.length > 4) fail(404, 'ไม่พบรายการนี้');
    if (collection === 'expenses') {
      if (method === 'POST' && !id) {
        const data = validateExpense(b);
        const id = randomUUID();
        transaction(() => {
          run('INSERT INTO expenses VALUES(?,?,?,?,?,?,?,?,?,?)', id, s.room, data.title, data.category, data.vendor, data.amountCents, data.due, data.notes, 1, new Date().toISOString());
          audit(s, 'expense_created', id, data);
        });
        return { status: 201, data: { id } };
      }
      if (id && method === 'PATCH') {
        const previous = expense(id, s.room);
        if (b.version !== previous.version) fail(409, 'รายการนี้ถูกแก้ไขแล้ว ปิดแล้วเปิดใหม่เพื่อดูข้อมูลล่าสุด');
        const data = validateExpense(b);
        if (data.amountCents < paid(id, s.room)) fail(409, 'ยอดรวมต้องไม่น้อยกว่ายอดที่จ่ายแล้ว');
        transaction(() => {
          run('UPDATE expenses SET title=?,category=?,vendor=?,amountCents=?,due=?,notes=?,version=version+1 WHERE id=? AND room=?', data.title, data.category, data.vendor, data.amountCents, data.due, data.notes, id, s.room);
          audit(s, 'expense_updated', id, { before: previous, after: data });
        });
        return { status: 200, data: { ok: true } };
      }
      if (id && method === 'DELETE') {
        const previous = expense(id, s.room);
        if (paid(id, s.room)) fail(409, 'รายการนี้มีประวัติจ่ายเงินแล้ว ต้องยกเลิกการบันทึกการจ่ายก่อนลบ');
        transaction(() => { run('DELETE FROM expenses WHERE id=? AND room=?', id, s.room); audit(s, 'expense_deleted', id, previous); });
        return { status: 200, data: { ok: true } };
      }
    }
    if (collection === 'payments' || collection === 'contributions') {
      const isPayment = collection === 'payments';
      if (method === 'POST' && !id) {
        const id = requestId(b.id);
        const data = { amountCents: amount(b.amountCents, true), date: date(b.date), payer: contributor(b.payer), notes: text(b.notes ?? '', 'หมายเหตุ', 2000, true) };
        if (data.date > new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })) fail(400, 'กรุณาบันทึกวันที่รับหรือจ่ายเงินจริง ไม่ใช่วันในอนาคต');
        if (isPayment) data.expense = text(b.expense, 'ค่าใช้จ่าย', 100);
        return transaction(() => {
          const previous = get(`SELECT * FROM ${collection} WHERE id=?`, id);
          if (previous) {
            if (previous.room !== s.room || !Object.entries(data).every(([key, value]) => previous[key] === value)) fail(409, 'รหัสรายการนี้ถูกใช้แล้ว');
            return { status: 200, data: { id } }; // Retrying a successful request cannot duplicate a payment.
          }
          if (get('SELECT id FROM finance_audit WHERE room=? AND entity=? AND action=?', s.room, id, isPayment ? 'payment_recorded' : 'contribution_recorded')) fail(409, 'รายการนี้ถูกยกเลิกไปแล้ว กรุณาเปิดแบบฟอร์มใหม่');
          if (isPayment) {
            const e = expense(data.expense, s.room);
            if (paid(e.id, s.room) + data.amountCents > e.amountCents) fail(409, 'ยอดจ่ายเกินยอดคงค้าง ตรวจยอดรวมค่าใช้จ่ายก่อน');
            run('INSERT INTO payments VALUES(?,?,?,?,?,?,?,?)', id, s.room, e.id, data.amountCents, data.date, data.payer, data.notes, new Date().toISOString());
          } else run('INSERT INTO contributions VALUES(?,?,?,?,?,?,?)', id, s.room, data.amountCents, data.date, data.payer, data.notes, new Date().toISOString());
          audit(s, isPayment ? 'payment_recorded' : 'contribution_recorded', id, data);
          return { status: 201, data: { id } };
        });
      }
      if (method === 'DELETE' && id) {
        const previous = get(`SELECT * FROM ${collection} WHERE id=? AND room=?`, id, s.room);
        if (!previous) fail(404, 'ไม่พบรายการเงินนี้');
        transaction(() => { run(`DELETE FROM ${collection} WHERE id=? AND room=?`, id, s.room); audit(s, isPayment ? 'payment_reversed' : 'contribution_reversed', id, previous); });
        return { status: 200, data: { ok: true } };
      }
    }
    fail(404, 'ไม่พบรายการการเงินนี้');
  }
  function validateExpense(b) {
    if (!financeCategories.some(c => c.id === b.category)) fail(400, 'หมวดค่าใช้จ่ายไม่ถูกต้อง');
    return { title: text(b.title, 'ชื่อค่าใช้จ่าย'), category: b.category, vendor: text(b.vendor ?? '', 'ผู้ให้บริการ', 200, true), amountCents: amount(b.amountCents), due: date(b.due ?? '', true), notes: text(b.notes ?? '', 'หมายเหตุ', 2000, true) };
  }
  return { state, route };
}
