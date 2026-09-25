import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useStored } from "@/app/storage";
import { monthLabel } from "@/app/dates";
import { initialData } from "@/app/publishers";
import Sheet from "@/components/Sheet";
import ExportBar from "@/components/ExportBar";

// État vide pour les champs mensuels (heures, crédit, notes…)
const EMPTY = {
  preche: false,
  contrat: "15",
  heures: "",
  cours: false,
  nbCours: "",
  credit: "",
  motifCredit: "",
  notes: "",
};

const slug = (n) =>
  n
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

const num = (v) => Number(v) || 0;

export default function Rapports() {
  const { mois } = useOutletContext();
  const [data, setData] = useStored(`pp_rapports_${mois}`, {});
  const sheetRef = useRef(null);
  const title = `Rapport d'activité du Groupe - ${monthLabel(mois)}`;

  // Fusionne les données statiques (publishers) avec les données mensuelles (localStorage)
  const get = (name) => {
    const base = initialData.find((p) => p.name === name) || {};
    const saved = data[name] || {};
    return { ...EMPTY, ...base, ...saved };
  };

  const set = (n, field, value) =>
    setData((d) => ({
      ...d,
      [n]: { ...(d[n] || {}), [field]: value },
    }));

  // Toggle permanent : on ne peut pas être permanent ET auxiliaire
  const togglePermanent = (n, checked) => {
    setData((d) => {
      const current = d[n] || {};
      return {
        ...d,
        [n]: {
          ...current,
          permanent: checked,
          auxiliar: checked ? false : current.auxiliar,
        },
      };
    });
  };

  const toggleAuxiliar = (n, checked) => {
    setData((d) => {
      const current = d[n] || {};
      return {
        ...d,
        [n]: {
          ...current,
          auxiliar: checked,
          permanent: checked ? false : current.permanent,
        },
      };
    });
  };

  const rows = initialData.map((p) => {
    const merged = get(p.name);
    return { nom: p.name, ...merged };
  });

  const statut = (r) => {
    if (r.permanent) return "Permanent";
    if (r.auxiliar) return `Auxiliaire ${r.contrat}h`;
    return "—";
  };

  return (
    <div className="stack">
      <section className="editor editor--wide" data-testid="rapports-editor">
        <div className="editor__intro">
          <p className="overline">Rapports d'activités</p>
          <h1>{title}</h1>
          <p className="muted">
            Cochez l'activité de chaque proclamateur. Les heures ne concernent
            que les pionniers.
          </p>
        </div>
        <div className="card card--flush">
          <div className="table-scroll">
            <table className="edit-table" data-testid="rapports-table">
              <thead>
                <tr>
                  <th>Proclamateur</th>
                  <th>A prêché</th>
                  <th>Perm.</th>
                  <th>Aux.</th>
                  <th>Contrat</th>
                  <th>Heures</th>
                  <th>Cours</th>
                  <th>Nb</th>
                  <th>Crédit (h)</th>
                  <th>Motif du crédit</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = slug(r.nom);
                  const isPionnier = r.permanent || r.auxiliar;
                  return (
                    <tr key={r.nom} data-testid={`report-row-${s}`}>
                      <td className="edit-table__name">{r.nom}</td>
                      <td className="c">
                        <input
                          type="checkbox"
                          checked={r.worked}
                          onChange={(e) =>
                            set(r.nom, "worked", e.target.checked)
                          }
                          data-testid={`report-preached-${s}`}
                        />
                      </td>
                      <td className="c">
                        <input
                          type="checkbox"
                          checked={r.permanent}
                          onChange={(e) =>
                            togglePermanent(r.nom, e.target.checked)
                          }
                          data-testid={`report-regular-${s}`}
                        />
                      </td>
                      <td className="c">
                        <input
                          type="checkbox"
                          checked={r.auxiliar}
                          onChange={(e) =>
                            toggleAuxiliar(r.nom, e.target.checked)
                          }
                          data-testid={`report-auxiliary-${s}`}
                        />
                      </td>
                      <td>
                        <select
                          value={r.contrat}
                          disabled={!r.auxiliar}
                          onChange={(e) =>
                            set(r.nom, "contrat", e.target.value)
                          }
                          data-testid={`report-contract-${s}`}
                        >
                          <option value="15">15 h</option>
                          <option value="30">30 h</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="num"
                          disabled={!isPionnier}
                          value={r.heures}
                          onChange={(e) => set(r.nom, "heures", e.target.value)}
                          data-testid={`report-hours-${s}`}
                        />
                      </td>
                      <td className="c">
                        <input
                          type="checkbox"
                          checked={r.cours}
                          onChange={(e) =>
                            set(r.nom, "cours", e.target.checked)
                          }
                          data-testid={`report-studies-${s}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="num"
                          disabled={!r.cours}
                          value={r.nbCours}
                          onChange={(e) =>
                            set(r.nom, "nbCours", e.target.value)
                          }
                          data-testid={`report-studies-count-${s}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="num"
                          value={r.credit}
                          onChange={(e) => set(r.nom, "credit", e.target.value)}
                          data-testid={`report-credit-${s}`}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          disabled={!num(r.credit)}
                          value={r.motifCredit}
                          onChange={(e) =>
                            set(r.nom, "motifCredit", e.target.value)
                          }
                          placeholder="Motif"
                          data-testid={`report-credit-reason-${s}`}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={r.notes}
                          onChange={(e) => set(r.nom, "notes", e.target.value)}
                          placeholder="Notes"
                          data-testid={`report-notes-${s}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="preview preview--wide">
        <ExportBar
          targetRef={sheetRef}
          fileName={`rapport-activite-${mois}`}
          orientation="landscape"
        />
        <Sheet ref={sheetRef} title={title} wide testId="rapports-sheet">
          <table className="doc-table doc-table--report">
            <thead>
              <tr>
                <th>Proclamateur</th>
                <th>A prêché</th>
                <th>Pionnier</th>
                <th>Heures</th>
                <th>Cours bibliques</th>
                <th>Crédit</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isPionnier = r.permanent || r.auxiliar;
                return (
                  <tr key={r.nom}>
                    <td className="doc-table__date">{r.nom}</td>
                    <td className="c">{r.worked ? "✓" : "✗"}</td>
                    <td>{statut(r)}</td>
                    <td className="c mono">
                      {isPionnier ? num(r.heures) : "—"}
                    </td>
                    <td className="c">{r.cours ? num(r.nbCours) : ""}</td>
                    <td>
                      {num(r.credit)
                        ? `${num(r.credit)} h${r.motifCredit ? ` (${r.motifCredit})` : ""}`
                        : "—"}
                    </td>
                    <td>{r.notes || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Sheet>
      </section>
    </div>
  );
}
