export const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
export const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const pad = (n) => String(n).padStart(2, "0");
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export function daysOfMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  const out = [];
  for (
    let d = new Date(y, m - 1, 1);
    d.getMonth() === m - 1;
    d.setDate(d.getDate() + 1)
  ) {
    out.push(new Date(d));
  }
  return out;
}

export const weekdays = (ym) =>
  daysOfMonth(ym).filter((d) => d.getDay() >= 1 && d.getDay() <= 5);
export const saturdays = (ym) =>
  daysOfMonth(ym).filter((d) => d.getDay() === 6);

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Regroupe les jours par semaine (clé = lundi de la semaine)
export function groupWeeks(days) {
  const map = new Map();
  for (const d of days) {
    const monday = iso(addDays(d, -((d.getDay() + 6) % 7)));
    if (!map.has(monday)) map.set(monday, []);
    map.get(monday).push(d);
  }
  return [...map.entries()].map(([monday, list]) => ({ monday, days: list }));
}

export const fmtDay = (d) =>
  `${cap(JOURS[d.getDay()])} ${d.getDate()} ${MOIS[d.getMonth()]}`;
export const fmtShort = (d) => `${d.getDate()} ${MOIS[d.getMonth()]}`;

export function monthTitle(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${cap(MOIS[m - 1])} - ${y}`;
}
export function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${cap(MOIS[m - 1])} ${y}`;
}

// ——— Jours fériés français ———

// Algorithme de Meeus/Jones/Butcher pour calculer le dimanche de Pâques
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Retourne un Set de chaînes ISO (YYYY-MM-DD) pour l'année donnée
export function feriesSet(year) {
  const E = easterSunday(year);
  const fmt = (d) => iso(d);
  const shift = (n) => addDays(E, n);

  return new Set([
    `${year}-01-01`, // Jour de l'an
    fmt(shift(-2)), // Vendredi Saint
    fmt(shift(1)), // Lundi de Pâques
    `${year}-05-01`, // Fête du Travail
    `${year}-05-08`, // Victoire 1945
    fmt(shift(39)), // Ascension
    fmt(shift(50)), // Lundi de Pentecôte
    `${year}-07-14`, // Fête Nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
    `${year}-12-26`, // 2e jour de Noël (Alsace-Moselle)
  ]);
}
