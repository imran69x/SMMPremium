// Run this script to set a user as admin in Firestore
// Usage: node scripts/set-admin.mjs <userEmail>
// Note: This requires firebase-admin and your service account credentials

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
}

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();
const auth = getAuth();

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/set-admin.mjs <userEmail>');
  process.exit(1);
}

try {
  const user = await auth.getUserByEmail(email);
  await db.collection('users').doc(user.uid).update({ role: 'admin' });
  console.log(`✅ Successfully set ${email} (uid: ${user.uid}) as admin!`);
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
