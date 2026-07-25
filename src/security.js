// ── אימות בקשות מ-Twilio ────────────────────────────────
// מוודא שהבקשה באמת הגיעה מ-Twilio ולא מגורם זר.
// פעיל רק אם הוגדר TWILIO_AUTH_TOKEN.
const crypto = require('crypto');

/** בונה את החתימה הצפויה לפי אלגוריתם Twilio. */
function expectedSignature(token, url, params) {
  const data = Object.keys(params).sort().reduce((s, k) => s + k + params[k], url);
  return crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf-8')).digest('base64');
}

/** middleware: חוסם בקשות שאינן מ-Twilio. */
function verifyTwilio(req, res, next) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return next();               // לא הוגדר — לא חוסמים (מצב פיתוח)

  const sig = req.headers['x-twilio-signature'];
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const url = `${proto}://${req.headers.host}${req.originalUrl}`;

  if (!sig) { console.warn('בקשה ללא חתימה נחסמה'); return res.sendStatus(403); }
  const expected = expectedSignature(token, url, req.body || {});
  const ok = sig.length === expected.length &&
             crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) { console.warn('חתימה שגויה נחסמה'); return res.sendStatus(403); }
  return next();
}

module.exports = { verifyTwilio };
