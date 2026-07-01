import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

function getDeviceId(req: express.Request): string | undefined {
  return req.headers['x-device-id'] as string | undefined;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  return createClient(url, key);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/user-data', async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return res.status(400).json({ error: 'Missing x-device-id' });
  const sb = getSupabase();
  if (!sb) return res.status(500).json({ error: 'Server not configured' });

  try {
    const { data: existing } = await sb.from('user_data').select('*').eq('device_id', deviceId).maybeSingle();
    if (existing) return res.json(existing);

    const { data, error } = await sb.from('user_data').insert({ device_id: deviceId }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

app.put('/api/user-data', async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return res.status(400).json({ error: 'Missing x-device-id' });
  const sb = getSupabase();
  if (!sb) return res.status(500).json({ error: 'Server not configured' });

  const { bookmarks, history, completed, theme } = req.body;
  try {
    const { data, error } = await sb.from('user_data').upsert({
      device_id: deviceId,
      bookmarks: bookmarks ?? [],
      history: history ?? [],
      completed: completed ?? [],
      theme: theme ?? 'dark',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id' }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

app.get('/api/user-data/export', async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return res.status(400).json({ error: 'Missing x-device-id' });
  const sb = getSupabase();
  if (!sb) return res.status(500).json({ error: 'Server not configured' });

  try {
    const { data, error } = await sb.from('user_data').select('*').eq('device_id', deviceId).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User data not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="thilal-user-data.json"');
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

app.post('/api/user-data/import', async (req, res) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return res.status(400).json({ error: 'Missing x-device-id' });
  const sb = getSupabase();
  if (!sb) return res.status(500).json({ error: 'Server not configured' });

  const { bookmarks, history, completed, theme } = req.body;
  try {
    const { data, error } = await sb.from('user_data').upsert({
      device_id: deviceId,
      bookmarks: bookmarks ?? [],
      history: history ?? [],
      completed: completed ?? [],
      theme: theme ?? 'dark',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'device_id' }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'imported successfully', data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
});

export default app;
