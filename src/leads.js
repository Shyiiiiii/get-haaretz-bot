// ── רישום פניות (לידים) ────────────────────────────────
// כל פנייה נשמרת — כדי שתדע מי שאל, מה, ומתי.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'leads.json');
const MAX = 2000; // שומר את 2000 האחרונות

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

function save(list) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(list));
  } catch (e) { console.error('שמירת ליד נכשלה:', e.message); }
}

/** מוסיף פנייה ליומן. */
function addLead({ phone, text, origin, destination, price, source, passengers, vehicle }) {
  const list = load();
  list.unshift({
    at: new Date().toISOString(),
    phone: (phone || '').replace('whatsapp:', ''),
    text, origin, destination, price, source, passengers, vehicle,
  });
  if (list.length > MAX) list.length = MAX;
  save(list);
}

/** מחזיר פניות + סיכום סטטיסטי. */
function getLeads(limit = 200) {
  const all = load();
  const now = Date.now();
  const since = (ms) => all.filter((l) => now - new Date(l.at).getTime() < ms).length;

  const routes = {};
  for (const l of all) {
    if (!l.origin) continue;
    const k = `${l.origin} → ${l.destination}`;
    routes[k] = (routes[k] || 0) + 1;
  }
  const top = Object.entries(routes).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return {
    leads: all.slice(0, limit),
    stats: {
      total: all.length,
      today: since(24 * 3600e3),
      week: since(7 * 24 * 3600e3),
      quoted: all.filter((l) => l.price).length,
      customers: new Set(all.map((l) => l.phone).filter(Boolean)).size,
      topRoutes: top,
    },
  };
}

module.exports = { addLead, getLeads };
