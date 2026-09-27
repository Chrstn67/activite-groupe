// src/pages/Tpl.jsx
import { useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { MapPin, CalendarRange, Wand2, RotateCcw, Dices } from "lucide-react";
import { toast } from "sonner";
import { useStored } from "@/app/storage";
import { saturdays, iso, addDays, monthLabel, MOIS } from "@/app/dates";
import { GROUPES, VILLES } from "@/app/publishers";
import { genererRepartition } from "@/app/repartition";
import Sheet from "@/components/Sheet";
import ExportBar from "@/components/ExportBar";

function nextMonths(ym, count = 3) {
  const [y, m] = ym.split("-").map(Number);
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(y, m - 1 + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function saturdaysOfMonths(months) {
  const out = [];
  for (const ym of months) {
    for (const s of saturdays(ym)) {
      out.push({ date: s, ym });
    }
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");
/** "04-05 juillet 2026" */
const fmtWeekend = (sat) => {
  const dim = addDays(sat, 1);
  const m = MOIS[sat.getMonth()];
  const y = sat.getFullYear();
  return `${pad(sat.getDate())}-${pad(dim.getDate())} ${m} ${y}`;
};

const emptyVilles = () => Object.fromEntries(VILLES.map((v) => [v, ""]));
const CITY_VARIANTS = ["a", "b", "c", "d", "e"];

export default function Tpl() {
  const { mois } = useOutletContext();
  const months = useMemo(() => nextMonths(mois, 3), [mois]);
  const sats = useMemo(() => saturdaysOfMonths(months), [months]);
  const weekendKeys = useMemo(() => sats.map(({ date }) => iso(date)), [sats]);

  const storageKey = `pp_tpl_${months[0]}`;
  const [data, setData] = useStored(storageKey, {});
  const sheetRef = useRef(null);

  const title = `Programme TPL — ${monthLabel(months[0])} à ${monthLabel(
    months[2],
  )}`;

  const getVilles = (key) => ({ ...emptyVilles(), ...(data[key] || {}) });

  const setVille = (key, ville, groupe) =>
    setData((d) => ({
      ...d,
      [key]: { ...emptyVilles(), ...(d[key] || {}), [ville]: groupe },
    }));

  const weekendRempli = (key) => Object.values(getVilles(key)).some((g) => g);

  const hasAny = sats.some(({ date }) => weekendRempli(iso(date)));

  const autoRepartir = (seed = Date.now()) => {
    const proposition = genererRepartition(weekendKeys, seed);
    setData((d) => {
      const next = { ...d };
      for (const [key, row] of Object.entries(proposition)) {
        next[key] = { ...emptyVilles(), ...row };
      }
      return next;
    });
    toast.success("Répartition aléatoire appliquée");
  };

  const resetAll = () => {
    if (!confirm("Effacer toutes les affectations de la période ?")) return;
    setData((d) => {
      const next = { ...d };
      for (const key of weekendKeys) next[key] = emptyVilles();
      return next;
    });
    toast.success("Répartition réinitialisée");
  };

  return (
    <div className="workspace">
      {/* ——— Édition ——— */}
      <section className="editor" data-testid="tpl-editor">
        <div className="editor__intro">
          <p className="overline">Témoignage public en location</p>
          <h1>{title}</h1>
          <p className="muted">
            Pour chaque weekend, sélectionnez le groupe affecté à chacune des 3
            villes — ou utilisez la répartition automatique.
          </p>
          <div className="tpl-actions">
            <button
              className="btn btn--dark btn--sm"
              onClick={() => autoRepartir()}
              data-testid="tpl-auto-repartition"
            >
              <Wand2 size={14} /> Répartition auto
            </button>
            <button
              className="btn btn--outline btn--sm"
              onClick={() => autoRepartir(Date.now())}
              data-testid="tpl-reroll"
            >
              <Dices size={14} /> Autre proposition
            </button>
            <button
              className="btn btn--outline btn--sm"
              onClick={resetAll}
              data-testid="tpl-reset"
            >
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        </div>

        <div className="card card--flush">
          <div className="table-scroll">
            <table className="tpl-grid tpl-grid--edit">
              <thead>
                <tr>
                  <th className="tpl-grid__date">Weekend</th>
                  {VILLES.map((ville, i) => (
                    <th
                      key={ville}
                      className={`tpl-grid__head tpl-grid__head--${CITY_VARIANTS[i]}`}
                    >
                      {ville}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sats.map(({ date }) => {
                  const key = iso(date);
                  const villes = getVilles(key);
                  return (
                    <tr key={key}>
                      <td className="tpl-grid__date">
                        <CalendarRange
                          size={13}
                          style={{ verticalAlign: "-2px", marginRight: 5 }}
                        />
                        {fmtWeekend(date)}
                      </td>
                      {VILLES.map((ville, i) => (
                        <td
                          key={ville}
                          className={`tpl-grid__cell tpl-grid__cell--${CITY_VARIANTS[i]}`}
                        >
                          <select
                            value={villes[ville]}
                            onChange={(e) =>
                              setVille(key, ville, e.target.value)
                            }
                            data-testid={`tpl-groupe-${key}-${ville}`}
                          >
                            <option value="">—</option>
                            {GROUPES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ——— Aperçu / Export ——— */}
      <aside className="preview">
        <ExportBar
          targetRef={sheetRef}
          fileName={`programme-tpl-${months[0]}_${months[2]}`}
          orientation="portrait"
        />
        <Sheet
          ref={sheetRef}
          title={title}
          testId="tpl-sheet"
          className="tpl-sheet-fit"
        >
          {!hasAny ? (
            <p className="sheet__empty" data-testid="tpl-empty">
              Aucun groupe planifié pour cette période.
            </p>
          ) : (
            <table className="tpl-grid tpl-grid--print">
              <thead>
                <tr>
                  <th className="tpl-grid__date">Weekend</th>
                  {VILLES.map((ville, i) => (
                    <th
                      key={ville}
                      className={`tpl-grid__head tpl-grid__head--${CITY_VARIANTS[i]}`}
                    >
                      {ville}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sats.map(({ date }, idx) => {
                  const key = iso(date);
                  const villes = getVilles(key);
                  if (!weekendRempli(key)) return null;
                  const zebra = idx % 2 === 0;
                  return (
                    <tr
                      key={key}
                      className={zebra ? "tpl-grid__row--zebra" : ""}
                    >
                      <td className="tpl-grid__date">{fmtWeekend(date)}</td>
                      {VILLES.map((ville, i) => (
                        <td
                          key={ville}
                          className={`tpl-grid__cell tpl-grid__cell--${CITY_VARIANTS[i]}`}
                        >
                          {villes[ville] || "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Sheet>
      </aside>
    </div>
  );
}
