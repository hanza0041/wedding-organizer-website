import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(root, '.env')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
const command = process.argv[2] || 'help';
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
const host = process.env.HOST || '127.0.0.1';
const origin = `http://${host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '[::1]' : host.includes(':') ? `[${host}]` : host}:${port}`;
const config = resolve(root, process.env.CF_CONFIG || '.cloudflared/config.yml');
const children = new Set();
let closing = false;
function stop(code = 0) {
  if (closing) return; closing = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 500);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
function start(executable, args, env = process.env) {
  const child = spawn(executable, args, { cwd: root, stdio: 'inherit', env, windowsHide: true });
  children.add(child);
  child.on('error', err => { console.error(`${executable}: ${err.message}. Install cloudflared if it is missing (see README.md).`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!closing) stop(code || 0); });
  return child;
}
async function ready(child) {
  for (let count = 0; count < 100; count++) {
    if (child.exitCode !== null || closing) throw new Error('Server stopped before becoming ready');
    try { const r = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(500) }); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Server was not ready in time');
}
const required = name => { if (!process.env[name]) throw new Error(`Set ${name} in .env first (see README.md).`); return process.env[name]; };

try {
  if (command === 'help') {
    console.log(`ever after. — shared wedding planner\n\nmake server         Run local server (Node.js 24+)\nmake dev            Watch files and restart server\nmake test           Test persistence, sharing and API access\nmake share          Server + Cloudflare Quick Tunnel (random URL)\nmake tunnel         Server + fixed URL (token or named-tunnel config)\n\nOptional locally-managed setup:\nmake tunnel-login   Authenticate cloudflared\nmake tunnel-create  Create TUNNEL_NAME from .env\nmake tunnel-config  Write config from TUNNEL_ID, TUNNEL_HOSTNAME, TUNNEL_CREDENTIALS\nmake tunnel-dns     Route TUNNEL_HOSTNAME to TUNNEL_ID\n\nConfigure .env and read README.md for a permanent URL.\nNo make? Run node scripts/run.mjs <command> instead.`);
    console.log('\nFinance & Docker:\nmake backup         Snapshot the local SQLite database\nmake docker-up      Start app + persistent SQLite volume\nmake docker-import  Copy native database into an empty Docker volume\nmake docker-backup  Save Docker database snapshot to backups/\nmake docker-down    Stop containers, preserve database volume\nmake docker-tunnel  Docker app + fixed-hostname tunnel\nmake docker-check   Test backup and container recreation in an isolated project');
  } else if (command === 'configure') {
    const tunnel = required('TUNNEL_ID');
    const hostname = required('TUNNEL_HOSTNAME');
    const credentials = resolve(root, required('TUNNEL_CREDENTIALS'));
    if (!/^[a-f\d-]{36}$/i.test(tunnel)) throw new Error('TUNNEL_ID must be your tunnel UUID.');
    if (!/^(?=.{1,253}$)[a-z\d](?:[a-z\d.-]*[a-z\d])?\.[a-z]{2,}$/i.test(hostname) || hostname === 'wedding.example.com') throw new Error('Set TUNNEL_HOSTNAME to a hostname in your Cloudflare domain.');
    if (!existsSync(credentials)) throw new Error('TUNNEL_CREDENTIALS file does not exist. Use the path printed by cloudflared tunnel create.');
    if (existsSync(config)) throw new Error(`Config already exists: ${config}. Edit it directly to preserve your settings.`);
    mkdirSync(dirname(config), { recursive: true });
    writeFileSync(config, `tunnel: ${JSON.stringify(tunnel)}\ncredentials-file: ${JSON.stringify(credentials)}\ningress:\n  - hostname: ${JSON.stringify(hostname)}\n    service: ${origin}\n  - service: http_status:404\n`);
    console.log(`Wrote ${config}. Next: make tunnel-dns, then make tunnel.`);
  } else if (command === 'create') {
    start('cloudflared', ['tunnel', 'create', required('TUNNEL_NAME')]);
  } else if (command === 'dns') {
    start('cloudflared', ['tunnel', 'route', 'dns', required('TUNNEL_ID'), required('TUNNEL_HOSTNAME')]);
  } else if (['server', 'quick', 'named'].includes(command)) {
    const env = { ...process.env };
    if (command === 'named' && !env.CLOUDFLARE_TUNNEL_TOKEN && !existsSync(config)) throw new Error('Set CLOUDFLARE_TUNNEL_TOKEN in .env or run make tunnel-config first.');
    // Do not attach to an unknown process or expose a different app using the port.
    try {
      await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(500) });
      throw new Error(`Port ${port} already has a server. Stop it before running make ${command}.`);
    } catch (err) { if (err.message.includes('already has')) throw err; }
    const server = start(process.execPath, [join(root, 'server.mjs')]);
    await ready(server);
    console.log(`Local: ${origin} — press Ctrl+C to stop all started processes.`);
    if (command === 'quick') {
      console.log('Quick Tunnel assigns a new URL on every start. For a fixed URL use make tunnel.');
      start('cloudflared', ['tunnel', '--no-autoupdate', '--url', origin]);
    } else if (command === 'named') {
      if (env.CLOUDFLARE_TUNNEL_TOKEN) {
        // cloudflared reads TUNNEL_TOKEN from the environment; secrets never enter command arguments.
        env.TUNNEL_TOKEN = env.CLOUDFLARE_TUNNEL_TOKEN;
        start('cloudflared', ['tunnel', '--no-autoupdate', 'run'], env);
      } else start('cloudflared', ['tunnel', '--no-autoupdate', '--config', config, 'run']);
    }
  } else throw new Error(`Unknown command: ${command}`);
} catch (err) { console.error(err.message); stop(1); }
