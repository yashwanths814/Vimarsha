import jsPDF from "jspdf";

export type EngineerReportData = {
  materialId?: string;

  fittingType?: string;
  drawingNumber?: string;
  materialSpec?: string;
  weightKg?: string;
  boardGauge?: string;
  manufacturingDate?: string;
  expectedLifeYears?: string | number;
  purchaseOrderNumber?: string;
  batchNumber?: string;
  depotCode?: string;
  udmLotNumber?: string;

  depotEntryDate?: string;
  tmsTrackId?: string;
  installationStatus?: string;
  gpsLocation?: string;
  jioTagPhotoData?: string;

  aiVerifiedComponent?: string | null;
  aiVerifiedConfidence?: number | null;
  aiVerifiedAt?: any;

  aiVarification?: {
    materialId?: string;
    status?: string;
    verified?: boolean;
    component?: string | null;
    confidencePercent?: number | null;
    aiVerifiedAt?: any;
  } | null;

  faultType?: string;
  faultSeverity?: string;
  faultDetectedAt?: string;
  faultSource?: string;
  maintenanceNotes?: string;

  lastMaintenanceDate?: string;
  engineerGpsLocation?: string;
  faultStatus?: string;
  engineerRemarks?: string;
  engineerRootCause?: string;
  engineerPreventiveAction?: string;
  engineerPhotoData?: string;
};

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

function fmtAnyDate(v: any): string {
  if (!v) return "—";
  try {
    if (typeof v?.toDate === "function") return v.toDate().toLocaleString();
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toLocaleString();
  } catch {}
  return String(v);
}

function toText(v: any): string {
  return v === undefined || v === null || v === "" ? "—" : String(v);
}

function isBase64Image(v: any): v is string {
  return typeof v === "string" && v.startsWith("data:image/");
}

export async function generateEngineerMaterialPdf(
  material: EngineerReportData,
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
  pdf.text("INDIAN RAILWAYS – ENGINEER VERIFICATION REPORT", pageWidth / 2, y, {
    align: "center",
  });
  y += 25;

  pdf.setFontSize(12);
  pdf.text("Issued by: Materials & Track Maintenance Division", pageWidth / 2, y, {
    align: "center",
  });
  y += 20;

  pdf.setDrawColor(180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  const ensureSpace = (minSpace = 40) => {
    if (y > pageHeight - bottomMargin - minSpace) {
      pdf.addPage();
      drawBorder();
      y = 40;
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(70);
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
    const text = toText(value);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const maxWidth = pageWidth - marginX - 160;
    const contentLines = pdf.splitTextToSize(text, maxWidth);

    const rowHeight = Math.max(18, contentLines.length * 14);
    ensureSpace(rowHeight + 10);

    pdf.text(label, marginX, y);
    pdf.text(": ", marginX + 120, y);
    pdf.text(contentLines, marginX + 140, y);

    y += rowHeight;
  };

  const writeMultiLineBlock = (label: string, value: any) => {
    ensureSpace(90);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(label, marginX, y);
    y += 14;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const maxWidth = pageWidth - marginX * 2;
    const lines = pdf.splitTextToSize(toText(value), maxWidth);

    const blockHeight = Math.max(24, lines.length * 14) + 10;
    ensureSpace(blockHeight);

    pdf.setDrawColor(220);
    pdf.setLineWidth(1);
    pdf.roundedRect(marginX, y, maxWidth, blockHeight, 10, 10);

    pdf.text(lines, marginX + 12, y + 18);
    y += blockHeight + 14;
  };

  const addPhoto = (label: string, src?: string) => {
    if (!isBase64Image(src)) return;

    const maxW = 220;
    const maxH = 220;

    ensureSpace(maxH + 70);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(label, marginX, y);
    y += 12;

    const x = marginX;
    const w = maxW;
    const h = maxH;

    pdf.setDrawColor(220);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, w, h, 12, 12);

    try {
      const fmt = src.includes("image/png") ? "PNG" : "JPEG";
      pdf.addImage(src, fmt as any, x + 8, y + 8, w - 16, h - 16);
    } catch {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Image could not be embedded.", x + 12, y + 22);
    }

    y += h + 18;
  };

  sectionHeader("1. Manufacturer Details (Read Only)");
  writeLine("Material ID", material.materialId);
  writeLine("Fitting Type", material.fittingType);
  writeLine("Drawing Number", material.drawingNumber);
  writeLine("Material Spec", material.materialSpec);
  writeLine("Weight (kg)", material.weightKg);
  writeLine("Board Gauge", material.boardGauge);
  writeLine("Manufacturing Date", material.manufacturingDate);
  writeLine(
    "Expected Service Life",
    material.expectedLifeYears ? `${material.expectedLifeYears} years` : "—"
  );
  writeLine("Purchase Order Number", material.purchaseOrderNumber);
  writeLine("Batch Number", material.batchNumber);
  writeLine("Depot Code", material.depotCode);
  writeLine("UDM Lot Number", material.udmLotNumber);

  sectionHeader("2. Installation Snapshot (Track Staff)");
  writeLine("Depot Entry Date", material.depotEntryDate);
  writeLine("TMS Track ID", material.tmsTrackId);
  writeLine("Installation Status", material.installationStatus);
  writeLine("GPS Installation Location", material.gpsLocation);

  writeLine(
    "AI Verification (Installation) - Component",
    material.aiVerifiedComponent ? String(material.aiVerifiedComponent).toUpperCase() : "—"
  );
  writeLine(
    "AI Verification (Installation) - Confidence",
    typeof material.aiVerifiedConfidence === "number"
      ? material.aiVerifiedConfidence.toFixed(2)
      : "—"
  );
  writeLine("AI Verification (Installation) - Verified At", fmtAnyDate(material.aiVerifiedAt));

  addPhoto("Jio Tag Photo", material.jioTagPhotoData);

  sectionHeader("2.1 AI Verification Details (ai_varification)");
  const av = material.aiVarification || null;
  writeLine("Status", av?.status || "—");
  writeLine(
    "Verified",
    av
      ? av.verified === true || String(av.status || "").toLowerCase() === "verified"
        ? "Yes"
        : "No"
      : "—"
  );
  writeLine("Component", av?.component ? String(av.component).toUpperCase() : "—");
  writeLine(
    "Confidence (%)",
    typeof av?.confidencePercent === "number" ? av.confidencePercent.toFixed(2) : "—"
  );
  writeLine("Verified At", fmtAnyDate(av?.aiVerifiedAt));
  writeLine("Material ID (ai_varification)", av?.materialId || material.materialId || "—");

  sectionHeader("3. Fault & Detection Details");
  writeLine("Fault Type", material.faultType || "—");
  writeLine("Fault Severity", material.faultSeverity || "—");
  writeLine("Fault Detected At", material.faultDetectedAt || "—");
  writeLine("Detection Source", material.faultSource || "Hardware / Druva");
  writeMultiLineBlock("Maintenance Staff Notes", material.maintenanceNotes);

  sectionHeader("4. Engineer Verification & Closure");
  writeLine("Last Maintenance Date (Engineer Confirmed)", material.lastMaintenanceDate);
  writeLine("Engineer GPS (During Visit)", material.engineerGpsLocation);
  writeLine("Fault Status", material.faultStatus);

  writeMultiLineBlock("Engineer Remarks", material.engineerRemarks);
  writeMultiLineBlock("Root Cause (Diagnosis)", material.engineerRootCause);
  writeMultiLineBlock("Preventive Measures", material.engineerPreventiveAction);

  addPhoto("Engineer Visit Photo", material.engineerPhotoData);

  ensureSpace(40);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(
    "This document is system-generated and valid for official Railways use.",
    pageWidth / 2,
    pageHeight - 40,
    { align: "center" }
  );

  const finalName = fileName || `${material.materialId || "MATERIAL"}_Engineer_Report.pdf`;
  pdf.save(finalName);
}
