import { NextResponse } from 'next/server';
import { smmSun } from '@/lib/providers/smmsun';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

async function getProfitRatio(): Promise<number> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'general'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return typeof data.profitRatio === 'number' && data.profitRatio > 0 ? data.profitRatio : 1;
    }
    return 1;
  } catch {
    return 1;
  }
}

export async function GET() {
  try {
    const [services, profitRatio] = await Promise.all([
      smmSun.getServices(),
      getProfitRatio(),
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

