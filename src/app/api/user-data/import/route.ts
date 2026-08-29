import { NextResponse, type NextRequest } from 'next/server';
import { getSupabase } from '@/src/lib/supabase';

function getDeviceId(req: NextRequest): string | null {
  return req.headers.get('x-device-id');
}

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing x-device-id header' }, { status: 400 });
  }

  let body: { bookmarks?: unknown[]; history?: unknown[]; completed?: number[]; theme?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bookmarks, history, completed, theme } = body;

  try {
    const { data, error } = await getSupabase()
      .from('user_data')
      .upsert(
        {
          device_id: deviceId,
          bookmarks: bookmarks ?? [],
          history: history ?? [],
          completed: completed ?? [],
          theme: theme ?? 'dark',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'imported successfully', data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
