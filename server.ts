import express, { type Request, type Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import healthRouter from './server/routes/health';
import tafsirRouter from './server/routes/tafsir';
import chatRouter from './server/routes/chat';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

app.use(healthRouter);
app.use(tafsirRouter);
app.use(chatRouter);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    console.log('Mounting dynamic Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Production mode detected. Serving static assets from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT} at host 0.0.0.0`);
  });
}

startServer();
