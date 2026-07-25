// ── תמחור ──────────────────────────────────────────────
// קריאה פשוטה מטבלה אחת (data/prices.json).
// כל הכללים — החרגות, מהימנות, פערים כיווניים — הוחלו בבנייה:
//   node tools/build-prices.js
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ROUND_TRIP_MULTIPLIER: 2,   // הלוך-חזור
  ROUND_TRIP_DISCOUNT: 40,    // הנחת הלו"ש בש"ח (כולל עד שעת המתנה)
};

let PRICES = {};
try { PRICES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'prices.json'), 'utf8')); }
catch { console.warn('חסר data/prices.json — הרץ: node tools/build-prices.js'); }

/**
 * מחזיר מחיר למסלול, או null אם אין מחיר מאומת.
 * @returns {{price:number, source:string, confirmed?:boolean, roundTrip:boolean}|null}
 */
function getPrice(from, to, { roundTrip = false } = {}) {
  const e = PRICES[`${from} → ${to}`];
  if (!e) return null;
  let price = e.price;
  if (roundTrip) {
    price = price * CONFIG.ROUND_TRIP_MULTIPLIER - CONFIG.ROUND_TRIP_DISCOUNT;
  }
  return { price: Math.round(price), source: e.source, confirmed: !!e.confirmed, roundTrip };
}

module.exports = { getPrice, PRICES, CONFIG };
