import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { amount, uid } = await req.json();

    if (!amount || !uid) {
      return NextResponse.json({ error: 'Missing amount or user ID' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // Determine the base URL for the webhook
    // In production, this should be your actual domain.
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/add-funds/antipay/webhook`;

    const val_id = `ap_${uid}_${Date.now()}`;

    // Store pending transaction in Firestore
    await setDoc(doc(db, 'antipay_transactions', val_id), {
      uid,
      amount: numAmount,
      val_id,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Call AntiPay API
    const antiPayUrl = `${process.env.ANTIPAY_API_URL || 'https://antipay-verify.vercel.app/api/v1'}/create`;
    const apiKey = process.env.ANTIPAY_API_KEY || '';

    const payload = {
      amount: numAmount,
      val_id: val_id,
      webhook_url: webhookUrl
    };

    const response = await fetch(antiPayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create AntiPay session', details: data }, { status: response.status });
    }

    // Assuming AntiPay returns { payment_url: '...', sessionId: '...' }
    if (data.success !== false && data.sessionId) {
      await updateDoc(doc(db, 'antipay_transactions', val_id), {
        sessionId: data.sessionId
      });
    }

    return NextResponse.json({ success: true, antiPayResponse: data });

  } catch (error: any) {
    console.error('AntiPay Create Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
