import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { uid, bdtAmount, usdAmount } = await req.json();

    if (!uid || isNaN(Number(usdAmount))) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const creditedUsd = parseFloat(usdAmount);
    if (creditedUsd <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(userSnap.data()?.balance || 0);
    const newBalance = currentBalance + creditedUsd;

    await updateDoc(userRef, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      newBalance,
      creditedUsd,
      message: `Successfully credited $${creditedUsd.toFixed(4)} USD (${bdtAmount} BDT) to your balance!`
    });
  } catch (error: any) {
    console.error('Failed to add funds:', error);
    return NextResponse.json({ error: error.message || 'Failed to credit funds' }, { status: 500 });
  }
}
