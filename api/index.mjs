// Função serverless da Vercel: expõe a API Express (/api/*).
// O disco da Vercel é somente leitura, exceto /tmp, e não é persistente.
import { openDatabase } from '../server/db.mjs';
import { createApp } from '../server/app.mjs';

const origin = process.env.PUBLIC_ORIGIN
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
const dataDir = process.env.DATA_DIR || '/tmp/devguijas-data';

const db = openDatabase(dataDir);

// Credenciais do /superadmin vêm SOMENTE de variáveis de ambiente da Vercel
// (nunca do código): ADMIN_USERNAME e ADMIN_PASSWORD_HASH (hash scrypt, não a senha).
const user = process.env.ADMIN_USERNAME;
const hash = process.env.ADMIN_PASSWORD_HASH;
if (user && hash) {
  db.prepare('INSERT INTO admin(id,username,password_hash) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,password_hash=excluded.password_hash').run(user, hash);
}

export default createApp({ db, dataDir, origin, trustProxy: true });
