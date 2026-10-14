import crypto from 'crypto';
import { verify } from './_auth.js';
export default async function handler(req, res) {
  const u = await verify(req, res); if (!u) return;
  const timestamp = Math.floor(Date.now() / 1000), folder = `estara/${u.uid}`;
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest('hex');
  res.json({ timestamp, folder, signature, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
}
