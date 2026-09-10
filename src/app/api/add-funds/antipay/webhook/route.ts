import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const LEVEL_ORDER = ['BEGINNER', 'GOLD', 'DIAMOND', 'VIP', 'MASTER', 'LEGEND'] as const;

const DEFAULT_LEVEL_SETTINGS: Record<string, { minBdt: number; maxBdt: number | null; discount: number }> = {
  BEGINNER: { minBdt: 0,     maxBdt: 1000,  discount: 0  },
  GOLD:     { minBdt: 1000,  maxBdt: 5000,  discount: 2  },
  DIAMOND:  { minBdt: 5000,  maxBdt: 10000, discount: 4  },
  VIP:      { minBdt: 10000, maxBdt: 25000, discount: 6  },
  MASTER:   { minBdt: 25000, maxBdt: 50000, discount: 8  },
  LEGEND:   { minBdt: 50000, maxBdt: null,  discount: 10 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("AntiPay Webhook Received:", body);

    const { status, sessionId, trxId, amount, method, val_id } = body;

    if (!val_id) {
      return NextResponse.json({ error: 'Missing val_id' }, { status: 400 });
    }

    if (status !== 'verified') {
      // Payment not verified, but we still return 200 to acknowledge webhook
      console.log(`Payment ${val_id} status is ${status}. Ignoring.`);
      return NextResponse.json({ received: true, status: 'ignored' });
    }

    // Lookup pending transaction
    const txRef = doc(db, 'antipay_transactions', val_id);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const txData = txSnap.data();

    if (txData.status === 'completed') {
      // Already processed
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    const uid = txData.uid;
    const paidAmountBDT = parseFloat(amount); // amount from AntiPay payload

    // Get settings (exchange rate + level settings)
    let usdToBdtRate = 120;
    let levelSettings = DEFAULT_LEVEL_SETTINGS;
    try {
      const fs = require('fs');
      const path = require('path');
      const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json');
      const settingsStr = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsStr);
      if (settings.usdToBdtRate) {
        usdToBdtRate = parseFloat(settings.usdToBdtRate);
      }
      if (settings.levelSettings) {
        levelSettings = { ...DEFAULT_LEVEL_SETTINGS, ...settings.levelSettings };
      }
    } catch (e) {
      // Fall back to Firestore settings
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const sd = settingsSnap.data();
          if (sd.usdToBdtRate) usdToBdtRate = parseFloat(sd.usdToBdtRate);
          if (sd.levelSettings) levelSettings = { ...DEFAULT_LEVEL_SETTINGS, ...sd.levelSettings };
        }
      } catch (e2) {
        console.error('Could not load settings:', e2);
        return NextResponse.json({ error: 'System configuration error: exchange rate not found' }, { status: 500 });
      }
    }

    // Credit User Balance
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const currentBalance = parseFloat(userData?.balance || 0);

    // Determine user's current level and deposit bonus %
    const userLevel = (userData?.level || 'BEGINNER').toUpperCase();
    const levelCfg = levelSettings[userLevel] || levelSettings['BEGINNER'];
    const bonusPct = levelCfg?.discount || 0; // "discount" field is deposit bonus %

    // Calculate amounts
    const creditedUsd = paidAmountBDT / usdToBdtRate;
    const bonusBdt = bonusPct > 0 ? (paidAmountBDT * bonusPct) / 100 : 0;
    const bonusUsd = bonusPct > 0 ? (creditedUsd * bonusPct) / 100 : 0;
    const totalCreditedUsd = creditedUsd + bonusUsd;

    const newBalance = currentBalance + totalCreditedUsd;

    // Update User Balance
    await updateDoc(userRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Mark transaction as completed — include bonus details
    await updateDoc(txRef, {
      status: 'completed',
      trxId: trxId || null,
      sessionId: sessionId || null,
      method: method || null,
      creditedUsd,
      bonusPct,
      bonusBdt: bonusBdt > 0 ? bonusBdt : null,
      bonusUsd: bonusUsd > 0 ? bonusUsd : null,
      totalCreditedUsd,
      completedAt: new Date().toISOString()
    });

    console.log(`AntiPay: Credited $${creditedUsd.toFixed(4)} + $${bonusUsd.toFixed(4)} bonus (${bonusPct}%) to user ${uid}. Total: $${totalCreditedUsd.toFixed(4)}`);

    return NextResponse.json({ success: true, processed: true });

  } catch (error: any) {
    console.error('AntiPay Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
