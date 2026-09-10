import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId, amountToRemove, currency, bdtAmount } = await req.json();

    if (!userId || isNaN(Number(amountToRemove))) {
      return NextResponse.json({ error: 'Invalid userId or amount' }, { status: 400 });
    }

    const numAmount = parseFloat(amountToRemove);
    if (numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User document not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(userSnap.data()?.balance || 0);

    if (numAmount > currentBalance + 0.00001) {
      return NextResponse.json({ 
        error: `Insufficient balance. User has only ${currentBalance.toFixed(4)} USD balance.` 
      }, { status: 400 });
    }

    const newBalance = Math.max(0, currentBalance - numAmount);

    await updateDoc(userRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    const chosenCurrency = currency === 'BDT' ? 'BDT' : 'USD';
    const rawBdt = bdtAmount !== undefined && bdtAmount !== null ? Number(bdtAmount) : null;

    // Log admin debit to transaction history
    await addDoc(collection(db, 'admin_balance_adjustments'), {
      uid: userId,
      type: 'admin_debit',
      amount: numAmount,
      currency: chosenCurrency,
      bdtAmount: rawBdt,
      oldBalance: currentBalance,
      newBalance,
      note: chosenCurrency === 'BDT'
        ? `Admin removed balance: ${rawBdt !== null ? rawBdt.toFixed(2) : ''} BDT`
        : `Admin removed balance: $${numAmount.toFixed(4)}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newBalance,
      message: chosenCurrency === 'BDT'
        ? `Successfully removed ${rawBdt !== null ? rawBdt.toFixed(2) : ''} BDT from user!`
        : `Successfully removed $${numAmount.toFixed(4)} from user!`
    });
  } catch (error: any) {
    console.error('Failed to remove balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove balance' }, { status: 500 });
  }
}
