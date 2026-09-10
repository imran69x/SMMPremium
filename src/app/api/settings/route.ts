import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Default level thresholds in BDT (total spent BDT)
export const DEFAULT_LEVEL_SETTINGS = {
  BEGINNER: { minBdt: 0,     maxBdt: 1000,  discount: 0,  chatSupport: false },
  GOLD:     { minBdt: 1000,  maxBdt: 5000,  discount: 2,  chatSupport: false },
  DIAMOND:  { minBdt: 5000,  maxBdt: 10000, discount: 4,  chatSupport: false },
  VIP:      { minBdt: 10000, maxBdt: 25000, discount: 6,  chatSupport: true  },
  MASTER:   { minBdt: 25000, maxBdt: 50000, discount: 8,  chatSupport: true  },
  LEGEND:   { minBdt: 50000, maxBdt: null,  discount: 10, chatSupport: true  },
};

export async function GET() {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'general'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return NextResponse.json({
        ...data,
        activeCurrencies: data.activeCurrencies || ['USD', 'BDT'],
        levelSettings: data.levelSettings || DEFAULT_LEVEL_SETTINGS,
      });
    } else {
      return NextResponse.json({
        profitRatio: 1,
        usdToBdtRate: 120,
        activeCurrencies: ['USD', 'BDT'],
        levelSettings: DEFAULT_LEVEL_SETTINGS,
        levelNote: '',
      });
    }
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({
      profitRatio: 1,
      usdToBdtRate: 120,
      activeCurrencies: ['USD', 'BDT'],
      levelSettings: DEFAULT_LEVEL_SETTINGS,
      levelNote: '',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profitRatio, usdToBdtRate, activeCurrencies, levelSettings, levelNote } = body;

    if (profitRatio !== undefined && (typeof profitRatio !== 'number' || profitRatio <= 0)) {
      return NextResponse.json({ error: 'Invalid profitRatio' }, { status: 400 });
    }
    if (usdToBdtRate !== undefined && (typeof usdToBdtRate !== 'number' || usdToBdtRate <= 0)) {
      return NextResponse.json({ error: 'Invalid usdToBdtRate' }, { status: 400 });
    }

    const settings: any = {};
    if (profitRatio !== undefined) settings.profitRatio = profitRatio;
    if (usdToBdtRate !== undefined) settings.usdToBdtRate = usdToBdtRate;
    if (activeCurrencies !== undefined) settings.activeCurrencies = activeCurrencies;
    if (levelSettings !== undefined) settings.levelSettings = levelSettings;
    if (levelNote !== undefined) settings.levelNote = levelNote;
    
    await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error('Failed to save settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
