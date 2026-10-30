import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const defaultSettings = {
  name: 'Guilherme Sampaio', handle: '@DevGuijas', role: 'Desenvolvedor Full Stack',
  availability: 'Vamos construir algo juntos?', heroTitle: 'Ideias que ganham vida em código.',
  heroDescription: 'Olá, eu sou Guilherme. Este é meu espaço para compartilhar projetos, explorar possibilidades e transformar ideias em experiências digitais.',
  heroButton: 'Explorar projetos', portrait: '/portrait.png', portraitAlt: 'Retrato ilustrado de Guilherme Sampaio',
  aboutImage: '/about-code.png', aboutImageAlt: 'Ícone metálico de código HTML',
  aboutTitle: 'Proatividade para agir. Código para entregar.',
  aboutText: 'Do requisito à entrega: escrevo código estruturado, monto ambientes de homologação com Docker e testo antes de publicar.',
  skills: ['Node.js', 'React', 'MySQL', 'Docker Compose'],
  skillDetails: [
    { name: 'Node.js', image: '/icons/nodejs.png', description: 'Desenvolvimento de aplicações e APIs no servidor.', detail: 'Back-end' },
    { name: 'React', image: '/icons/react.png', description: 'Interfaces interativas e componentes reutilizáveis.', detail: 'Front-end' },
    { name: 'MySQL', image: '/icons/mysql.png', description: 'Persistência de dados com um banco relacional MySQL.', detail: 'Banco de dados' },
    {"name":"Docker Compose","image":"/icons/docker.png","description":"Configuração e execução de aplicações com múltiplos contêineres.","detail":"Contêineres"}
  ], projectsTitle: 'Do conceito ao código.',
  projectsDescription: 'Uma seleção do que venho construindo. Cada projeto, uma nova possibilidade.',
  contactTitle: 'TRANSFORMANDO IDEIAS EM', contactDescription: '', contactEmphasis: 'PROJETOS REAIS',
  heroWord1: 'think', heroWord2: 'plan', heroWord3: 'make', scrollLabel: 'Scroll down',
  skillsTitle: 'HABILIDADES & TECNOLOGIAS', skillsSubtitle: 'Tecnologias que uso nos meus projetos',
  navHome: 'Início', navAbout: 'Sobre mim', navSkills: 'Habilidades', navProjects: 'Projetos', navContact: 'Contato', projectButton: 'Ver projeto',
  email: '', github: 'https://github.com/DevGuijas', instagram: 'https://www.instagram.com/guisbz/', linkedin: 'https://www.linkedin.com/in/guisbz/', location: '',
  footer: '@DevGuijas - Github', seoTitle: '@DevGuijas — Portfólio', seoDescription: 'Conheça os projetos e o trabalho de @DevGuijas.',
  showAbout: true, showSkills: true, showContact: true
};

export function openDatabase(dataDir = resolve(root, 'data')) {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(resolve(dataDir, 'uploads'), { recursive: true });
  const db = new DatabaseSync(resolve(dataDir, 'portfolio.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    PRAGMA user_version=1;`);
  db.prepare('INSERT OR IGNORE INTO settings(id,content) VALUES(1,?)').run(JSON.stringify(defaultSettings));
  return db;
}
