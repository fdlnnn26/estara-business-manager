export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID
  });
}
