import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import { getShortUid } from '@/lib/utils/uid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderUid, recipientId, amount, currency = 'USD', note = '' } = body;

    if (!senderUid || !recipientId) {
      return NextResponse.json({ error: 'Sender UID and Recipient ID are required' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid amount greater than 0' }, { status: 400 });
    }

    // Get current exchange rate
    let usdToBdtRate = 120;
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      if (settingsSnap.exists() && settingsSnap.data()?.usdToBdtRate > 0) {
        usdToBdtRate = settingsSnap.data().usdToBdtRate;
      }
    } catch (e) {
      console.warn('Using default rate 120');
    }

    // Calculate USD amount (all balances stored in USD)
    const amountInUsd = currency === 'BDT' ? (numAmount / usdToBdtRate) : numAmount;
    const amountInBdt = currency === 'BDT' ? numAmount : (numAmount * usdToBdtRate);

    // No minimum limit check anymore

    // Lookup recipient user
    const usersSnap = await getDocs(collection(db, 'users'));
    let recipientDocSnap: any = null;

    const trimmedTarget = recipientId.trim();
    for (const d of usersSnap.docs) {
      const data = d.data();
      const uid = d.id || data.uid;
      const shortUid = data.shortUid || getShortUid(uid);

      if (shortUid === trimmedTarget || uid === trimmedTarget) {
        recipientDocSnap = d;
        break;
      }
    }

    if (!recipientDocSnap) {
      return NextResponse.json({ error: 'Recipient user not found with ID: ' + recipientId }, { status: 404 });
    }

    const recipientUid = recipientDocSnap.id;
    if (recipientUid === senderUid) {
      return NextResponse.json({ error: 'You cannot transfer balance to your own account' }, { status: 400 });
    }

    const senderRef = doc(db, 'users', senderUid);
    const recipientRef = doc(db, 'users', recipientUid);
    const transferRef = doc(collection(db, 'balance_transfers'));

    let transferResult: any = null;

    await runTransaction(db, async (transaction) => {
      const senderDoc = await transaction.get(senderRef);
      if (!senderDoc.exists()) {
        throw new Error('Sender account not found');
      }

      const recipientDoc = await transaction.get(recipientRef);
      if (!recipientDoc.exists()) {
        throw new Error('Recipient account not found');
      }

      const senderData = senderDoc.data();
      const recipientData = recipientDoc.data();

      const senderBalance = parseFloat(senderData.balance || 0);
      if (senderBalance < amountInUsd) {
        throw new Error(`Insufficient balance. Your balance is $${senderBalance.toFixed(2)}, but you tried to send $${amountInUsd.toFixed(2)}.`);
      }

      const recipientBalance = parseFloat(recipientData.balance || 0);

      const newSenderBalance = Math.max(0, senderBalance - amountInUsd);
      const newRecipientBalance = recipientBalance + amountInUsd;

      // Update sender balance
      transaction.update(senderRef, {
        balance: newSenderBalance,
        updatedAt: new Date().toISOString(),
      });

      // Update recipient balance
      transaction.update(recipientRef, {
        balance: newRecipientBalance,
        updatedAt: new Date().toISOString(),
      });

      // Generate Transfer Transaction Document
      const now = new Date().toISOString();
      const transferId = `TRF-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

      transferResult = {
        id: transferId,
        transferDocId: transferRef.id,
        senderUid,
        senderShortId: senderData.shortUid || getShortUid(senderUid),
        senderName: senderData.name || 'User',
        senderEmail: senderData.email || '',
        recipientUid,
        recipientShortId: recipientData.shortUid || getShortUid(recipientUid),
        recipientName: recipientData.name || 'User',
        recipientEmail: recipientData.email || '',
        amount: Number(amountInUsd.toFixed(4)),
        amountBdt: Number(amountInBdt.toFixed(2)),
        rate: usdToBdtRate,
        note: note ? String(note).slice(0, 150) : '',
        participants: [senderUid, recipientUid],
        type: 'transfer',
        status: 'completed',
        createdAt: now,
      };

      transaction.set(transferRef, transferResult);
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${currency === 'BDT' ? `BDT ${amountInBdt.toFixed(2)}` : `$${amountInUsd.toFixed(4)}`} to ${transferResult.recipientName} (ID: ${transferResult.recipientShortId})`,
      transfer: transferResult,
    });
  } catch (err: any) {
    console.error('Balance transfer error:', err);
    return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: 400 });
  }
}
