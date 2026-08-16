import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId, newBalance } = await req.json();

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

    await updateDoc(userRef, {
      balance: numBalance,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newBalance: numBalance,
      message: `Successfully updated user balance to $${numBalance.toFixed(4)}!`
    });
  } catch (error: any) {
    console.error('Failed to edit balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to update balance' }, { status: 500 });
  }
}
