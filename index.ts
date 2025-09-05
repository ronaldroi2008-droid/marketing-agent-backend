// index.ts — Enhanced Marketing Content Agent (Render-ready)
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { fetch as undiciFetch } from 'undici';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// Allow your Vercel frontend and local dev origins
app.use(cors({
  origin: [
    'https://marketing-agent-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Serve static files (CSS, JS, images) from the root directory
app.use(express.static(__dirname));

// Route for the root path - serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use undici's fetch (Node's global fetch doesn't support timeout)
const fetch = undiciFetch;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------- helper functions (fetchPageText, saveMarkdown, extractFilename, etc.) ----------
// (Add your helper functions here)

// TODO: Add your helper functions from VS Code here

async function runAgent(goal: string) {
  // Implementation from your VS Code
  // This is a placeholder - add your actual implementation
  return `Generated content for: ${goal}`;
}

// zod schema for request validation
const bodySchema = z.object({ goal: z.string().min(3).max(2500) });

// rate limit per IP (basic)
const requestCounts = new Map<string, number[]>();
const RATE_LIMIT = 15;
const RATE_LIMIT_WINDOW = 60_000;

app.post('/api/generate-content', async (req: Request, res: Response) => {
  const ip = (req.ip || 'unknown').toString();
  const now = Date.now();
  // Clean up old logs
  for (const [key, timestamps] of requestCounts.entries()) {
    const updated = timestamps.filter(t => t > now - RATE_LIMIT_WINDOW);
    if (updated.length === 0) requestCounts.delete(key);
    else requestCounts.set(key, updated);
  }
  const requests = requestCounts.get(ip) || [];
  if (requests.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests', limit: `${RATE_LIMIT}/min` });
  }
  requests.push(now);
  requestCounts.set(ip, requests);

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });
  try {
    const result = await runAgent(parsed.data.goal);
    res.json({ result });
  } catch (e: any) {
    console.error('AGENT ERROR:', e.message);
    res.status(500).json({ error: 'Agent error', details: e.message });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status endpoint for the dashboard
app.get('/api/status', (_req, res) => {
  res.json({
    server: 'Online',
    openai: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Fallback for undefined routes - serve the HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Always bind to 0.0.0.0 and use Render's env PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    Marketing Agent Backend running on port ${PORT}
    Frontend available at: http://localhost:${PORT}
    API Health check: http://localhost:${PORT}/api/health
  `);
});
