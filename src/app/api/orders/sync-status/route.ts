import { NextResponse } from 'next/server';
import { smmSun } from '@/lib/providers/smmsun';

export async function POST(req: Request) {
  try {
    const { apiOrderIds } = await req.json();

    if (!apiOrderIds || !Array.isArray(apiOrderIds) || apiOrderIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid apiOrderIds array' }, { status: 400 });
    }

    // Call SMMSun provider to get multi status
    const statusData = await smmSun.getMultiStatus(apiOrderIds);

    if (!statusData || statusData.error) {
      return NextResponse.json({ error: statusData?.error || 'Failed to fetch status from provider' }, { status: 400 });
    }

    // statusData usually returns an object mapping API order ID to its status details
    return NextResponse.json({ success: true, statuses: statusData });
  } catch (error: any) {
    console.error('Failed to sync statuses:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
