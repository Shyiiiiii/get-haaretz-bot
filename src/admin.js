// ── מסך ניהול (לידים + עריכת מחירים) ────────────────────
const fs = require('fs');
const path = require('path');
const { getLeads } = require('./leads');

const MANUAL = path.join(__dirname, '..', 'data', 'manual-prices.json');
const readManual = () => { try { return JSON.parse(fs.readFileSync(MANUAL, 'utf8')); } catch { return { routes: {}, neighborhoodOverrides: {} }; } };

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function page(pass) {
  const { leads, stats } = getLeads(150);
  const manual = readManual();
  const routes = Object.entries(manual.routes || {});

  const leadRows = leads.map((l) => `<tr>
    <td class="t">${esc(fmt(l.at))}</td>
    <td dir="ltr" class="ph">${esc(l.phone || '—')}</td>
    <td class="msg">${esc(l.text || '')}</td>
    <td>${l.origin ? esc(l.origin + ' → ' + l.destination) : '<span class="dim">לא זוהה</span>'}</td>
    <td class="num">${l.price ? esc(l.price) + '₪' : '—'}</td>
    <td>${l.vehicle ? esc(l.vehicle) : '—'}</td>
  </tr>`).join('') || '<tr><td colspan="6" class="dim" style="text-align:center;padding:30px">אין פניות עדיין</td></tr>';

  const priceRows = routes.map(([r, p]) => `<tr>
    <td>${esc(r)}</td>
    <td><input class="pin" data-route="${esc(r)}" type="number" value="${esc(p)}"></td>
    <td><button class="save" data-route="${esc(r)}">שמור</button></td>
  </tr>`).join('') || '<tr><td colspan="3" class="dim">אין מסלולים</td></tr>';

  const topRoutes = stats.topRoutes.map(([r, n]) =>
    `<div class="rr"><span>${esc(r)}</span><b>${n}</b></div>`).join('') || '<div class="dim">אין נתונים</div>';

  return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ניהול — Get הארץ</title>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700;900&family=Heebo:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
:root{--navy:#070d1f;--card:#0d1733;--line:rgba(255,255,255,.09);--gold:#f5b81e;--ink:#eaeefb;--dim:#8d99ba}
*{box-sizing:border-box}body{margin:0;background:var(--navy);color:var(--ink);font-family:Heebo,system-ui,sans-serif;padding:24px 16px}
.w{max-width:1100px;margin:0 auto}
h1{font-family:"Frank Ruhl Libre",serif;font-size:32px;margin:0 0 4px}h1 span{color:var(--gold)}
.sub{color:var(--dim);margin:0 0 26px;font-size:14px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:30px}
.s{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.s .n{font-family:"Frank Ruhl Libre",serif;font-size:30px;color:var(--gold);line-height:1}
.s .l{color:var(--dim);font-size:13px;margin-top:5px}
h2{font-family:"Frank Ruhl Libre",serif;font-size:21px;margin:30px 0 12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:14px}
th{background:rgba(255,255,255,.04);color:var(--dim);padding:11px 10px;text-align:right;font-size:12px;font-weight:600}
td{padding:10px;border-top:1px solid var(--line);vertical-align:top}
.t{color:var(--dim);font-size:12px;white-space:nowrap}.ph{font-size:13px;white-space:nowrap}
.msg{max-width:260px;word-break:break-word}.num{color:var(--gold);font-weight:700;white-space:nowrap}
.dim{color:var(--dim)}
input.pin{background:#0a1228;border:1px solid var(--line);color:var(--ink);border-radius:7px;padding:6px 9px;width:90px;font-family:inherit}
button{background:var(--gold);color:#111;border:0;border-radius:7px;padding:7px 14px;font-weight:700;cursor:pointer;font-family:inherit}
button:hover{opacity:.9}
.rr{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}
.rr:last-child{border:0}.rr b{color:var(--gold)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:820px){.two{grid-template-columns:1fr}}
.warn{background:rgba(245,184,30,.10);border:1px solid rgba(245,184,30,.3);border-radius:10px;
 padding:12px 15px;margin-bottom:12px;font-size:13.5px;color:#e8d9ae}
.warn a{color:var(--gold);font-weight:700;text-decoration:none;margin-right:6px}
.ok{position:fixed;bottom:20px;right:20px;background:var(--gold);color:#111;padding:11px 18px;border-radius:9px;font-weight:700;display:none}
</style></head><body><div class="w">
<h1>לוח ניהול — Get <span>הארץ</span></h1>
<p class="sub">פניות שהגיעו לבוט וניהול מחירים</p>

<div class="stats">
  <div class="s"><div class="n">${stats.today}</div><div class="l">פניות היום</div></div>
  <div class="s"><div class="n">${stats.week}</div><div class="l">השבוע</div></div>
  <div class="s"><div class="n">${stats.total}</div><div class="l">סה"כ פניות</div></div>
  <div class="s"><div class="n">${stats.customers}</div><div class="l">לקוחות ייחודיים</div></div>
  <div class="s"><div class="n">${stats.quoted}</div><div class="l">הצעות מחיר</div></div>
</div>

<div class="two">
  <div><h2>מסלולים מבוקשים</h2><div class="card" style="padding:14px 18px">${topRoutes}</div></div>
  <div><h2>עריכת מחירים</h2><div class="card"><table>
    <thead><tr><th>מסלול</th><th>מחיר</th><th></th></tr></thead><tbody>${priceRows}</tbody></table></div></div>
</div>

<h2>פניות אחרונות</h2>
<div class="warn">⚠️ הפניות נשמרות על השרת בלבד. ב-Render חינמי הן <b>נמחקות בכל פריסה מחדש</b> —
  ייצא לקובץ מדי פעם. <a href="/admin/export?pass=${encodeURIComponent(pass||'')}">⬇️ ייצוא ל-CSV</a></div>
<div class="card"><table>
<thead><tr><th>מתי</th><th>טלפון</th><th>ההודעה</th><th>מסלול</th><th>מחיר</th><th>רכב</th></tr></thead>
<tbody>${leadRows}</tbody></table></div>
<div class="ok" id="ok">נשמר ✅</div>
</div>
<script>
const P=${JSON.stringify(pass || '')};
document.querySelectorAll('.save').forEach(b=>b.onclick=async()=>{
  const r=b.dataset.route;
  const v=document.querySelector('.pin[data-route="'+CSS.escape(r)+'"]').value;
  const res=await fetch('/admin/price?pass='+encodeURIComponent(P),{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({route:r,price:Number(v)})});
  if(res.ok){const o=document.getElementById('ok');o.style.display='block';setTimeout(()=>o.style.display='none',1600);}
  else alert('שמירה נכשלה');
});
</script></body></html>`;
}

function setPrice(route, price) {
  const m = readManual();
  m.routes = m.routes || {};
  m.routes[route] = price;
  fs.writeFileSync(MANUAL, JSON.stringify(m, null, 2));
}

module.exports = { page, setPrice };
