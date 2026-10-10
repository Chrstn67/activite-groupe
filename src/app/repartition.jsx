// src/app/repartition.js
import { VILLES, GROUPES } from "@/app/publishers";

// Poids de la fonction de coût (plus c'est haut, plus c'est évité)
const P = {
  CONSECUTIVE: 200, // même groupe deux weekends d'affilée
  GAP_DEVIATION: 12, // écart (au carré) à la fréquence idéale (G / nb villes)
  COUNT_IMBALANCE: 40, // écart (au carré) du nb total de passages par groupe
  CITY_IMBALANCE: 25, // écart (au carré) du nb de passages par groupe ET par ville
  SAME_CITY_TWICE: 30, // même ville que le passage précédent du groupe
  SAME_CITY_RECENT: 20, // idem, en plus si le passage précédent est proche (<= 3)
  CITY_STREAK: 15, // même ville 2 fois sur les 3 derniers passages
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

/**
 * Coût global d'une répartition.
 * a[w][v] = index du groupe pour le weekend w dans la ville v.
 */
function cost(a, nG, nV) {
  const nW = a.length;
  const total = nW * nV;
  const idealCount = total / nG;
  const idealCity = total / (nG * nV);
  const idealGap = nG / nV;

  const count = new Array(nG).fill(0);
  const cityCount = Array.from({ length: nG }, () => new Array(nV).fill(0));
  const last = new Array(nG).fill(-1);
  const lastCity = new Array(nG).fill(-1);
  const prevCity = new Array(nG).fill(-1); // avant-dernière ville
  let c = 0;

  for (let w = 0; w < nW; w++) {
    for (let v = 0; v < nV; v++) {
      const g = a[w][v];
      count[g]++;
      cityCount[g][v]++;

      if (last[g] >= 0) {
        const gap = w - last[g];
        if (gap === 1 && nG > nV) c += P.CONSECUTIVE;
        const d = gap - idealGap;
        c += P.GAP_DEVIATION * d * d;

        if (lastCity[g] === v) {
          c += P.SAME_CITY_TWICE;
          if (gap <= 3) c += P.SAME_CITY_RECENT;
        } else if (prevCity[g] === v) {
          c += P.CITY_STREAK;
        }
      }
      prevCity[g] = lastCity[g];
      lastCity[g] = v;
      last[g] = w;
    }
  }

  for (let g = 0; g < nG; g++) {
    const d = count[g] - idealCount;
    c += P.COUNT_IMBALANCE * d * d;
    for (let v = 0; v < nV; v++) {
      const dc = cityCount[g][v] - idealCity;
      c += P.CITY_IMBALANCE * dc * dc;
    }
  }
  return c;
}

export function genererRepartition(weekendKeys, seed = Date.now()) {
  const rng = makeRng(seed >>> 0);
  const nG = GROUPES.length;
  const nV = VILLES.length;
  const nW = weekendKeys.length;
  if (!nW) return {};

  // --- 1. Base : rotation parfaite des groupes (fréquence idéale),
  // avec un ordre de groupes mélangé et un décalage de ville à chaque cycle.
  const order = GROUPES.map((_, i) => i).sort(() => rng() - 0.5);
  let a = [];
  for (let w = 0; w < nW; w++) {
    const row = [];
    for (let v = 0; v < nV; v++) {
      const slot = w * nV + v;
      const cycle = Math.floor(slot / nG);
      row.push(order[(slot + cycle) % nG]);
    }
    a.push(row);
  }

  // --- 2. Recuit simulé : swaps de slots / remplacement par un groupe au repos.
  let cur = cost(a, nG, nV);
  let best = a.map((r) => r.slice());
  let bestCost = cur;

  const ITER = Math.min(60000, 4000 + nW * 1500);
  const T0 = 60;
  const T1 = 0.5;

  for (let it = 0; it < ITER; it++) {
    const T = T0 * Math.pow(T1 / T0, it / ITER);
    const w1 = Math.floor(rng() * nW);
    const v1 = Math.floor(rng() * nV);
    const g1 = a[w1][v1];

    let undo;
    if (rng() < 0.35 && nG > nV) {
      // remplacer par un groupe qui ne passe pas ce weekend-là
      const libres = [];
      for (let g = 0; g < nG; g++) if (!a[w1].includes(g)) libres.push(g);
      if (!libres.length) continue;
      const g2 = libres[Math.floor(rng() * libres.length)];
      a[w1][v1] = g2;
      undo = () => {
        a[w1][v1] = g1;
      };
    } else {
      // échange avec un autre slot (même weekend = changement de ville)
      const w2 = rng() < 0.4 ? w1 : Math.floor(rng() * nW);
      const v2 = Math.floor(rng() * nV);
      if (w1 === w2 && v1 === v2) continue;
      const g2 = a[w2][v2];
      if (g1 === g2) continue;
      if (w1 !== w2 && (a[w1].includes(g2) || a[w2].includes(g1))) continue;
      a[w1][v1] = g2;
      a[w2][v2] = g1;
      undo = () => {
        a[w1][v1] = g1;
        a[w2][v2] = g2;
      };
    }

    const next = cost(a, nG, nV);
    const delta = next - cur;
    if (delta <= 0 || rng() < Math.exp(-delta / T)) {
      cur = next;
      if (cur < bestCost) {
        bestCost = cur;
        best = a.map((r) => r.slice());
      }
    } else {
      undo();
    }
  }

  const result = {};
  weekendKeys.forEach((key, w) => {
    const row = {};
    VILLES.forEach((ville, v) => {
      row[ville] = GROUPES[best[w][v]];
    });
    result[key] = row;
  });
  return result;
}

export function analyserRepartition(repartition, weekendKeys) {
  const countGroupe = Object.fromEntries(GROUPES.map((g) => [g, 0]));
  const countVille = Object.fromEntries(
    GROUPES.map((g) => [g, Object.fromEntries(VILLES.map((v) => [v, 0]))]),
  );
  let enchainements = 0;
  let memeVilleConsecutive = 0;
  const lastWeekend = Object.fromEntries(GROUPES.map((g) => [g, -99]));
  const lastVille = Object.fromEntries(GROUPES.map((g) => [g, null]));
  const gaps = [];

  weekendKeys.forEach((key, w) => {
    const row = repartition[key] || {};
    for (const v of VILLES) {
      const g = row[v];
      if (!g) continue;
      countGroupe[g]++;
      countVille[g][v]++;
      if (w - lastWeekend[g] === 1) enchainements++;
      if (lastWeekend[g] >= 0) gaps.push(w - lastWeekend[g]);
      if (lastVille[g] === v) memeVilleConsecutive++;
      lastWeekend[g] = w;
      lastVille[g] = v;
    }
  });

  const counts = Object.values(countGroupe);
  const ecartsVille = GROUPES.map((g) => {
    const c = Object.values(countVille[g]);
    return Math.max(...c) - Math.min(...c);
  });
  return {
    countGroupe,
    countVille,
    enchainements,
    memeVilleConsecutive,
    min: Math.min(...counts),
    max: Math.max(...counts),
    ecartVilleMax: Math.max(...ecartsVille),
    gapMin: gaps.length ? Math.min(...gaps) : null,
    gapMax: gaps.length ? Math.max(...gaps) : null,
  };
}
