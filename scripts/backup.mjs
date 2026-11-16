import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, openSync, closeSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function backupDatabase(source, destination) {
  const input = resolve(source), output = resolve(destination);
  if (!existsSync(input)) throw new Error(`Database does not exist: ${input}`);
  if (input === output) throw new Error('Backup source and destination must be different.');
  mkdirSync(dirname(output), { recursive: true });
  // Exclusive reservation prevents accidentally replacing any existing database or backup.
  let handle;
  try { handle = openSync(output, 'wx'); }
  catch (err) { if (err.code === 'EEXIST') throw new Error(`Destination already exists; refusing to overwrite: ${output}`); throw err; }
  closeSync(handle);
  let db;
  try {
    db = new DatabaseSync(input, { readOnly: true });
    await backup(db, output);
    const check = new DatabaseSync(output);
    try {
      // A backup is one standalone file, without WAL/SHM sidecars.
      check.exec('PRAGMA journal_mode=DELETE');
      if (check.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Backup integrity check failed.');
    } finally { check.close(); }
    return output;
  } catch (err) { unlinkSync(output); throw err; }
  finally { db?.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    try { process.loadEnvFile(join(root, '.env')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
    const source = process.argv[2] || process.env.DB_PATH || join(root, 'data', 'wedding.sqlite');
    const destination = process.argv[3] || join(root, 'backups', `wedding-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    console.log(`Database backup saved: ${await backupDatabase(source, destination)}`);
  } catch (err) { console.error(err.message); process.exitCode = 1; }
}
