# ESTARA Business Manager

Kasir + Stok + Invoice + Pengeluaran + Laporan + AI untuk UMKM.
Frontend statis (ES modules, tanpa build) + Vercel Serverless (`/api`) + Firebase Auth/Firestore + Cloudinary + Gemini.

## Struktur
- `index.html`, `main.js` : shell, login, router tab
- `features.js` : halaman & aksi (kasir, produk, invoice, biaya, laporan, AI, pengaturan)
- `firebase-core.js`, `firebase-features.js` : inisialisasi dan data Firestore
- `api/config.js` : config Firebase publik dari env var
- `api/gemini.js` : proxy Gemini (key tidak pernah ke browser, wajib login)
- `api/cloudinary-sign.js` : tanda tangan upload Cloudinary
- `api/_auth.js` : verifikasi ID token Firebase
- `firestore.rules` : tiap pengguna hanya akses datanya sendiri

## Setup
1. **Firebase**: buat project, aktifkan Authentication (Email/Password + Google) dan Firestore. Tambah Web app, salin config. Buat Service account key (JSON). Publish `firestore.rules`.
2. **Gemini**: buat API key di aistudio.google.com/apikey.
3. **Cloudinary**: salin cloud name, API key, API secret.
4. **Vercel**: push ke GitHub, Import di vercel.com, lalu Settings > Environment Variables, isi semua variabel di `.env.example` (FIREBASE_SERVICE_ACCOUNT = isi JSON dalam satu baris). Deploy.
5. Firebase > Authentication > Settings > Authorized domains: tambahkan domain Vercel Anda.

Lokal: `npm i -g vercel`, `npm i`, `vercel link`, `vercel env pull .env.local`, `vercel dev`.
