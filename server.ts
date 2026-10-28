import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import {
  initDatabase,
  getHabitsByUser,
  createHabitForUser,
  updateHabitForUser,
  deleteHabitForUser,
  getLogsByUser,
  upsertLogForUser,
} from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render automatically injects the PORT environment variable
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for external frontends or cross-origin requests
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Initialize MongoDB connection
await initDatabase();

// Healthcheck endpoints for Render monitoring and zero-downtime deploys
app.get(['/healthz', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Middleware to extract user ID from header
const getUserId = (req: express.Request): string => {
  const header = req.headers['x-user-id'] || req.headers['authorization'];
  if (typeof header === 'string' && header.trim()) {
    return header.replace(/^Bearer\s+/i, '').trim();
  }
  return 'anonymous-user';
};

// API Routes
app.get('/api/habits', async (req, res) => {
  try {
    const userId = getUserId(req);
    const habits = await getHabitsByUser(userId);
    res.json({ habits });
  } catch (error: unknown) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const userId = getUserId(req);
    const newHabit = await createHabitForUser(userId, req.body);
    res.status(201).json({ habit: newHabit });
  } catch (error: unknown) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/habits/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const updated = await updateHabitForUser(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ habit: updated });
  } catch (error: unknown) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await deleteHabitForUser(userId, req.params.id);
    res.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const userId = getUserId(req);
    const logs = await getLogsByUser(userId);
    res.json({ logs });
  } catch (error: unknown) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { habitId, date, completed, value, notes, source } = req.body;
    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date are required' });
    }
    const log = await upsertLogForUser(userId, habitId, date, {
      completed,
      value,
      notes,
      source,
    });
    res.json({ log });
  } catch (error: unknown) {
    console.error('Error upserting log:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Vite Dev Server middleware or Static Production build
const distPath = path.join(__dirname, 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (host: 0.0.0.0)`);
});
