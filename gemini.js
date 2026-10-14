import { verify } from './_auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const u = await verify(req, res); if (!u) return;
  const { question, summary } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong' });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = `Anda asisten bisnis untuk UMKM Indonesia. Jawab singkat, praktis, bahasa Indonesia. Gunakan HANYA angka dari data; jangan mengarang angka.\nDATA: ${JSON.stringify(summary)}\nPERTANYAAN: ${String(question).slice(0, 500)}`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const j = await r.json();
  if (!r.ok) return res.status(502).json({ error: j.error?.message || 'Gemini error' });
  res.json({ answer: j.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada jawaban.' });
}
