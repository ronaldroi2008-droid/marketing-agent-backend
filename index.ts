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

// Use undici's fetch (Node’s global fetch doesn’t support timeout)
const fetch = undiciFetch;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------- helper functions (fetchPageText, saveMarkdown, extractFilename, etc.) ----------
// (Ilipat dito ang lahat ng helper functions na nasa VS Code mo. Huwag kalimutan baguhin ang
// 'timeout' option: Node fetch/undici hindi nagtatanggap nito. Kung kailangan mo ng timeout,
// kailangan mong gumamit ng AbortController; sa ngayon puwede mo itong alisin.)

// TODO: copy your helpers from VS Code here, for brevity not shown.

async function runAgent(goal: string) {
  // Kinopya mula sa VS Code mo: detectKind, extractTone, generateFacebookPost, atbp.
  // Tiyaking gumagamit ng client.chat.completions para sa draft/refine.
  // Tanggalin ang paggamit ng fetch timeout na hindi suportado.
}

// zod schema for request validation
const bodySchema = z.object({ goal: z.string().min(3).max(2500) });

// rate limit per IP (basic)
const requestCounts = new Map<string, number[]>();
const RATE_LIMIT = 15;
const RATE_LIMIT_WINDOW = 60_000;

app.post('/agent', async (req: Request, res: Response) => {
  const ip = (req.ip || 'unknown').toString();
  const now = Date.now();
  // linis ng lumang logs
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Always bind to 0.0.0.0 and use Render’s env PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agent API listening at http://0.0.0.0:${PORT}`);
});
