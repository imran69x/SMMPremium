import { NextResponse } from 'next/server';
import { smmSun } from '@/lib/providers/smmsun';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, serviceId, link, quantity, charge } = body;

    if (!uid || !serviceId || !link || !quantity || !charge) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch user from Firestore
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    
    // 2. Check balance
    if (userData.balance < charge) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 3. Place order via SMMSun API
    const smmResponse = await smmSun.addOrder({
      service: serviceId,
      link: link,
      quantity: quantity
    });

    if (!smmResponse || smmResponse.error) {
      return NextResponse.json({ error: smmResponse?.error || 'Provider rejected the order' }, { status: 400 });
    }

    // 4. Deduct balance and save order
    const newBalance = userData.balance - charge;
    
    await updateDoc(userRef, {
      balance: newBalance
    });

    const orderData = {
      uid,
      serviceId,
      link,
      quantity,
      charge,
      apiOrderId: smmResponse.order || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    return NextResponse.json({ success: true, orderId: orderRef.id, newBalance });

  } catch (error: any) {
    console.error('Failed to place order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
