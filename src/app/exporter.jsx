import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4 = { width: 210, height: 297 }; // mm
const MARGIN = 8; // mm

const render = (node) =>
  toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    // Important : on capture la taille réelle du noeud sans le contraindre
    width: node.scrollWidth,
    height: node.scrollHeight,
    style: {
      // Évite les transformations héritées (sticky, etc.) pendant la capture
      transform: "none",
      margin: "0",
    },
  });

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

/**
 * Découpe une image en plusieurs pages A4 en respectant
 * les marges, sans jamais rogner ni dépasser.
 *
 * Principe :
 *  - On calcule la hauteur imprimable d'une page (usableH).
 *  - On convertit cette hauteur en pixels source (slicePx).
 *  - On découpe l'image en tranches de slicePx pixels.
 *  - Chaque tranche est dessinée sur un canvas blanc de la largeur
 *    de la zone imprimable, puis ajoutée à la page PDF.
 *  - La dernière tranche est complétée par du blanc si nécessaire,
 *    ce qui évite tout rognage.
 */
export async function exportPdf(node, name, orientation = "portrait") {
  const url = await render(node);
  const img = await loadImage(url);

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Zone imprimable (avec marges)
  const usableW = pageW - MARGIN * 2;
  const usableH = pageH - MARGIN * 2;

  // Largeur cible de l'image sur la page
  const imgW = usableW;
  // Hauteur proportionnelle de l'image complète
  const imgH = (img.height * imgW) / img.width;

  // Cas simple : tout tient sur une seule page
  if (imgH <= usableH) {
    pdf.addImage(url, "PNG", MARGIN, MARGIN, imgW, imgH);
    pdf.save(`${name}.pdf`);
    return;
  }

  // Sinon : découpage en tranches
  // Hauteur (en pixels source) correspondant à la zone imprimable
  const slicePx = Math.floor((usableH * img.width) / imgW);
  // Hauteur (en mm) d'une tranche une fois mise à l'échelle
  const sliceMm = (slicePx * imgW) / img.width;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;

  let page = 0;
  for (let y = 0; y < img.height; y += slicePx, page++) {
    const sliceH = Math.min(slicePx, img.height - y);
    const sliceHmm = (sliceH * imgW) / img.width;

    canvas.height = sliceH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, sliceH);
    ctx.drawImage(img, 0, y, img.width, sliceH, 0, 0, img.width, sliceH);

    if (page > 0) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      MARGIN,
      MARGIN,
      imgW,
      // On n'étire jamais au-delà de la tranche réelle
      Math.min(sliceHmm, sliceMm),
    );
  }

  pdf.save(`${name}.pdf`);
}
