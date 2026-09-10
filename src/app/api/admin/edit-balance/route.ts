import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId, newBalance, currency, bdtAmount } = await req.json();

    if (!userId || isNaN(Number(newBalance))) {
      return NextResponse.json({ error: 'Invalid userId or balance' }, { status: 400 });
    }

    const numBalance = parseFloat(newBalance);
    if (numBalance < 0) {
      return NextResponse.json({ error: 'Balance cannot be negative' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User document not found' }, { status: 404 });
    }

    const oldBalance = parseFloat(userSnap.data()?.balance || 0);
    const diff = numBalance - oldBalance; // positive = add, negative = remove

    await updateDoc(userRef, {
      balance: numBalance,
      updatedAt: new Date().toISOString(),
    });

    const chosenCurrency = currency === 'BDT' ? 'BDT' : 'USD';
    const rawBdt = bdtAmount !== undefined && bdtAmount !== null ? Number(bdtAmount) : null;
    
    // Determine accurate exchange rate for BDT diff
    let usdToBdtRate = 120;
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      if (settingsSnap.exists() && settingsSnap.data()?.usdToBdtRate > 0) {
        usdToBdtRate = settingsSnap.data().usdToBdtRate;
      }
    } catch (e) {}

    const absDiff = Math.abs(diff);
    const absDiffBdt = chosenCurrency === 'BDT' && rawBdt !== null && numBalance > 0
      ? Math.abs(diff) * (rawBdt / numBalance)
      : absDiff * usdToBdtRate;

    // Log admin adjustment to transaction history
    await addDoc(collection(db, 'admin_balance_adjustments'), {
      uid: userId,
      type: diff >= 0 ? 'admin_credit' : 'admin_debit',
      amount: absDiff,       // always positive USD amount
      currency: chosenCurrency,
      bdtAmount: absDiffBdt,
      oldBalance,
      newBalance: numBalance,
      note: chosenCurrency === 'BDT'
        ? (diff >= 0 
            ? `Admin added balance: set to ${rawBdt !== null ? rawBdt.toFixed(2) : ''} BDT (+${absDiffBdt.toFixed(2)} BDT)` 
            : `Admin removed balance: set to ${rawBdt !== null ? rawBdt.toFixed(2) : ''} BDT (-${absDiffBdt.toFixed(2)} BDT)`)
        : (diff >= 0
            ? `Admin set balance: $${oldBalance.toFixed(4)} → $${numBalance.toFixed(4)} (+$${absDiff.toFixed(4)})`
            : `Admin set balance: $${oldBalance.toFixed(4)} → $${numBalance.toFixed(4)} (-$${absDiff.toFixed(4)})`),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newBalance: numBalance,
      message: chosenCurrency === 'BDT'
        ? `Successfully updated user balance to ${rawBdt !== null ? rawBdt.toFixed(2) : ''} BDT!`
        : `Successfully updated user balance to $${numBalance.toFixed(4)}!`
    });
  } catch (error: any) {
    console.error('Failed to edit balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to update balance' }, { status: 500 });
  }
}

