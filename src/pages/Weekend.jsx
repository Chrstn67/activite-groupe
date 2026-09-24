import { useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Sparkles, BookOpen, Ban } from "lucide-react";
import { useStored } from "@/app/storage";
import {
  saturdays,
  iso,
  fmtDay,
  fmtShort,
  addDays,
  monthLabel,
} from "@/app/dates";
import Sheet from "@/components/Sheet";
import ExportBar from "@/components/ExportBar";

const EMPTY = {
  annule: false,
  motif: "",
  samediHeure: "09:30",
  samediLieu: "",
  dimanche: false,
  dimancheHeure: "09:30",
  dimancheLieu: "",
  notes: "",
  nettoyage: false,
  grandNettoyage: "",
  tpl: false,
  tplLieu: "",
};

const h = (t) => (t ? t.replace(":", "h") : "—");

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label, testId }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
      />
      <span className="toggle__track" />
      <span>{label}</span>
    </label>
  );
}

export default function Weekend() {
  const { mois } = useOutletContext();
  const [data, setData] = useStored(`pp_weekend_${mois}`, {});
  const sheetRef = useRef(null);
  const sats = saturdays(mois);
  const title = `Programme du Weekend - ${monthLabel(mois)}`;

  const get = (key) => ({ ...EMPTY, ...(data[key] || {}) });
  const set = (key, field, value) =>
    setData((d) => ({
      ...d,
      [key]: { ...EMPTY, ...(d[key] || {}), [field]: value },
    }));

  return (
    <div className="workspace">
      <section className="editor" data-testid="weekend-editor">
        <div className="editor__intro">
          <p className="overline">Programme weekend</p>
          <h1>{title}</h1>
          <p className="muted">
            Samedi, dimanche optionnel, activités du groupe, nettoyage et TPL.
          </p>
        </div>

        {sats.map((s) => {
          const key = iso(s);
          const w = get(key);
          const t = (field) => ({
            value: w[field],
            onChange: (e) => set(key, field, e.target.value),
          });
          return (
            <div className="card" key={key} data-testid={`weekend-card-${key}`}>
              <h3 className="card__title">
                Weekend du {fmtShort(s)} au {fmtShort(addDays(s, 1))}
              </h3>

              <Toggle
                checked={w.annule}
                onChange={(v) => set(key, "annule", v)}
                label="Pas de réunion prévue ce weekend"
                testId={`weekend-cancel-toggle-${key}`}
              />
              {w.annule ? (
                <Field label="Motif">
                  <input
                    type="text"
                    placeholder="Ex. assemblée régionale, visite du responsable de circonscription…"
                    {...t("motif")}
                    data-testid={`weekend-reason-input-${key}`}
                  />
                </Field>
              ) : (
                <>
                  <div className="grid-2">
                    <Field label="Samedi — horaire">
                      <input
                        type="time"
                        {...t("samediHeure")}
                        data-testid={`saturday-time-input-${key}`}
                      />
                    </Field>
                    <Field label="Samedi — lieu">
                      <input
                        type="text"
                        placeholder="Lieu"
                        {...t("samediLieu")}
                        data-testid={`saturday-place-input-${key}`}
                      />
                    </Field>
                  </div>
                  <Toggle
                    checked={w.dimanche}
                    onChange={(v) => set(key, "dimanche", v)}
                    label="Activer le dimanche"
                    testId={`sunday-toggle-${key}`}
                  />
                  {w.dimanche && (
                    <div className="grid-2">
                      <Field label="Dimanche — horaire">
                        <input
                          type="time"
                          {...t("dimancheHeure")}
                          data-testid={`sunday-time-input-${key}`}
                        />
                      </Field>
                      <Field label="Dimanche — lieu">
                        <input
                          type="text"
                          placeholder="Lieu"
                          {...t("dimancheLieu")}
                          data-testid={`sunday-place-input-${key}`}
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}

              <Field label="Activités du groupe (hors prédication)">
                <textarea
                  rows={2}
                  placeholder="Notes…"
                  {...t("notes")}
                  data-testid={`weekend-notes-input-${key}`}
                />
              </Field>

              <div className="grid-2 grid-2--top">
                <div>
                  <Toggle
                    checked={w.nettoyage}
                    onChange={(v) => set(key, "nettoyage", v)}
                    label="Groupe préposé au nettoyage cette semaine"
                    testId={`cleaning-toggle-${key}`}
                  />
                  {w.nettoyage && (
                    <Field label="Horaire du grand nettoyage (weekend)">
                      <input
                        type="text"
                        placeholder="Ex. samedi 8h00"
                        {...t("grandNettoyage")}
                        data-testid={`cleaning-time-input-${key}`}
                      />
                    </Field>
                  )}
                </div>
                <div>
                  <Toggle
                    checked={w.tpl}
                    onChange={(v) => set(key, "tpl", v)}
                    label="Groupe prévu pour le TPL"
                    testId={`tpl-toggle-${key}`}
                  />
                  {w.tpl && (
                    <Field label="Lieu du TPL">
                      <input
                        type="text"
                        placeholder="Ex. gare centrale"
                        {...t("tplLieu")}
                        data-testid={`tpl-place-input-${key}`}
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <aside className="preview">
        <ExportBar
          targetRef={sheetRef}
          fileName={`programme-weekend-${mois}`}
        />
        <Sheet ref={sheetRef} title={title} testId="weekend-sheet">
          {sats.map((s) => {
            const w = get(iso(s));
            return (
              <article
                className="we-block"
                key={iso(s)}
                data-testid={`weekend-preview-${iso(s)}`}
              >
                <h4 className="we-block__title">Weekend du {fmtShort(s)}</h4>
                {w.annule ? (
                  <p className="we-block__cancel">
                    <Ban size={14} /> Pas de réunion —{" "}
                    {w.motif || "motif non précisé"}
                  </p>
                ) : (
                  <table className="doc-table doc-table--compact">
                    <tbody>
                      <tr>
                        <td className="doc-table__date">{fmtDay(s)}</td>
                        <td className="mono">{h(w.samediHeure)}</td>
                        <td>{w.samediLieu || "—"}</td>
                      </tr>
                      {w.dimanche && (
                        <tr>
                          <td className="doc-table__date">
                            {fmtDay(addDays(s, 1))}
                          </td>
                          <td className="mono">{h(w.dimancheHeure)}</td>
                          <td>{w.dimancheLieu || "—"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                {(w.nettoyage || w.tpl) && (
                  <div className="badges">
                    {w.nettoyage && (
                      <span className="badge badge--clean">
                        <Sparkles size={12} /> Nettoyage de la semaine
                        {w.grandNettoyage
                          ? ` · grand nettoyage : ${w.grandNettoyage}`
                          : ""}
                      </span>
                    )}
                    {w.tpl && (
                      <span className="badge badge--tpl">
                        <BookOpen size={12} /> TPL
                        {w.tplLieu ? ` · ${w.tplLieu}` : ""}
                      </span>
                    )}
                  </div>
                )}
                {w.notes && (
                  <p className="we-block__notes">
                    <strong>Activités du groupe :</strong> {w.notes}
                  </p>
                )}
              </article>
            );
          })}
        </Sheet>
      </aside>
    </div>
  );
}
