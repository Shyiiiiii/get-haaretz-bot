// ── שרת הבוט — Twilio WhatsApp + לוח ניהול ─────────────
require('dotenv').config();
const express = require('express');
const { resolveReply } = require('./src/handle');
const admin = require('./src/admin');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const xmlEsc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── Webhook מ-Twilio ──
app.post('/whatsapp', async (req, res) => {
  const text = req.body.Body || '';
  const from = req.body.From || '';
  let reply;
  try { reply = await resolveReply(text, from); }
  catch (e) { console.error(e); reply = 'אירעה תקלה זמנית. לתיאום: 050-6567045'; }
  console.log(`${from}: "${text}"`);
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEsc(reply)}</Message></Response>`);
});

// ── לוח ניהול (מוגן בסיסמה) ──
const PASS = process.env.ADMIN_PASS || 'get2026';
const guard = (req, res, next) =>
  (req.query.pass === PASS) ? next()
    : res.status(401).send('<div style="font-family:sans-serif;direction:rtl;padding:40px;text-align:center">נדרשת סיסמה. הוסף לכתובת: <code>?pass=הסיסמה</code></div>');

app.get('/admin', guard, (req, res) => res.send(admin.page(req.query.pass)));
app.post('/admin/price', guard, (req, res) => {
  const { route, price } = req.body || {};
  if (!route || !Number.isFinite(price)) return res.status(400).json({ ok: false });
  admin.setPrice(route, price);
  res.json({ ok: true });
});

app.get('/', (_req, res) => res.send('Get הארץ pricing bot ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`הבוט פועל על פורט ${PORT} | ניהול: /admin?pass=***`));
