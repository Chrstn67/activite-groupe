// src/app/repartition.js
import { VILLES, GROUPES } from "@/app/publishers";

const P = {
  CONSECUTIVE: 120,
  RECENT_2: 50,
  RECENT_3: 20,
  SAME_CITY_TWICE: 14,
  SAME_CITY_RECENT: 35,
  COUNT_IMBALANCE: 10,
};

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function genererRepartition(weekendKeys, seed = Date.now()) {
  const rng = makeRng(seed >>> 0);
  const result = {};

  const countGroupe = Object.fromEntries(GROUPES.map((g) => [g, 0]));
  const countVille = Object.fromEntries(
    GROUPES.map((g) => [g, Object.fromEntries(VILLES.map((v) => [v, 0]))]),
  );
  const dernierPassage = Object.fromEntries(GROUPES.map((g) => [g, -99]));
  const derniereVille = Object.fromEntries(GROUPES.map((g) => [g, null]));

  for (let w = 0; w < weekendKeys.length; w++) {
    const key = weekendKeys[w];
    const used = new Set();
    const row = {};
    const villesOrdre = [...VILLES].sort(() => rng() - 0.5);

    for (const ville of villesOrdre) {
      const candidats = [];
      for (const g of GROUPES) {
        if (used.has(g)) continue;
        const gap = w - dernierPassage[g];
        let score = 0;

        if (gap === 1) score += P.CONSECUTIVE;
        else if (gap === 2) score += P.RECENT_2;
        else if (gap === 3) score += P.RECENT_3;

        score += countGroupe[g] * P.COUNT_IMBALANCE;
        const dejaDansVille = countVille[g][ville];
        score += dejaDansVille * P.SAME_CITY_TWICE;
        if (dejaDansVille >= 1 && gap <= 3) score += P.SAME_CITY_RECENT;
        if (derniereVille[g] === ville) score += P.SAME_CITY_RECENT;

        candidats.push({ g, score });
      }

      if (!candidats.length) continue;

      const T = 55;
      const minScore = Math.min(...candidats.map((c) => c.score));
      const weighted = candidats.map((c) => ({
        g: c.g,
        w: Math.exp(-(c.score - minScore) / T),
      }));
      const total = weighted.reduce((s, x) => s + x.w, 0);
      let r = rng() * total;
      let chosen = weighted[weighted.length - 1].g;
      for (const { g, w: weight } of weighted) {
        r -= weight;
        if (r <= 0) {
          chosen = g;
          break;
        }
      }

      row[ville] = chosen;
      used.add(chosen);
      countGroupe[chosen]++;
      countVille[chosen][ville]++;
      dernierPassage[chosen] = w;
      derniereVille[chosen] = ville;
    }

    result[key] = row;
  }

  return result;
}

export function analyserRepartition(repartition, weekendKeys) {
  const countGroupe = Object.fromEntries(GROUPES.map((g) => [g, 0]));
  const countVille = Object.fromEntries(
    GROUPES.map((g) => [g, Object.fromEntries(VILLES.map((v) => [v, 0]))]),
  );
  let enchainements = 0;
  const lastWeekend = Object.fromEntries(GROUPES.map((g) => [g, -99]));

  weekendKeys.forEach((key, w) => {
    const row = repartition[key] || {};
    for (const v of VILLES) {
      const g = row[v];
      if (!g) continue;
      countGroupe[g]++;
      countVille[g][v]++;
      if (w - lastWeekend[g] === 1) enchainements++;
      lastWeekend[g] = w;
    }
  });

  const counts = Object.values(countGroupe);
  return {
    countGroupe,
    countVille,
    enchainements,
    min: Math.min(...counts),
    max: Math.max(...counts),
  };
}
