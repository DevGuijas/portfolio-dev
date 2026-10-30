import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { z } from 'zod';
import { root, defaultSettings } from './db.mjs';
import { tokenHash, verifyPassword, hashPassword, passwordSchema, usernameSchema, settingsSchema, projectSchema } from './security.mjs';

export function createApp({ db, dataDir = resolve(root, 'data'), origin = 'http://localhost:3000', trustProxy = false, loginMax = 8 }) {
  const app = express();
  const secure = new URL(origin).protocol === 'https:';
  const cookieName = secure ? '__Host-portfolio' : 'portfolio_session';
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/' };
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'blob:'], connectSrc: ["'self'"], fontSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'none'"], formAction: ["'self'"], frameAncestors: ["'none'"], upgradeInsecureRequests: secure ? [] : null } },
    strictTransportSecurity: secure ? undefined : false
  }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin) return res.status(403).json({ error: 'Origem da solicitação não autorizada. Use o endereço configurado do site.' });
    next();
  });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas solicitações. Aguarde um minuto.' } }));
  app.use(express.json({ limit: '48kb', type: 'application/json' }));
  function auth(req, res, next) {
    const match = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`));
    const token = match?.slice(cookieName.length + 1);
    const session = token && /^[a-f0-9]{64}$/.test(token) ? db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(tokenHash(token), Date.now()) : null;
    if (!session) return res.status(401).json({ error: 'Entre novamente para continuar.' });
    req.session = session;
    if (!['GET', 'HEAD'].includes(req.method) && req.get('x-csrf-token') !== session.csrf) return res.status(403).json({ error: 'Solicitação inválida. Recarregue a página.' });
    next();
  }
  const settings = () => ({ ...defaultSettings, ...JSON.parse(db.prepare('SELECT content FROM settings WHERE id=1').get().content) });
  const project = row => ({ ...JSON.parse(row.content), id: row.id, createdAt: row.created_at });
  app.get('/api/site', (req, res) => res.json({ settings: settings(), projects: db.prepare('SELECT * FROM projects WHERE published=1 ORDER BY sort_order, id DESC').all().map(project) }));
  const loginLimiter = rateLimit({ windowMs: 15 * 60000, limit: loginMax, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Limite de tentativas atingido. Aguarde 15 minutos.' } });
  const dummyHash = '00000000000000000000000000000000:' + '00'.repeat(64);
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const input = z.object({ username: usernameSchema, password: z.string().min(1).max(128) }).strict().parse(req.body);
    const admin = db.prepare('SELECT * FROM admin WHERE id=1').get();
    const valid = await verifyPassword(input.password, admin?.password_hash || dummyHash);
    if (!admin || admin.username !== input.username || !valid || db.prepare('SELECT password_hash FROM admin WHERE id=1').get()?.password_hash !== admin.password_hash) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    const token = randomBytes(32).toString('hex');
    const csrf = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    // Only one active admin session; new login revokes any previous session.
    db.prepare('DELETE FROM sessions').run();
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token), csrf, Date.now() + 8 * 3600000);
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 3600000 }).json({ username: admin.username, csrf });
  });
  app.get('/api/auth/session', auth, (req, res) => res.json({ username: db.prepare('SELECT username FROM admin WHERE id=1').get().username, csrf: req.session.csrf }));
  app.post('/api/auth/logout', auth, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.session.token_hash);
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  app.post('/api/auth/password', auth, loginLimiter, async (req, res) => {
    const input = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).strict().parse(req.body);
    const admin = db.prepare('SELECT * FROM admin WHERE id=1').get();
    if (!await verifyPassword(input.currentPassword, admin.password_hash)) return res.status(400).json({ error: 'A senha atual não confere.' });
    const hash = await hashPassword(input.newPassword);
    db.exec('BEGIN');
    try { db.prepare('UPDATE admin SET password_hash=? WHERE id=1').run(hash); db.prepare('DELETE FROM sessions').run(); db.exec('COMMIT'); } catch (err) { db.exec('ROLLBACK'); throw err; }
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  app.use('/api/admin', auth);
  app.get('/api/admin/content', (req, res) => res.json({ settings: settings(), projects: db.prepare('SELECT * FROM projects ORDER BY sort_order, id DESC').all().map(project) }));
  app.put('/api/admin/settings', (req, res) => {
    const value = settingsSchema.parse(req.body);
    db.prepare('UPDATE settings SET content=? WHERE id=1').run(JSON.stringify(value));
    res.json(value);
  });
  app.post('/api/admin/projects', (req, res) => {
    const value = projectSchema.parse(req.body);
    const result = db.prepare('INSERT INTO projects(content,published,sort_order) VALUES(?,?,?)').run(JSON.stringify(value), +value.published, value.order);
    res.status(201).json({ ...value, id: Number(result.lastInsertRowid) });
  });
  function projectId(req, res, next) {
    if (!/^[1-9]\d{0,9}$/.test(req.params.id)) return res.status(400).json({ error: 'Identificador inválido.' });
    req.projectId = Number(req.params.id); next();
  }
  app.put('/api/admin/projects/:id', projectId, (req, res) => {
    const value = projectSchema.parse(req.body);
    const result = db.prepare('UPDATE projects SET content=?, published=?, sort_order=? WHERE id=?').run(JSON.stringify(value), +value.published, value.order, req.projectId);
    if (!result.changes) return res.status(404).json({ error: 'Projeto não encontrado.' });
    res.json({ ...value, id: req.projectId });
  });
  app.delete('/api/admin/projects/:id', projectId, (req, res) => {
    const result = db.prepare('DELETE FROM projects WHERE id=?').run(req.projectId);
    if (!result.changes) return res.status(404).json({ error: 'Projeto não encontrado.' });
    res.json({ ok: true });
  });
  app.post('/api/admin/uploads', express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '5mb' }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Selecione uma imagem PNG, JPG ou WebP de até 5 MB.' });
    let buffer;
    try {
      const input = sharp(req.body, { limitInputPixels: 25000000, animated: false });
      const meta = await input.metadata();
      if (!['png', 'jpeg', 'webp'].includes(meta.format) || (meta.pages || 1) > 1) throw new Error('unsupported');
      buffer = await input.rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    } catch { return res.status(400).json({ error: 'Imagem inválida. Use PNG, JPG ou WebP estático de até 25 megapixels.' }); }
    const name = `${randomUUID()}.webp`;
    await writeFile(resolve(dataDir, 'uploads', name), buffer, { flag: 'wx' });
    res.status(201).json({ path: `/uploads/${name}` });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use('/uploads', express.static(resolve(dataDir, 'uploads'), { dotfiles: 'deny', index: false, maxAge: '1d' }));
  app.use(express.static(resolve(root, 'dist'), { dotfiles: 'deny', index: false, maxAge: '1h' }));
  app.get(['/', '/superadmin', '/superadmin/'], (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(resolve(root, 'dist/index.html')); });
  app.use((req, res) => res.status(404).send('Página não encontrada.'));
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Verifique os campos informados.', details: err.issues.map(i => `${i.path.join('.')}: ${i.message}`) });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo ou conteúdo acima do limite permitido.' });
    if (err instanceof SyntaxError && err.status === 400) return res.status(400).json({ error: 'Conteúdo JSON inválido.' });
    console.error('Falha interna:', err.message);
    res.status(500).json({ error: 'Não foi possível concluir. Tente novamente.' });
  });
  return app;
}
