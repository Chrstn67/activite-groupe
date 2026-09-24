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
