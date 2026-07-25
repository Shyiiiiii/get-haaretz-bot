// ── ניסוח התשובות ללקוח (מיתוג Get הארץ) ───────────────
const PHONE = '050-6567045';
const SIGN = 'Get הארץ — שירות הסעות ורכבי מנהלים';

function quote({ origin, destination, price, roundTrip, confirmed }) {
  const tripLine = roundTrip
    ? '🔁 סוג נסיעה: הלוך-חזור (הלו״ש)\n⏳ כולל המתנה של עד שעה'
    : '➡️ סוג נסיעה: כיוון אחד';
  return (
    `שלום 👋\n` +
    `הנה המחיר לנסיעה שלך:\n\n` +
    `📍 ${origin} ⟵⟶ ${destination}\n` +
    `${tripLine}\n` +
    (confirmed
      ? `💰 מחיר: ${price} ₪\n\n`
      : `💰 מחיר: ${price} ₪\n\n* כפוף לאישור סופי.\n`) +
    `לתיאום והזמנה: ${PHONE}\n\n` + SIGN
  );
}

function intracity({ origin }) {
  return (
    `נסיעה עירונית ב${origin} 🚗\n` +
    `מחיר נסיעה פנימית נקבע לפי המסלול המדויק בתוך העיר.\n` +
    `נתאם ישירות: ${PHONE}\n\n` + SIGN
  );
}

function help() {
  return (
    `שלום! כאן שירות ההסעות של Get הארץ 🚗\n\n` +
    `כדי לקבל מחיר, שלחו מאיפה לאן — למשל:\n` +
    `• "מתל אביב לירושלים"\n` +
    `• "בני ברק - פתח תקווה"\n` +
    `• "ים שמש" (גם קיצורים)\n\n` +
    `לנסיעות מיוחדות או קבוצות — נתאם אישית.\n\n` + SIGN
  );
}

function notFound() {
  return (
    `לא הצלחתי לזהות את המסלול 🙏\n` +
    `נסו: "מ<מוצא> ל<יעד>" — למשל "מתל אביב לירושלים"\n` +
    `או שנתאם ישירות: ${PHONE}\n\n` + SIGN
  );
}


function noPrice({ origin, destination }) {
  return (
    `קיבלתי 👍\n` +
    `📍 ${origin} ⟵⟶ ${destination}\n` +
    `\nלמסלול הזה אני קובע מחיר אישי — נחזור אליכם עם הצעה מדויקת.\n` +
    `לתיאום מיידי: ${PHONE}\n\n` + SIGN
  );
}

module.exports = { quote, intracity, noPrice, help, notFound };
