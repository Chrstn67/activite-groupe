import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const render = (node) =>
  toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function exportPng(node, name) {
  const url = await render(node);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.png`;
  a.click();
}

export async function exportPdf(node, name, orientation = "portrait") {
  const url = await render(node);
  const img = await loadImage(url);
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const w = pw - margin * 2;
  const usable = ph - margin * 2;
  const h = (img.height * w) / img.width;

  if (h <= usable) {
    pdf.addImage(url, "PNG", margin, margin, w, h);
  } else {
    // Découpe l'image sur plusieurs pages A4
    const slicePx = Math.floor((usable * img.width) / w);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    for (let y = 0, page = 0; y < img.height; y += slicePx, page++) {
      const sh = Math.min(slicePx, img.height - y);
      canvas.height = sh;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, sh);
      ctx.drawImage(img, 0, y, img.width, sh, 0, 0, img.width, sh);
      if (page > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        w,
        (sh * w) / img.width,
      );
    }
  }
  pdf.save(`${name}.pdf`);
}
