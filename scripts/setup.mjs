import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { resolve } from 'node:path';
import { openDatabase, root } from '../server/db.mjs';
import { hashPassword, passwordSchema, usernameSchema } from '../server/security.mjs';

const dataDir = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : resolve(root, 'data');
const db = openDatabase(dataDir);
const exists = db.prepare('SELECT id FROM admin WHERE id=1').get();
const reset = process.argv.includes('--reset');
if (exists && !reset) { console.log('Administrador já configurado.'); db.close(); process.exit(0); }
if (!process.stdin.isTTY) { console.error('Execute este comando em um terminal interativo para criar sua senha.'); db.close(); process.exit(1); }
let muted = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback(); } });
const rl = createInterface({ input: process.stdin, output, terminal: true });
rl.on('SIGINT', () => { muted = false; console.log('\nOperação cancelada.'); db.close(); process.exit(1); });
async function ask(prompt, hidden = false) {
  muted = false; process.stdout.write(prompt); muted = hidden;
  const value = await rl.question(''); muted = false;
  if (hidden) process.stdout.write('\n');
  return value;
}
try {
  console.log(reset ? '\nRECUPERAÇÃO LOCAL — Todas as sessões serão encerradas.' : '\nPRIMEIRO ACESSO — Crie sua conta de administrador.');
  console.log('A senha não aparece enquanto você digita. Guarde-a em um local seguro.\n');
  const username = usernameSchema.parse(await ask('Usuário (3-40 letras, números, ponto, _ ou -): '));
  const password = passwordSchema.parse(await ask('Senha (12-128 caracteres): ', true));
  const confirmation = await ask('Repita a senha: ', true);
  if (password !== confirmation) throw new Error('As senhas não conferem. Execute novamente.');
  const hash = await hashPassword(password);
  db.exec('BEGIN');
  try { db.prepare('INSERT INTO admin(id,username,password_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash').run(username, hash); db.prepare('DELETE FROM sessions').run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
  console.log('\nAdministrador configurado. Acesse /admin no navegador.');
} catch (err) { console.error(err.issues ? err.issues.map(i => i.message).join('\n') : err.message); process.exitCode = 1; }
finally { muted = false; rl.close(); db.close(); }
