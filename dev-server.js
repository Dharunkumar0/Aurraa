const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5500;

// Development-friendly CSP: allows self, localhost dev server, and common dev CDNs
const devCSP = "default-src 'self' 'unsafe-inline' data: blob:; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://www.gstatic.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "connect-src 'self' http://127.0.0.1:5500 ws://127.0.0.1:5500; " +
  "img-src 'self' data:; font-src https://fonts.gstatic.com;";

app.use((req, res, next) => {
  // Set a dev-friendly CSP header
  res.setHeader('Content-Security-Policy', devCSP);
  next();
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Dev server running at http://127.0.0.1:${PORT}`);
});
