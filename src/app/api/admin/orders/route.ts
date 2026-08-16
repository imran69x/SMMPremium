import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export async function GET() {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(orders);
  } catch (err: any) {
    // Fallback without orderBy if index missing
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json(orders);
    } catch (err2: any) {
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }
  }
}
