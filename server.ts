import express, { type Request, type Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import healthRouter from './server/routes/health';

const app = express();

const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(healthRouter);

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
      const filePath = path.join(distPath, 'index.html');
      res.sendFile(filePath, err => {
        if (err) {
          res.status(404).send('<html dir="rtl"><body style="font-family:sans-serif;padding:4rem;text-align:center;background:#0E0E0E;color:#E0E0E0"><h1 style="color:#F27D26">الصفحة غير موجودة</h1><p>عذراً، لم نعثر على الصفحة المطلوبة.</p><a href="/" style="color:#F27D26">العودة إلى الصفحة الرئيسية</a></body></html>');
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT} at host 0.0.0.0`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
