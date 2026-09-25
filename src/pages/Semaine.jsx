import { Fragment, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useStored, uid } from "@/app/storage";
import {
  daysOfMonth,
  groupWeeks,
  fmtDay,
  fmtShort,
  iso,
  monthTitle,
  feriesSet,
} from "@/app/dates";
import { CONDUCTEURS } from "@/app/publishers";
import Sheet from "@/components/Sheet";
import ExportBar from "@/components/ExportBar";

const isWe = (d) => d.getDay() === 6 || d.getDay() === 0;
const isSpecial = (d, feries) => isWe(d) || feries.has(iso(d));

export default function Semaine() {
  const { mois } = useOutletContext();
  const [data, setData] = useStored(`pp_semaine_${mois}`, {});
  const sheetRef = useRef(null);
  const weeks = groupWeeks(daysOfMonth(mois));
  const title = `Programme de prédication ${monthTitle(mois)}`;

  const year = parseInt(mois.split("-")[0], 10);
  const feries = feriesSet(year);

  const add = (key) =>
    setData((d) => ({
      ...d,
      [key]: [
        ...(d[key] || []),
        { id: uid(), heure: "09:30", lieu: "", conducteur: "" },
      ],
    }));
  const upd = (key, id, field, value) =>
    setData((d) => ({
      ...d,
      [key]: d[key].map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  const del = (key, id) =>
    setData((d) => ({ ...d, [key]: d[key].filter((r) => r.id !== id) }));

  const sorted = (key) =>
    [...(data[key] || [])].sort((a, b) => a.heure.localeCompare(b.heure));
  const hasAny = weeks.some((w) =>
    w.days.some((d) => (data[iso(d)] || []).length),
  );

  return (
    <div className="workspace">
      <section className="editor" data-testid="semaine-editor">
        <div className="editor__intro">
          <p className="overline">Programme semaine</p>
          <h1>{title}</h1>
          <p className="muted">
            Ajoutez une ou plusieurs réunions pour chaque jour : heure, lieu et
            conducteur.
          </p>
        </div>

        {weeks.map((w) => (
          <div
            className="card"
            key={w.monday}
            data-testid={`week-card-${w.monday}`}
          >
            <h3 className="card__title">
              Semaine du {fmtShort(w.days[0])} au{" "}
              {fmtShort(w.days[w.days.length - 1])}
            </h3>
            {w.days.map((d) => {
              const key = iso(d);
              const rows = data[key] || [];
              const special = isSpecial(d, feries);
              return (
                <div
                  className={`day ${special ? "day--we" : ""}`}
                  key={key}
                  data-testid={`day-${key}`}
                >
                  <div className="day__head">
                    <span className="day__name">{fmtDay(d)}</span>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => add(key)}
                      data-testid={`add-meeting-${key}`}
                    >
                      <Plus size={14} /> Réunion
                    </button>
                  </div>
                  {rows.map((r) => (
                    <div
                      className="meeting"
                      key={r.id}
                      data-testid="meeting-row"
                    >
                      <input
                        type="time"
                        value={r.heure}
                        onChange={(e) =>
                          upd(key, r.id, "heure", e.target.value)
                        }
                        aria-label="Heure"
                        data-testid="meeting-time-input"
                      />
                      <input
                        type="text"
                        placeholder="Lieu"
                        value={r.lieu}
                        onChange={(e) => upd(key, r.id, "lieu", e.target.value)}
                        data-testid="meeting-place-input"
                      />
                      <select
                        value={r.conducteur}
                        onChange={(e) =>
                          upd(key, r.id, "conducteur", e.target.value)
                        }
                        data-testid="meeting-conductor-input"
                      >
                        <option value="">— Conducteur —</option>
                        {CONDUCTEURS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        className="icon-btn"
                        onClick={() => del(key, r.id)}
                        aria-label="Supprimer"
                        data-testid="meeting-delete-button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <aside className="preview">
        <ExportBar
          targetRef={sheetRef}
          fileName={`programme-semaine-${mois}`}
        />
        <Sheet
          ref={sheetRef}
          title={title}
          showGroup={false}
          testId="semaine-sheet"
        >
          {!hasAny ? (
            <p className="sheet__empty" data-testid="semaine-empty">
              Aucune réunion planifiée pour ce mois.
            </p>
          ) : (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Lieu</th>
                  <th>Conducteur</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => {
                  const days = w.days.filter(
                    (d) => (data[iso(d)] || []).length,
                  );
                  if (!days.length) return null;
                  return (
                    <Fragment key={w.monday}>
                      <tr className="doc-table__week">
                        <td colSpan={4}>
                          Semaine du {fmtShort(w.days[0])} au{" "}
                          {fmtShort(w.days[w.days.length - 1])}
                        </td>
                      </tr>
                      {days.map((d) =>
                        sorted(iso(d)).map((r, i, arr) => (
                          <tr
                            key={r.id}
                            className={`${i === arr.length - 1 ? "doc-table__last" : ""} ${isSpecial(d, feries) ? "doc-table__we" : ""}`}
                          >
                            {i === 0 && (
                              <td
                                rowSpan={arr.length}
                                className="doc-table__date"
                              >
                                {fmtDay(d)}
                              </td>
                            )}
                            <td className="mono">
                              {r.heure.replace(":", "h")}
                            </td>
                            <td>{r.lieu || "—"}</td>
                            <td>{r.conducteur || "—"}</td>
                          </tr>
                        )),
                      )}
                    </Fragment>
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
