import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

    // Get current USD to BDT rate from settings.json
    let usdToBdtRate;
    try {
      const fs = require('fs');
      const path = require('path');
      const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json');
      const settingsStr = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsStr);
      if (settings.usdToBdtRate) {
        usdToBdtRate = parseFloat(settings.usdToBdtRate);
      } else {
        throw new Error("usdToBdtRate not found in settings");
      }
    } catch (e) {
      console.error('Could not read settings.json in webhook:', e);
      return NextResponse.json({ error: 'System configuration error: exchange rate not found' }, { status: 500 });
    }

    const creditedUsd = paidAmountBDT / usdToBdtRate;

    // Credit User Balance
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(userSnap.data()?.balance || 0);
    const newBalance = currentBalance + creditedUsd;

    // Update User Balance
    await updateDoc(userRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString()
    });

    // Mark transaction as completed
    await updateDoc(txRef, {
      status: 'completed',
      trxId: trxId || null,
      sessionId: sessionId || null,
      method: method || null,
      creditedUsd,
      completedAt: new Date().toISOString()
    });

    console.log(`AntiPay: Successfully credited $${creditedUsd} to user ${uid}`);

    return NextResponse.json({ success: true, processed: true });

  } catch (error: any) {
    console.error('AntiPay Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
