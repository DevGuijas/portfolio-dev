import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { once } from 'node:events';
import { openDatabase, defaultSettings, root } from '../server/db.mjs';
import { hashPassword, verifyPassword } from '../server/security.mjs';
import { createApp } from '../server/app.mjs';
import sharp from 'sharp';
async function removeTestDirectory(path) {
  const absolute = resolve(path);
  if (dirname(absolute).toLowerCase() !== resolve(tmpdir()).toLowerCase() || !/^devguijas-(test|rate)-/.test(basename(absolute))) throw new Error('Pasta de teste fora do diretório temporário.');
  await rm(absolute, { recursive: true, force: true });
}

test('publicação, persistência e limites de segurança', async t => {
  const dataDir = await mkdtemp(join(tmpdir(), 'devguijas-test-'));
  let db = openDatabase(dataDir);
  const password = 'Senha de teste exclusiva 74!';
  const hash = await hashPassword(password);
  db.prepare('INSERT INTO admin VALUES(1,?,?)').run('admin_test', hash);
  const origin = 'http://localhost:3000';
  const server = createApp({ db, dataDir, origin, loginMax: 100 }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', csrf = '', id;
  async function call(path, method = 'GET', body, extra = {}) {
    return fetch(base + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  const draft = { title: 'Teste de portfólio', description: 'Descrição com acentos e conteúdo editável.', link: 'https://example.com/projeto', repository: '', tags: ['React'], image: '', featured: false, published: false, order: 2 };
  try {
    await t.test('hash salgado e verificação de senha', async () => { assert.notEqual(hash, password); assert.equal(await verifyPassword(password, hash), true); assert.equal(await verifyPassword('senha errada', hash), false); assert.notEqual(await hashPassword(password), hash); });
    await t.test('visitante não pode ler conteúdo privado nem modificar projetos', async () => {
      assert.equal((await call('/api/admin/content')).status, 401);
      assert.equal((await call('/api/admin/projects', 'POST', draft)).status, 401);
      assert.equal((await call('/api/admin/settings', 'PUT', defaultSettings)).status, 401);
    });
    await t.test('login rejeita origem diferente, falta de origem e credenciais incorretas', async () => {
      assert.equal((await call('/api/auth/login', 'POST', { username: 'admin_test', password }, { Origin: 'https://evil.example' })).status, 403);
      assert.equal((await call('/api/auth/login', 'POST', { username: 'admin_test', password }, { Origin: '' })).status, 403);
      assert.equal((await call('/api/auth/login', 'POST', { username: 'admin_test', password: 'errada' })).status, 401);
    });
    await t.test('login válido usa cookie HttpOnly/SameSite e sessão opaca', async () => {
      const res = await call('/api/auth/login', 'POST', { username: 'admin_test', password });
      assert.equal(res.status, 200); const setCookie = res.headers.get('set-cookie');
      assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/);
      cookie = setCookie.split(';')[0]; csrf = (await res.json()).csrf;
      const stored = db.prepare('SELECT * FROM sessions').get(); assert.notEqual(stored.token_hash, cookie.split('=')[1]);
    });
    await t.test('CSRF e origem são exigidos nas alterações autenticadas', async () => {
      assert.equal((await call('/api/admin/projects', 'POST', draft, { 'X-CSRF-Token': '' })).status, 403);
      assert.equal((await call('/api/admin/projects', 'POST', draft, { Origin: 'https://evil.example' })).status, 403);
    });
    await t.test('rascunho não vaza na API pública', async () => {
      const res = await call('/api/admin/projects', 'POST', draft); assert.equal(res.status, 201); id = (await res.json()).id;
      assert.equal((await (await call('/api/site')).json()).projects.length, 0);
      assert.equal((await (await call('/api/admin/content')).json()).projects.length, 1);
    });
    await t.test('edição, publicação, ordenação e conteúdo do site', async () => {
      assert.equal((await call(`/api/admin/projects/${id}`, 'PUT', { ...draft, title: 'Projeto publicado', published: true })).status, 200);
      const published = (await (await call('/api/site')).json()).projects; assert.equal(published[0].title, 'Projeto publicado');
      assert.equal((await call('/api/admin/settings', 'PUT', { ...defaultSettings, name: 'Guilherme editado', skills: ['Node.js', 'React', 'SQLite'], showAbout: false })).status, 200);
      const settings = (await (await call('/api/site')).json()).settings; assert.equal(settings.name, 'Guilherme editado'); assert.equal(settings.showAbout, false);
    });
    await t.test('rejeita links executáveis, credenciais em links, imagens arbitrárias e campos desconhecidos', async () => {
      for (const patch of [{ link: 'javascript:alert(1)' }, { link: 'data:text/html,test' }, { link: 'https://user:pass@example.com' }, { image: '/../../data/portfolio.sqlite' }, { extra: 'intruso' }, { order: -1 }, { published: 'true' }]) {
        assert.equal((await call('/api/admin/projects', 'POST', { ...draft, ...patch })).status, 400);
      }
      assert.equal((await call('/api/admin/projects/1%20OR%201=1', 'DELETE')).status, 400);
      assert.equal((await call('/api/admin/settings', 'PUT', { ...defaultSettings, email: 'not-an-email' })).status, 400);
    });
    await t.test('reprocessa imagem real e rejeita arquivo disfarçado', async () => {
      const headers = { Origin: origin, Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'image/png' };
      const bad = await fetch(base + '/api/admin/uploads', { method: 'POST', headers, body: '<svg onload="alert(1)"></svg>' }); assert.equal(bad.status, 400);
      const image = await readFile(join(root, 'public/portrait.png'));
      const res = await fetch(base + '/api/admin/uploads', { method: 'POST', headers, body: image }); assert.equal(res.status, 201);
      const uploaded = (await res.json()).path; assert.match(uploaded, /^\/uploads\/[a-f0-9-]+\.webp$/);
      const meta = await sharp(await readFile(join(dataDir, uploaded.replace(/^\//, '')))).metadata(); assert.equal(meta.format, 'webp');
      assert.equal((await fetch(base + uploaded)).status, 200);
      const large = await fetch(base + '/api/admin/uploads', { method: 'POST', headers, body: Buffer.alloc(5 * 1024 * 1024 + 1) }); assert.equal(large.status, 413);
    });
    await t.test('cabeçalhos de segurança e isolamento dos arquivos privados', async () => {
      const res = await call('/api/site'); assert.match(res.headers.get('content-security-policy'), /script-src 'self'/); assert.equal(res.headers.get('x-content-type-options'), 'nosniff'); assert.equal(res.headers.get('cache-control'), 'no-store');
      for (const path of ['/data/portfolio.sqlite', '/.env', '/server/db.mjs', '/package.json']) assert.equal((await fetch(base + path)).status, 404);
    });
    await t.test('sessão expirada é rejeitada', async () => {
      db.prepare('UPDATE sessions SET expires=?').run(Date.now() - 1000); assert.equal((await call('/api/auth/session')).status, 401);
      const res = await call('/api/auth/login', 'POST', { username: 'admin_test', password }); cookie = res.headers.get('set-cookie').split(';')[0]; csrf = (await res.json()).csrf;
    });
    await t.test('alteração de senha revoga sessões e senha antiga', async () => {
      assert.equal((await call('/api/auth/password', 'POST', { currentPassword: 'errada', newPassword: 'Uma senha nova segura 457!' })).status, 400);
      assert.equal((await call('/api/auth/password', 'POST', { currentPassword: password, newPassword: 'Uma senha nova segura 457!' })).status, 200);
      assert.equal((await call('/api/admin/content')).status, 401);
      assert.equal((await call('/api/auth/login', 'POST', { username: 'admin_test', password })).status, 401);
      const res = await call('/api/auth/login', 'POST', { username: 'admin_test', password: 'Uma senha nova segura 457!' }); assert.equal(res.status, 200); cookie = res.headers.get('set-cookie').split(';')[0]; csrf = (await res.json()).csrf;
    });
    await t.test('exclusão retira projeto público e logout revoga cookie', async () => {
      assert.equal((await call(`/api/admin/projects/${id}`, 'DELETE')).status, 200);
      assert.equal((await (await call('/api/site')).json()).projects.length, 0);
      assert.equal((await call(`/api/admin/projects/${id}`, 'DELETE')).status, 404);
      assert.equal((await call('/api/auth/logout', 'POST')).status, 200); assert.equal((await call('/api/admin/content')).status, 401);
    });
  } finally {
    await new Promise(resolve => server.close(resolve)); db.close();
    db = openDatabase(dataDir);
    assert.equal(JSON.parse(db.prepare('SELECT content FROM settings WHERE id=1').get().content).name, 'Guilherme editado');
    db.close(); await removeTestDirectory(dataDir);
  }
});

test('limite de login e cookie Secure no modo HTTPS', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'devguijas-rate-'));
  const db = openDatabase(dataDir); const password = 'Teste de rate limit 789!';
  db.prepare('INSERT INTO admin VALUES(1,?,?)').run('admin', await hashPassword(password));
  const server = createApp({ db, dataDir, origin: 'https://portfolio.example', loginMax: 2 }).listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/auth/login`;
  try {
    const options = { method: 'POST', headers: { Origin: 'https://portfolio.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password }) };
    const res = await fetch(url, options); assert.equal(res.status, 200); assert.match(res.headers.get('set-cookie'), /__Host-portfolio=/); assert.match(res.headers.get('set-cookie'), /Secure/); assert.ok(res.headers.get('strict-transport-security'));
    assert.equal((await fetch(url, options)).status, 200); assert.equal((await fetch(url, options)).status, 429);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); await removeTestDirectory(dataDir); }
});
