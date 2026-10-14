import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
export async function verify(req, res) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { return await getAuth().verifyIdToken(t); }
  catch { res.status(401).json({ error: 'Unauthorized' }); return null; }
}
