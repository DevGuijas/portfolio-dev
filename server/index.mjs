import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { openDatabase, root } from './db.mjs';
import { createApp } from './app.mjs';
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const origin = process.env.PUBLIC_ORIGIN || `http://localhost:${port}`;
const parsed = new URL(origin);
if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error('PUBLIC_ORIGIN deve conter somente protocolo, domínio e porta, sem barra final.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
if (parsed.protocol !== 'https:' && !['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Para acesso externo, configure PUBLIC_ORIGIN com HTTPS e um proxy reverso.');
const dataDir = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : resolve(root, 'data');
const db = openDatabase(dataDir);
if (!db.prepare('SELECT id FROM admin WHERE id=1').get()) { console.error('Crie seu administrador primeiro: npm run setup'); db.close(); process.exit(1); }
const server = createApp({ db, dataDir, origin, trustProxy: process.env.TRUST_PROXY === '1' }).listen(port, host, () => {
  console.log(`\nPortfólio: ${origin}\nAdmin: ${origin}/admin\nCtrl+C para parar.\n`);
  if (process.env.OPEN_BROWSER === '1' && process.platform === 'win32') execFile('explorer.exe', [origin], () => {});
});
server.on('error', err => { console.error(err.code === 'EADDRINUSE' ? 'Porta em uso. Feche o servidor anterior ou altere PORT e PUBLIC_ORIGIN no .env.' : err.message); db.close(); process.exitCode = 1; });
function stop() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
