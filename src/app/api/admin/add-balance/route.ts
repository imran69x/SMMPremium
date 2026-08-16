import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId, amountToAdd } = await req.json();

    if (!userId || isNaN(Number(amountToAdd))) {
      return NextResponse.json({ error: 'Invalid userId or amount' }, { status: 400 });
    }

    const numAmount = parseFloat(amountToAdd);
    if (numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User document not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(userSnap.data()?.balance || 0);
    const newBalance = currentBalance + numAmount;

    await updateDoc(userRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully added $${numAmount.toFixed(4)} to user!`
    });
  } catch (error: any) {
    console.error('Failed to add balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to update balance' }, { status: 500 });
  }
}
