// ── שרת הבוט (Webhook) ─────────────────────────────────
require('dotenv').config();
const express = require('express');

const { parseTrip } = require('./src/parse');
const { getDistanceKm } = require('./src/distance');
const { calcKmPrice, lookupManualPrice, lookupMarketPrice, CONFIG } = require('./src/pricing');
const { quote, intracity, help, notFound } = require('./src/reply');
const { sendText, extractMessages } = require('./src/whatsapp');

const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN)
    return res.status(200).send(req.query['hub.challenge']);
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try { for (const m of extractMessages(req.body)) await handleMessage(m.from, m.text); }
  catch (e) { console.error('שגיאה:', e); }
});

async function handleMessage(from, text) {
  const t = parseTrip(text);
  if (!t) {
    const greeting = /^\s*(שלום|היי|הי|אהלן|נסיעה)/.test(text.trim());
    return sendText(from, greeting ? help() : notFound());
  }
  if (t.intracity && t.originCity === t.destCity) return sendText(from, intracity({ origin: t.originCity }));

  const opts = { aHood: t.originHood, bHood: t.destHood, roundTrip: t.roundTrip };
  const reply = (price) => sendText(from, quote({ origin: t.origin, destination: t.destination, price, roundTrip: t.roundTrip }));

  // 1) מחיר ידני (בעל העסק) — עדיפות עליונה, כולל דיוק שכונתי
  const manual = lookupManualPrice(t.originCity, t.destCity, opts);
  if (manual) { console.log(`[ידני] ${t.origin}→${t.destination}${manual.hood ? ' ('+manual.hood+')' : ''} = ${manual.price}₪`); return reply(manual.price); }

  // 2) מחיר שוק
  if (CONFIG.PRICING_MODE !== 'km') {
    const market = lookupMarketPrice(t.originCity, t.destCity, { roundTrip: t.roundTrip });
    if (market) { console.log(`[שוק] ${t.origin}→${t.destination} = ${market.price}₪`); return reply(market.price); }
  }

  // 3) נפילה לק"מ
  if (CONFIG.PRICING_MODE !== 'market') {
    const dist = await getDistanceKm(t.origin, t.destination);
    if (!dist) return sendText(from, notFound());
    const { price } = calcKmPrice(dist.km, { roundTrip: t.roundTrip });
    console.log(`[ק"מ] ${t.origin}→${t.destination} = ${Math.round(dist.km)}ק"מ = ${price}₪`);
    return sendText(from, quote({ origin: t.origin, destination: t.destination, km: Math.round(dist.km), durationMin: dist.durationMin, price, roundTrip: t.roundTrip }));
  }

  return sendText(from, notFound());
}

app.get('/', (_req, res) => res.send('Get הארץ pricing bot ✅'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`הבוט פועל על פורט ${PORT} | מודל: ${CONFIG.PRICING_MODE}`));
