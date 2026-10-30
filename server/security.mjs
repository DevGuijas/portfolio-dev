import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
const scrypt = promisify(scryptCallback);
export const passwordSchema = z.string().min(12, 'Use pelo menos 12 caracteres.').max(128);
export const usernameSchema = z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/);
export const tokenHash = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const expected = Buffer.from(hash, 'hex');
  return expected.length === key.length && timingSafeEqual(key, expected);
}
const text = (max, min = 0) => z.string().trim().min(min).max(max);
const webURL = z.string().max(2000).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, 'Use um link completo começando com https:// ou http://.');
const imagePath = z.string().refine(v => ['', '/portrait.png', '/about-code.png', '/icons/nodejs.png', '/icons/react.png', '/icons/sqlite.png', '/icons/mysql.png', '/icons/docker.png', '/icons/instagram.png', '/icons/linkedin.png'].includes(v) || /^\/uploads\/[a-f0-9-]{36}\.webp$/.test(v), 'Imagem inválida.');
export const settingsSchema = z.object({
  name: text(80, 1), handle: text(40, 1), role: text(100, 1), availability: text(100),
  heroTitle: text(160, 1), heroDescription: text(1500), heroButton: text(50, 1), portrait: imagePath, portraitAlt: text(200),
  aboutTitle: text(160), aboutText: text(6000), aboutImage: imagePath, aboutImageAlt: text(200), skills: z.array(text(60, 1)).max(30),
  skillDetails: z.array(z.object({ name: text(60,1), image: imagePath, description: text(500), detail: text(80) }).strict()).max(30),
  projectsTitle: text(160), projectsDescription: text(1500), contactTitle: text(160), contactDescription: text(1500),
  email: z.union([z.literal(''), z.email().max(254)]), github: webURL, instagram: webURL, linkedin: webURL, location: text(120),
  footer: text(200, 1), seoTitle: text(100, 1), seoDescription: text(300),
  showAbout: z.boolean(), showSkills: z.boolean(), showContact: z.boolean(),
  heroWord1: text(18,1), heroWord2: text(18,1), heroWord3: text(18,1), scrollLabel: text(30),
  skillsTitle: text(80), skillsSubtitle: text(160), contactEmphasis: text(160),
  navHome: text(50,1), navAbout: text(50,1), navSkills: text(50,1), navProjects: text(50,1), navContact: text(50,1), projectButton: text(50,1)
}).strict();
export const projectSchema = z.object({
  title: text(120, 1), description: text(4000, 1), link: webURL.refine(v => !!v, 'Informe o link do projeto.'),
  repository: webURL, tags: z.array(text(40, 1)).max(12), image: imagePath,
  featured: z.boolean(), published: z.boolean(), order: z.number().int().min(0).max(9999)
}).strict();
