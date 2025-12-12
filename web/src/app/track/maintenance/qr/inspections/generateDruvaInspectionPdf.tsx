import jsPDF from "jspdf";

type Detection = {
  bbox?: number[] | { [k: string]: number };
  class?: string;
  class_index?: number;
  color?: string;
  confidence?: number;
};

type InspectionRow = {
  id: string;
  camera_id?: number;
  detections?: Record<string, Detection> | Detection[];
};

// cache
const logoCache: Record<string, string> = {};

async function loadImageAsBase64(src: string): Promise<string> {
  if (logoCache[src]) return logoCache[src];
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      logoCache[src] = base64;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

function toDetectionsArray(d: InspectionRow["detections"]): Detection[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return Object.values(d).filter(Boolean);
}

function bboxToString(bbox?: Detection["bbox"]) {
  if (!bbox) return "—";
  if (Array.isArray(bbox)) return bbox.map((n) => Number(n).toFixed(0)).join(", ");
  const arr = Object.keys(bbox)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => (bbox as any)[k]);
  return arr.map((n) => Number(n).toFixed(0)).join(", ");
}

function fmtConfidence(c?: number) {
  if (c === undefined || c === null) return "—";
  const n = Number(c);
  if (Number.isNaN(n)) return "—";
  return n > 1 ? n.toFixed(2) : `${(n * 100).toFixed(2)}%`;
}

export default async function generateDruvaInspectionPdf(
  row: InspectionRow,
  fileName?: string
) {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 40;
  const marginX = 40;
  const bottomMargin = 60;

  const [g20Logo, railwayLogo, tourismLogo] = await Promise.all([
    loadImageAsBase64("/g20.png"),
    loadImageAsBase64("/railway.png"),
    loadImageAsBase64("/tourism.png"),
  ]);

  const drawBorder = () => {
    pdf.setDrawColor(50);
    pdf.setLineWidth(1.2);
    pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
  };

  const drawHeader = () => {
    drawBorder();

    const logoSize = 60;

    pdf.addImage(g20Logo, "PNG", 60, y, logoSize, logoSize);
    pdf.addImage(
      railwayLogo,
      "PNG",
      pageWidth / 2 - logoSize / 2,
      y,
      logoSize,
      logoSize
    );
    pdf.addImage(tourismLogo, "PNG", pageWidth - 60 - logoSize, y, logoSize, logoSize);

    y += 80;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("DRUVA – INSPECTION REPORT", pageWidth / 2, y, { align: "center" });
    y += 25;

    pdf.setFontSize(12);
    pdf.text("Issued by: Druva Track Monitoring & Maintenance", pageWidth / 2, y, {
      align: "center",
    });
    y += 20;

    pdf.setDrawColor(180);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 20;
  };

  const ensureSpace = (minSpace = 40) => {
    if (y > pageHeight - bottomMargin - minSpace) {
      pdf.addPage();
      y = 40;
      drawHeader();
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(60);
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, marginX, y);
    y += 8;
    pdf.setDrawColor(80);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 12;
  };

  const writeLine = (label: string, value: any) => {
    const text = value === undefined || value === null || value === "" ? "—" : String(value);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const maxWidth = pageWidth - marginX - 160;
    const lines = pdf.splitTextToSize(text, maxWidth);

    const rowHeight = Math.max(18, lines.length * 14);
    ensureSpace(rowHeight + 10);

    pdf.text(label, marginX, y);
    pdf.text(": ", marginX + 120, y);
    pdf.text(lines, marginX + 140, y);

    y += rowHeight;
  };

  drawHeader();

  const epoch = Number(row.id);
  const timeStr = Number.isFinite(epoch) ? new Date(epoch).toLocaleString() : row.id;
  const dets = toDetectionsArray(row.detections);

  sectionHeader("1. Inspection Summary");
  writeLine("Inspection ID", row.id);
  writeLine("Time", timeStr);
  writeLine("Camera ID", row.camera_id ?? "—");
  writeLine("Detections Count", dets.length);

  sectionHeader("2. Detections Detail");
  if (dets.length === 0) {
    writeLine("Detections", "No detections found for this inspection.");
  } else {
    dets.forEach((d, idx) => {
      ensureSpace(110);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`Detection ${idx + 1}`, marginX, y);
      y += 16;

      writeLine("Class", d.class || "unknown");
      writeLine("Confidence", fmtConfidence(d.confidence));
      writeLine("Class Index", d.class_index ?? "—");
      writeLine("Color", d.color || "—");
      writeLine("BBox", bboxToString(d.bbox));

      pdf.setDrawColor(220);
      pdf.setLineWidth(0.8);
      pdf.line(marginX, y + 6, pageWidth - marginX, y + 6);
      y += 14;
    });
  }

  sectionHeader("3. System Info");
  writeLine("Data Source", "Firebase Realtime Database");
  writeLine("Path", "inspections");
  writeLine("Generated On", new Date().toLocaleString());

  ensureSpace(40);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(
    "This document is system-generated and valid for official Druva / Railways use.",
    pageWidth / 2,
    pageHeight - 40,
    { align: "center" }
  );

  const finalName = fileName || `DRUVA_INSPECTION_${row.id || "REPORT"}.pdf`;
  pdf.save(finalName);
}
