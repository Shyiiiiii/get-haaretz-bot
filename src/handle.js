// ── לוגיקת התשובה ──────────────────────────────────────
const { parseTrip } = require('./parse');
const { getPrice } = require('./pricing');
const { quote, intracity, noPrice, help, notFound } = require('./reply');
const { addLead } = require('./leads');

async function resolveReply(text, phone) {
  const t = parseTrip(text);

  if (!t) {
    const greeting = /^\s*(שלום|היי|הי|אהלן|נסיעה)/.test((text || '').trim());
    try { addLead({ phone, text }); } catch {}
    return greeting ? help() : notFound();
  }

  // נסיעה עירונית — מחיר לפי המסלול בעיר
  if (t.intracity && t.originCity === t.destCity) {
    try { addLead({ phone, text, origin: t.originCity, destination: t.originCity }); } catch {}
    return intracity({ origin: t.originCity });
  }

  const from = t.destHood ? t.originCity : t.originCity;
  const to = t.destHood || t.destCity;
  const a = t.originHood || from;

  const hit = getPrice(a, to, { roundTrip: t.roundTrip });
  const base = { origin: t.origin, destination: t.destination, roundTrip: t.roundTrip };

  try { addLead({ phone, text, ...base, price: hit ? hit.price : null, source: hit ? hit.source : null }); } catch {}

  return hit ? quote({ ...base, price: hit.price, confirmed: hit.confirmed }) : noPrice(base);
}

module.exports = { resolveReply };
