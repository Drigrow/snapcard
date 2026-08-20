import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = process.env.DATA_DIR || './data';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'snapcard.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode
db.pragma('journal_mode = WAL');

// 1. Initialize core tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    oneLiner TEXT,
    audience TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    diagram TEXT,
    images TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    language TEXT DEFAULT 'zh-CN',
    query TEXT NOT NULL,
    isFavorite INTEGER DEFAULT 0,
    isPublic INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS card_messages (
    id TEXT PRIMARY KEY,
    cardId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY(cardId) REFERENCES cards(id) ON DELETE CASCADE
  );
`);

// 2. Migration: Ensure isPublic column exists if table existed prior
try {
  const columns = db.pragma('table_info(cards)') as any[];
  if (!columns.some((c) => c.name === 'isPublic')) {
    db.exec('ALTER TABLE cards ADD COLUMN isPublic INTEGER DEFAULT 0');
    console.log('[DB] Migrated cards table with isPublic column');
  }
} catch (e) {
  console.warn('[DB Migration Check]', e);
}

// 3. Create indexes after ensuring columns exist
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cards_createdAt ON cards(createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_cards_isFavorite ON cards(isFavorite);
  CREATE INDEX IF NOT EXISTS idx_cards_isPublic ON cards(isPublic);
  CREATE INDEX IF NOT EXISTS idx_card_messages_cardId ON card_messages(cardId);
`);

// Seed default admin user if none exists
const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any).count;
if (adminCount === 0) {
  const defaultAdmin = process.env.ADMIN_USER || 'admin';
  const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(defaultPass, salt);
  db.prepare(`
    INSERT INTO users (id, username, passwordHash, role, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run('user_admin_root', defaultAdmin, hash, 'admin', Date.now());
  console.log(`[DB] Created initial admin account (username: "${defaultAdmin}", password: "${defaultPass}")`);
}

export interface CardImage {
  url: string;
  alt?: string;
  source: 'web' | 'generated' | 'uploaded';
}

export interface CardRecord {
  id: string;
  title: string;
  oneLiner?: string;
  audience: 'student' | 'general' | 'expert';
  content: string;
  diagram?: string | null;
  images: CardImage[];
  tags: string[];
  language: string;
  query: string;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CardMessage {
  id: string;
  cardId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin';
  createdAt: number;
}

export const UserDB = {
  findByUsername(username: string): UserRecord | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return (stmt.get(username) as UserRecord) || null;
  },

  findById(id: string): UserRecord | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return (stmt.get(id) as UserRecord) || null;
  },

  updatePassword(username: string, newPasswordPlain: string): boolean {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPasswordPlain, salt);
    const stmt = db.prepare('UPDATE users SET passwordHash = ? WHERE username = ?');
    const res = stmt.run(hash, username);
    return res.changes > 0;
  }
};

export const CardDB = {
  create(card: Omit<CardRecord, 'createdAt' | 'updatedAt' | 'isFavorite' | 'isPublic'> & { isFavorite?: boolean; isPublic?: boolean }): CardRecord {
    const now = Date.now();
    const isFav = card.isFavorite ? 1 : 0;
    const isPub = card.isPublic ? 1 : 0;
    const stmt = db.prepare(`
      INSERT INTO cards (id, title, oneLiner, audience, content, diagram, images, tags, language, query, isFavorite, isPublic, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      card.id,
      card.title,
      card.oneLiner || '',
      card.audience,
      card.content,
      card.diagram || null,
      JSON.stringify(card.images || []),
      JSON.stringify(card.tags || []),
      card.language || 'zh-CN',
      card.query,
      isFav,
      isPub,
      now,
      now
    );

    return {
      ...card,
      isFavorite: !!isFav,
      isPublic: !!isPub,
      createdAt: now,
      updatedAt: now,
    };
  },

  getAll(options?: {
    search?: string;
    tag?: string;
    audience?: string;
    favoriteOnly?: boolean;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
  }): { cards: CardRecord[]; total: number } {
    const {
      search = '',
      tag = '',
      audience = '',
      favoriteOnly = false,
      publicOnly = false,
      limit = 50,
      offset = 0,
    } = options || {};

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (publicOnly) {
      whereClauses.push('isPublic = 1');
    }
    if (favoriteOnly) {
      whereClauses.push('isFavorite = 1');
    }
    if (audience) {
      whereClauses.push('audience = ?');
      params.push(audience);
    }
    if (search) {
      whereClauses.push('(title LIKE ? OR oneLiner LIKE ? OR query LIKE ? OR tags LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (tag) {
      whereClauses.push('tags LIKE ?');
      params.push(`%"${tag}"%`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM cards ${whereStr}`);
    const total = (countStmt.get(...params) as { count: number }).count;

    const listStmt = db.prepare(`
      SELECT * FROM cards ${whereStr}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `);

    const rows = listStmt.all(...params, limit, offset) as any[];

    const cards: CardRecord[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      oneLiner: row.oneLiner,
      audience: row.audience,
      content: row.content,
      diagram: row.diagram,
      images: JSON.parse(row.images || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      language: row.language,
      query: row.query,
      isFavorite: !!row.isFavorite,
      isPublic: !!row.isPublic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return { cards, total };
  },

  getById(id: string, publicOnly: boolean = false): CardRecord | null {
    let sql = 'SELECT * FROM cards WHERE id = ?';
    if (publicOnly) sql += ' AND isPublic = 1';
    const stmt = db.prepare(sql);
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      oneLiner: row.oneLiner,
      audience: row.audience,
      content: row.content,
      diagram: row.diagram,
      images: JSON.parse(row.images || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      language: row.language,
      query: row.query,
      isFavorite: !!row.isFavorite,
      isPublic: !!row.isPublic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  toggleFavorite(id: string): boolean {
    const card = this.getById(id, false);
    if (!card) return false;

    const newVal = card.isFavorite ? 0 : 1;
    const stmt = db.prepare('UPDATE cards SET isFavorite = ?, updatedAt = ? WHERE id = ?');
    stmt.run(newVal, Date.now(), id);
    return !card.isFavorite;
  },

  togglePublic(id: string): boolean {
    const card = this.getById(id, false);
    if (!card) return false;

    const newVal = card.isPublic ? 0 : 1;
    const stmt = db.prepare('UPDATE cards SET isPublic = ?, updatedAt = ? WHERE id = ?');
    stmt.run(newVal, Date.now(), id);
    return !card.isPublic;
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Follow-up messages (card-scoped)
  addMessage(cardId: string, role: 'user' | 'assistant', content: string): CardMessage {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO card_messages (id, cardId, role, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, cardId, role, content, now);

    return { id, cardId, role, content, createdAt: now };
  },

  getMessages(cardId: string): CardMessage[] {
    const stmt = db.prepare('SELECT * FROM card_messages WHERE cardId = ? ORDER BY createdAt ASC');
    return stmt.all(cardId) as CardMessage[];
  },
};
