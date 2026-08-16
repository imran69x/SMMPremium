import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize admin SDK if credentials are available
function getAdminDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { uid, email, secretKey } = await req.json();

    // Simple secret key check to prevent unauthorized access
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'smmfast-setup-2026';
    if (secretKey !== ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }

    const db = getAdminDb();
    
    if (!db) {
      // Fallback: return success anyway if admin SDK not configured
      // The client will update Firestore directly
      return NextResponse.json({ 
        success: false, 
        message: 'Admin SDK not configured. Please update Firestore manually.',
        manualSteps: [
          'Go to Firebase Console → Firestore',
          `Find document: users/${uid}`,
          'Change role field from "customer" to "admin"'
        ]
      });
    }

    await db.collection('users').doc(uid).update({ role: 'admin' });
    
    return NextResponse.json({ success: true, message: `User ${email || uid} is now an admin!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
