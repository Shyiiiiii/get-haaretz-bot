// ── פענוח הודעת הלקוח ──────────────────────────────────
// מזהה מוצא + יעד (כולל קיצורים כמו "בב פת"), הלוך-חזור, ונסיעה פנימית.
const { expand, isPlace, INTRACITY_HINT, resolveCity, normalize } = require('./places');
const { extractCities } = require('./gazetteer');

const FILLERS = [
  'שלום','היי','הי','בוקר טוב','ערב טוב','אהלן',
  'אני צריך נסיעה','אני צריך','צריך נסיעה','רוצה נסיעה','אפשר נסיעה',
  'כמה זה עולה','כמה עולה','כמה זה','כמה','מה המחיר','הצעת מחיר','מחיר',
  'נסיעה','הזמנה','להזמין','תודה','בבקשה','אפשר','בקשה',
];
const ROUND_TRIP_HINTS = ['הלוך חזור','הלוך-חזור','הלו״ש','הלו"ש','הלוש','וחזרה','הלוך ושוב','round trip','return'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const detectRoundTrip = (t) => ROUND_TRIP_HINTS.some((h) => t.toLowerCase().includes(h.toLowerCase()));

// ביטויי נוסעים/רכב — מוסרים כדי שלא יזלגו לשם היעד
const PAX_RE = /(?:ל[-\s]?)?\d{1,2}\s*(?:נוסעים|אנשים|איש|אנשי|נפשות|מקומות)/g;
const VEHICLE_RE = /אוטובוס תיירים|אוטובוס|מיניבוס|מיניבאס|מיני ?בוס|מיניק|סטיישן|ואן|רכב פרטי|רכב/g;

function clean(text) {
  let t = ` ${text.replace(/[,;?!.]+/g, ' ')} `;
  for (const h of ROUND_TRIP_HINTS) t = t.replace(new RegExp(escapeRegex(h), 'gi'), ' ');
  t = t.replace(PAX_RE, ' ');                                // הסרת "ל-12 אנשים"
  t = t.replace(VEHICLE_RE, ' ');                            // הסרת סוג רכב
  t = t.replace(/\d+\s*(?:ש"?ח|שח|₪|ש)?/g, ' ');           // הסרת מחירים
  for (const f of FILLERS) t = t.replace(new RegExp(`\\s${escapeRegex(f)}\\s`, 'gi'), ' ');
  return t.replace(/\s+/g, ' ').trim();
}

const expandPhrase = (s) => {
  const toks = s.split(/\s+/).filter(Boolean);
  return toks.length === 1 ? expand(toks[0]) : toks.join(' ').trim();
};

function parseTrip(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const roundTrip = detectRoundTrip(rawText);
  const intracity = rawText.includes(INTRACITY_HINT);
  const text = clean(rawText);

  // 1) תוויות מפורשות "מוצא: X יעד: Y"
  let m = text.match(/מוצא[:\-\s]+(.+?)\s*(?:יעד|ל)[:\-\s]+(.+)/i);
  if (m) return finish(m[1], m[2], roundTrip, intracity);

  // 2) מפרידים ברורים " - " / " עד " / " אל "
  const sep = text.split(/\s*[-–—]\s*|\s+עד\s+|\s+אל\s+/);
  if (sep.length === 2 && sep[0].length > 1 && sep[1].length > 1)
    return finish(sep[0], sep[1], roundTrip, intracity);

  // 2.5) גזטיר — התאמה מדויקת לשמות ערים מלאים (עדיף על ניחוש תבניות)
  const gaz = extractCities(text);
  if (gaz.length >= 2) return finish(gaz[0], gaz[1], roundTrip, intracity);

  // 3) "מ<A> ל<B>"
  m = text.match(/^מ(.+?)\s+ל(.+)$/);
  if (m) return finish(m[1], m[2], roundTrip, intracity);

  // 4) "<A> ל<B>"
  m = text.match(/^(.+?)\s+ל(.+)$/);
  if (m && m[1].length > 1 && m[2].length > 1) return finish(m[1], m[2], roundTrip, intracity);

  // 5) קיצורים תמציתיים ללא מילת קישור: "בב פת" / "פנימי בב"
  const toks = text.split(/\s+/).filter(Boolean);
  const places = toks.filter(isPlace);
  if (places.length === 2) return finish(places[0], places[1], roundTrip, intracity);
  if (places.length === 1 && intracity) {
    const c = expand(cleanLoc(places[0]));
    return { origin: c, destination: c, roundTrip, intracity: true, originCity: c, destCity: c, originHood: null, destHood: null };
  }
  return null;
}

function finish(a, b, roundTrip, intracity) {
  const origin = normalize(expandPhrase(cleanLoc(a)));
  const destination = normalize(expandPhrase(cleanLoc(b)));
  if (!origin || !destination) return null;
  const o = resolveCity(origin);
  const d = resolveCity(destination);
  return {
    origin, destination, roundTrip, intracity,
    originCity: o.city, originHood: o.hood,
    destCity: d.city, destHood: d.hood,
  };
}

const { CITIES } = require('./gazetteer');
const cleanLoc = (s) => {
  const v = String(s).replace(/[?!.,]+$/, '').trim();
  if (!/^מ/.test(v)) return v;
  // אם השם עצמו הוא עיר מוכרת (מודיעין, מעלה אדומים, מבשרת) — אל תסיר את ה-מ'
  if (CITIES.includes(v)) return v;
  const stripped = v.slice(1).trim();
  // הסר רק אם מה שנשאר הוא עיר מוכרת, אחרת השאר כמות שהוא
  return CITIES.includes(stripped) ? stripped : (CITIES.includes(v) ? v : stripped);
};

module.exports = { parseTrip, detectRoundTrip };
