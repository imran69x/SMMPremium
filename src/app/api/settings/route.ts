import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const SETTINGS_PATH = join(process.cwd(), 'src', 'data', 'settings.json');

function readSettings() {
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return { profitRatio: 1, usdToBdtRate: 120 };
  }
}

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profitRatio, usdToBdtRate } = body;

    if (typeof profitRatio !== 'number' || profitRatio <= 0) {
      return NextResponse.json({ error: 'Invalid profitRatio' }, { status: 400 });
    }
    if (typeof usdToBdtRate !== 'number' || usdToBdtRate <= 0) {
      return NextResponse.json({ error: 'Invalid usdToBdtRate' }, { status: 400 });
    }

    const settings = { profitRatio, usdToBdtRate };
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
