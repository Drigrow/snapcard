import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';
import { CardDB, UserDB } from './db.js';
import { CardPipeline } from './pipeline.js';
import { AuthService, requireAdmin, optionalAuth, DEFAULT_TTL_DAYS } from './services/auth.js';
import { OpenRouterService } from './services/openrouter.js';
import { TavilyService } from './services/tavily.js';

export const apiRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'photos');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// Multer memory storage for image processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// ================= AUTH ROUTES =================

/**
 * Admin Login (supports custom TTL in days)
 */
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password, ttlDays = DEFAULT_TTL_DAYS } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const user = UserDB.findByUsername(username.trim());
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误 (Invalid credentials)' });
    return;
  }

  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: '用户名或密码错误 (Invalid credentials)' });
    return;
  }

  const token = AuthService.generateToken(
    { userId: user.id, username: user.username, role: 'admin' },
    Number(ttlDays) || DEFAULT_TTL_DAYS
  );

  // Set long-lived cookie (in milliseconds)
  const maxAgeMs = (Number(ttlDays) || DEFAULT_TTL_DAYS) * 24 * 60 * 60 * 1000;
  res.cookie('snapcard_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: maxAgeMs,
    secure: process.env.NODE_ENV === 'production',
  });

  res.json({
    success: true,
    user: { id: user.id, username: user.username, role: 'admin' },
    token,
    ttlDays: Number(ttlDays) || DEFAULT_TTL_DAYS,
  });
});

/**
 * Get current session user status
 */
apiRouter.get('/auth/me', optionalAuth, (req: Request, res: Response) => {
  if (req.user && req.user.role === 'admin') {
    res.json({
      isAuthenticated: true,
      role: 'admin',
      username: req.user.username,
    });
  } else {
    res.json({
      isAuthenticated: false,
      role: 'guest',
    });
  }
});

/**
 * Logout
 */
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('snapcard_token');
  res.json({ success: true });
});

/**
 * Change Admin Password
 */
apiRouter.post('/auth/change-password', requireAdmin, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  const user = UserDB.findByUsername(req.user!.username);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: '当前旧密码不正确 (Current password incorrect)' });
    return;
  }

  UserDB.updatePassword(user.username, newPassword);
  res.json({ success: true, message: '密码修改成功' });
});

// ================= CARD ROUTES =================

/**
 * SSE Card Generation endpoint (ADMIN ONLY)
 */
apiRouter.post('/cards/generate', requireAdmin, async (req: Request, res: Response) => {
  const { query, audience, needImage, photoUrl, openRouterKey, tavilyKey, model, imageModel } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  const reqOpenRouterKey = (openRouterKey || req.headers['x-openrouter-key'] || '').toString();
  const reqTavilyKey = (tavilyKey || req.headers['x-tavily-key'] || '').toString();

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await CardPipeline.execute({
      query: query.trim(),
      audience,
      needImage: needImage !== false,
      photoUrl,
      openRouterKey: reqOpenRouterKey,
      tavilyKey: reqTavilyKey,
      model,
      imageModel,
      onEvent: (event, data) => sendEvent(event, data),
    });
  } catch (err: any) {
    console.error('[Generate Route Error]:', err);
    sendEvent('error', { message: err.message || 'Card generation failed' });
  } finally {
    res.end();
  }
});

/**
 * List Cards (with search & filters).
 * If caller is Guest, strictly returns public cards only!
 */
apiRouter.get('/cards', optionalAuth, (req: Request, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const { search, tag, audience, favoriteOnly, limit, offset } = req.query;

    const result = CardDB.getAll({
      search: search ? String(search) : undefined,
      tag: tag ? String(tag) : undefined,
      audience: audience ? String(audience) : undefined,
      favoriteOnly: isAdmin && favoriteOnly === 'true',
      publicOnly: !isAdmin, // Guests can ONLY view public cards
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    res.json({
      ...result,
      isGuest: !isAdmin,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/cards/:id', optionalAuth, (req: Request, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const cardId = req.params.id as string;
    const card = CardDB.getById(cardId, !isAdmin);

    if (!card) {
      res.status(404).json({ error: 'Card not found or access restricted' });
      return;
    }

    const messages = isAdmin ? CardDB.getMessages(card.id) : [];
    res.json({ card, messages, isGuest: !isAdmin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle Card Public Visibility (ADMIN ONLY)
 */
apiRouter.post('/cards/:id/public', requireAdmin, (req: Request, res: Response) => {
  try {
    const isPublic = CardDB.togglePublic(req.params.id as string);
    res.json({ success: true, isPublic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle Favorite (ADMIN ONLY)
 */
apiRouter.post('/cards/:id/favorite', requireAdmin, (req: Request, res: Response) => {
  try {
    const isFavorite = CardDB.toggleFavorite(req.params.id as string);
    res.json({ success: true, isFavorite });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete Card (ADMIN ONLY)
 */
apiRouter.delete('/cards/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = CardDB.delete(req.params.id as string);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Single Card Follow-up Q&A (ADMIN ONLY)
 */
apiRouter.post('/cards/:id/ask', requireAdmin, async (req: Request, res: Response) => {
  try {
    const card = CardDB.getById(req.params.id as string, false);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const { question, openRouterKey, model } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const reqKey = (openRouterKey || req.headers['x-openrouter-key'] || '').toString();

    const answer = await CardPipeline.answerFollowUp({
      card,
      question,
      openRouterKey: reqKey,
      model,
    });

    res.json({ success: true, answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Photo upload (ADMIN ONLY)
 */
apiRouter.post('/upload', requireAdmin, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
    const targetPath = path.join(PHOTOS_DIR, filename);

    // Compress & standardize to WebP
    await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(targetPath);

    const relativeUrl = `/uploads/photos/${filename}`;
    res.json({ url: relativeUrl, success: true });
  } catch (err: any) {
    console.error('[Upload Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verify API Keys & Connectivity (ADMIN ONLY)
 */
apiRouter.post('/settings/verify', requireAdmin, async (req: Request, res: Response) => {
  const { openRouterKey, tavilyKey } = req.body;

  const results = {
    openRouter: { valid: false, message: '' },
    tavily: { valid: false, message: '' },
  };

  if (openRouterKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${openRouterKey}` },
      });
      if (resp.ok) {
        results.openRouter.valid = true;
        results.openRouter.message = 'Key is valid and active';
      } else {
        results.openRouter.message = `Verification returned ${resp.status}`;
      }
    } catch (e: any) {
      results.openRouter.message = e.message;
    }
  }

  if (tavilyKey) {
    try {
      const searchRes = await TavilyService.search('test', { apiKey: tavilyKey, maxResults: 1 });
      if (searchRes.success) {
        results.tavily.valid = true;
        results.tavily.message = 'Tavily Search API connected successfully';
      } else {
        results.tavily.message = searchRes.error || 'Failed to connect to Tavily';
      }
    } catch (e: any) {
      results.tavily.message = e.message;
    }
  }

  res.json(results);
});
