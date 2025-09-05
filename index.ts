// index.ts — Fixed path handling for Render deployment
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory (one level up from dist)
const rootDir = path.resolve(__dirname, '..');

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    'https://marketing-agent-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:3002',
    'https://marketing-agent-backend-4nqq.onrender.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Serve static files from the root directory
app.use(express.static(rootDir));

// API Routes
app.post('/api/generate-content', async (req: Request, res: Response) => {
  try {
    // Add your content generation logic here
    const { goal } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }
    
    // For now, simulate content generation
    const result = `Generated content for: ${goal}`;
    
    res.json({ result });
  } catch (error: any) {
    console.error('Content generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
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

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Error handling
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
    Marketing Agent Backend running on port ${PORT}
    API Health check: https://marketing-agent-backend-4nqq.onrender.com/api/health
  `);
});
