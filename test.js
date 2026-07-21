const { parseTrip } = require('./src/parse');
const { calcKmPrice, lookupManualPrice, lookupMarketPrice } = require('./src/pricing');
const { resolveCity } = require('./src/places');

let pass = 0, fail = 0;
const eq = (name, got, want) => { const okk = JSON.stringify(got) === JSON.stringify(want); console.log(`${okk?'✅':'❌'} ${name}`); if(!okk){console.log('   קיבלתי:',JSON.stringify(got));console.log('   ציפיתי:',JSON.stringify(want));fail++;}else pass++; };
const ok = (name, cond) => { console.log(`${cond?'✅':'❌'} ${name}`); cond?pass++:fail++; };
const pick = (t) => { const {origin,destination,originCity,destCity,originHood,destHood}=t; return {origin,destination,originCity,destCity,originHood,destHood}; };
const pickHood = (t) => ({ origin:t.origin, destCity:t.destCity, destHood:t.destHood });

// ── פענוח בסיסי ──
eq('בב פת', pick(parseTrip('בב פת')), { origin:'בני ברק', destination:'פתח תקווה', originCity:'בני ברק', destCity:'פתח תקווה', originHood:null, destHood:null });
ok('ים שמש הלוך חזור', parseTrip('ים שמש הלוך חזור').roundTrip === true);
ok('פנימי בב', parseTrip('פנימי בב 50').intracity === true);
ok('לא זוהה', parseTrip('שלום') === null);

// ── שכונות ירושלים ──
eq('מבית שמש לרמות', pickHood(parseTrip('מבית שמש לרמות')), { origin:'בית שמש', destCity:'ירושלים', destHood:'רמות' });
ok('הר נוף = שכונת ירושלים', parseTrip('מהר נוף לבית שמש').originCity === 'ירושלים');

// ── לקחים מצ'אט לקוחה אמיתי (חן) ──
ok('קריית (איות כפול) = ירושלים', resolveCity('קריית משה').city === 'ירושלים');
eq('"קריית משה לגדרה"', pickHood(parseTrip('קריית משה לגדרה')), { origin:'קרית משה', destCity:'גדרה', destHood:null });
eq('"כמה זה מגדרה לתל אביב?"', (()=>{const t=parseTrip('כמה זה מגדרה לתל אביב?');return {o:t.originCity,d:t.destCity};})(), { o:'גדרה', d:'תל אביב' });

// ── מחירים ידניים (עדיפות עליונה) ──
ok('בית שמש→ירושלים = 150', lookupManualPrice('בית שמש','ירושלים').price === 150);
ok('ירושלים→בית שמש = 150 (סימטרי)', lookupManualPrice('ירושלים','בית שמש').price === 150);
ok('בית שמש→רמות = 170', lookupManualPrice('בית שמש','ירושלים',{bHood:'רמות'}).price === 170);
ok('רמות→בית שמש = 170 (סימטרי)', lookupManualPrice('ירושלים','בית שמש',{aHood:'רמות'}).price === 170);
ok('שכונה ללא override → 150', lookupManualPrice('בית שמש','ירושלים',{bHood:'גילה'}).price === 150);
ok('בית שמש→ירושלים הלו"ש = 300', lookupManualPrice('בית שמש','ירושלים',{roundTrip:true}).price === 300);

// ── שוק + ק"מ ──
ok('מחיר שוק קיים למסלול נפוץ', lookupMarketPrice('ירושלים','בית שמש') !== null);
ok('ק"מ 50 = 200', calcKmPrice(50).price === 200);

ok('כיווני: פ"ת→ב"ב = 50', lookupManualPrice('פתח תקווה','בני ברק').price === 50);
ok('כיווני: ב"ב→פ"ת = 80', lookupManualPrice('בני ברק','פתח תקווה').price === 80);
ok('ליבה: פ"ת→ירושלים = 70', lookupManualPrice('פתח תקווה','ירושלים').price === 70);
// ── ערים דו-מיליות וגזטיר ──
ok('בת ים לא נחתך', parseTrip('מבני ברק לבת ים').destCity === 'בת ים');
ok('מעלה אדומים שלם', parseTrip('מירושלים למעלה אדומים').destCity === 'מעלה אדומים');
ok('מודיעין עילית לא נחתך', parseTrip('מודיעין עילית לבני ברק').originCity === 'מודיעין עילית');
ok('גבעת שמואל ≠ גבעת זאב', parseTrip('מגבעת שמואל לראש העין').originCity === 'גבעת שמואל');
ok('ראש העין שלם', parseTrip('מגבעת שמואל לראש העין').destCity === 'ראש העין');
ok('עיר רחוקה מזוהה', parseTrip('מאשקלון לחיפה').destCity === 'חיפה');

console.log(`\nסה"כ: ${pass} עברו, ${fail} נכשלו`);
process.exit(fail?1:0);
