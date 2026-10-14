// Cek cepat konfigurasi (tanpa membuka nilai rahasia): buka https://domain-anda/api/health
import { fail } from './_auth.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');
  const has = k => !!(process.env[k] && String(process.env[k]).trim());
  const geminiKeys = has('GEMINI_API_KEYS') || has('GEMINI_API_KEY');
  const checks = {
    firebaseWeb: ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'].every(has),
    firebaseAdmin: has('FIREBASE_SERVICE_ACCOUNT'),
    gemini: geminiKeys,
    cloudinary: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(has)
  };
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: Object.values(checks).every(Boolean), node: process.version, checks });
}
