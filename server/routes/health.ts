import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
