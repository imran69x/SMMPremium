import { NextResponse } from 'next/server';
import { smmSun } from '@/lib/providers/smmsun';
import { readFileSync } from 'fs';
import { join } from 'path';

function getProfitRatio(): number {
  try {
    const raw = readFileSync(join(process.cwd(), 'src', 'data', 'settings.json'), 'utf8');
    const data = JSON.parse(raw);
    return typeof data.profitRatio === 'number' && data.profitRatio > 0 ? data.profitRatio : 1;
  } catch {
    return 1;
  }
}

export async function GET() {
  try {
    const [services, profitRatio] = await Promise.all([
      smmSun.getServices(),
      Promise.resolve(getProfitRatio()),
    ]);

    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    // Apply profit ratio to all service rates
    const modified = services.map((s: any) => ({
      ...s,
      rate: (parseFloat(s.rate) * profitRatio).toFixed(6),
    }));

    return NextResponse.json(modified);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
