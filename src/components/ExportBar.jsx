import { useState } from "react";
import { toast } from "sonner";
import { FileDown, ImageDown, Loader2 } from "lucide-react";
import { exportPdf, exportPng } from "@/app/exporter";

export default function ExportBar({
  targetRef,
  fileName,
  orientation = "portrait",
}) {
  const [busy, setBusy] = useState(null);

  const run = async (kind) => {
    if (!targetRef.current) return;
    setBusy(kind);
    try {
      if (kind === "pdf")
        await exportPdf(targetRef.current, fileName, orientation);
      else await exportPng(targetRef.current, fileName);
      toast.success(kind === "pdf" ? "PDF exporté" : "Image exportée");
    } catch (e) {
      console.warn(e);
      toast.error("L'export a échoué, veuillez réessayer");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="export-bar" data-testid="export-bar">
      <span className="export-bar__label">Exporter</span>
      <button
        className="btn btn--dark"
        onClick={() => run("pdf")}
        disabled={!!busy}
        data-testid="btn-export-pdf"
      >
        {busy === "pdf" ? (
          <Loader2 size={16} className="spin" />
        ) : (
          <FileDown size={16} />
        )}{" "}
        PDF
      </button>
      <button
        className="btn btn--outline"
        onClick={() => run("png")}
        disabled={!!busy}
        data-testid="btn-export-png"
      >
        {busy === "png" ? (
          <Loader2 size={16} className="spin" />
        ) : (
          <ImageDown size={16} />
        )}{" "}
        Image
      </button>
    </div>
  );
}
