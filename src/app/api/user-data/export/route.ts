import { NextResponse, type NextRequest } from 'next/server';
import { getSupabase } from '@/src/lib/supabase';

function getDeviceId(req: NextRequest): string | null {
  return req.headers.get('x-device-id');
}

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing x-device-id header' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabase()
      .from('user_data')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="dhilal-user-data.json"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
