import { Router, type Request, type Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

function getDeviceId(req: Request, res: Response): string | null {
  const deviceId = req.headers['x-device-id'] as string | undefined;
  if (!deviceId) {
    res.status(400).json({ error: 'Missing x-device-id header' });
    return null;
  }
  return deviceId;
}

router.get('/api/user-data', async (req: Request, res: Response) => {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  try {
    const { data: existing } = await supabase
      .from('user_data')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      return res.json(existing);
    }

    const { data, error } = await supabase
      .from('user_data')
      .insert({ device_id: deviceId })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error });
  }
});

router.put('/api/user-data', async (req: Request, res: Response) => {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  const { bookmarks, history, completed, theme } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_data')
      .upsert({
        device_id: deviceId,
        bookmarks: bookmarks ?? [],
        history: history ?? [],
        completed: completed ?? [],
        theme: theme ?? 'dark',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error });
  }
});

router.get('/api/user-data/export', async (req: Request, res: Response) => {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error });
    }

    if (!data) {
      return res.status(404).json({ error: 'User data not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="thilal-user-data.json"');
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error });
  }
});

router.post('/api/user-data/import', async (req: Request, res: Response) => {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  const { bookmarks, history, completed, theme } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_data')
      .upsert({
        device_id: deviceId,
        bookmarks: bookmarks ?? [],
        history: history ?? [],
        completed: completed ?? [],
        theme: theme ?? 'dark',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.json({ message: 'imported successfully', data });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

export default router;
