import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'general'));
    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    } else {
      return NextResponse.json({ profitRatio: 1, usdToBdtRate: 120 });
    }
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ profitRatio: 1, usdToBdtRate: 120 });
  }
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
    
    await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
