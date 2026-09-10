import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { getShortUid } from '@/lib/utils/uid';

const maskEmail = (email?: string) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('id')?.trim();
    const senderUid = searchParams.get('senderUid')?.trim();

    if (!targetId) {
      return NextResponse.json({ error: 'Please provide a User ID' }, { status: 400 });
    }

    const snapshot = await getDocs(collection(db, 'users'));
    let matchedUser: any = null;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const uid = docSnap.id || data.uid;
      const shortUid = data.shortUid || getShortUid(uid);

      if (shortUid === targetId || uid === targetId) {
        matchedUser = {
          uid,
          shortUid,
          name: data.name || 'User',
          email: maskEmail(data.email),
        };
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ error: 'No user found with this ID' }, { status: 404 });
    }

    if (senderUid && matchedUser.uid === senderUid) {
      return NextResponse.json({ error: 'You cannot transfer balance to your own ID' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: matchedUser,
    });
  } catch (error: any) {
    console.error('Error looking up user:', error);
    return NextResponse.json({ error: error.message || 'Failed to lookup user' }, { status: 500 });
  }
}
