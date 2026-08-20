import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload folders exist
['photos', 'generated'].forEach((dir) => {
  const p = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploaded & generated images
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend dist bundle in production / when built (Express 5 compatible SPA handler)
const DIST_DIR = path.resolve('dist');
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    } else {
      next();
    }
  });
  console.log(`📦 Serving frontend bundle from: ${DIST_DIR}`);
}

app.listen(Number(PORT), HOST, () => {
  console.log(`\n🚀 [SnapCard Server] Running on http://${HOST}:${PORT}`);
  console.log(`🌐 Local & Network Accessible`);
  console.log(`📁 Static uploads served from: ${path.resolve(UPLOAD_DIR)}`);
});
