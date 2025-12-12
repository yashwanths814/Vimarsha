import jsPDF from "jspdf";

type MaterialPdfData = {
  materialId?: string;
  manufacturerId?: string;
  manufacturerName?: string;
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
  depotEntryDate?: string;
  udmLotNumber?: string;
  inspectionOfficer?: string;
  tmsTrackId?: string;
  gpsLocation?: string;
  installationStatus?: string;
  dispatchDate?: string;
  warrantyExpiry?: string;
  failureCount?: string | number;
  lastMaintenanceDate?: string;
};

// Simple in-memory cache so we don’t re-fetch logos every time
const logoCache: Record<string, string> = {};

// Helper to convert public PNG → Base64 (browser only)
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

export default async function generateMaterialPdf(
  material: MaterialPdfData,
  fileName?: string
) {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 40;
  const marginX = 40;
  const bottomMargin = 60;

  // ======================================================
  // LOAD LOGOS FROM PUBLIC FOLDER
  // ======================================================
  const [g20Logo, railwayLogo, tourismLogo] = await Promise.all([
    loadImageAsBase64("/g20.png"),
    loadImageAsBase64("/railway.png"),
    loadImageAsBase64("/tourism.png"),
  ]);

  // ======================================================
  // PAGE BORDER
  // ======================================================
  pdf.setDrawColor(50);
  pdf.setLineWidth(1.2);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // ======================================================
  // LOGO ROW (3 LOGOS)
  // ======================================================
  const logoSize = 60;

  pdf.addImage(g20Logo, "PNG", 60, y, logoSize, logoSize);
  pdf.addImage(railwayLogo, "PNG", pageWidth / 2 - logoSize / 2, y, logoSize, logoSize);
  pdf.addImage(tourismLogo, "PNG", pageWidth - 60 - logoSize, y, logoSize, logoSize);

  y += 80;

  // ======================================================
  // GOVERNMENT TITLE
  // ======================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("INDIAN RAILWAYS – MATERIAL RECORD", pageWidth / 2, y, {
    align: "center",
  });
  y += 25;

  pdf.setFontSize(12);
  pdf.text(
    "Issued by: Materials & Track Maintenance Division",
    pageWidth / 2,
    y,
    {
      align: "center",
    }
  );
  y += 20;

  pdf.setDrawColor(180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  // ======================================================
  // HELPERS
  // ======================================================
  const ensureSpace = (minSpace = 40) => {
    if (y > pageHeight - bottomMargin - minSpace) {
      pdf.addPage();
      // redraw border on new page
      pdf.setDrawColor(50);
      pdf.setLineWidth(1.2);
      pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
      y = 40;
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

    const maxWidth = pageWidth - marginX - 160; // left label space
    const contentLines = pdf.splitTextToSize(text, maxWidth);

    const rowHeight = Math.max(18, contentLines.length * 14);
    ensureSpace(rowHeight + 10);

    pdf.text(label, marginX, y);
    pdf.text(": ", marginX + 120, y);
    pdf.text(contentLines, marginX + 140, y);

    y += rowHeight;
  };

  // ======================================================
  // SECTIONS
  // ======================================================
  sectionHeader("1. Core Details");
  writeLine("Material ID", material.materialId);
  writeLine("Manufacturer ID", material.manufacturerId);
  writeLine("Manufacturer Name", material.manufacturerName);

  sectionHeader("2. Technical Specifications");
  writeLine("Fitting Type", material.fittingType);
  writeLine("Drawing Number", material.drawingNumber);
  writeLine("Material Specification", material.materialSpec);
  writeLine("Weight (kg)", material.weightKg);
  writeLine("Board Gauge", material.boardGauge);
  writeLine("Manufacturing Date", material.manufacturingDate);
  writeLine(
    "Expected Service Life",
    material.expectedLifeYears ? `${material.expectedLifeYears} years` : "—"
  );

  sectionHeader("3. UDM & Purchase Details");
  writeLine("PO Number", material.purchaseOrderNumber);
  writeLine("Batch Number", material.batchNumber);
  writeLine("Depot Code", material.depotCode);
  writeLine("Depot Entry Date", material.depotEntryDate);
  writeLine("UDM Lot Number", material.udmLotNumber);
  writeLine("Inspection Officer", material.inspectionOfficer);

  sectionHeader("4. TMS & Lifecycle Information");
  writeLine("TMS Track ID", material.tmsTrackId);
  writeLine("GPS Location", material.gpsLocation);
  writeLine("Installation Status", material.installationStatus);
  writeLine("Dispatch Date", material.dispatchDate);
  writeLine("Warranty Expiry", material.warrantyExpiry);
  writeLine("Failure Count", material.failureCount);
  writeLine("Last Maintenance Date", material.lastMaintenanceDate);

  // ======================================================
  // FOOTER
  // ======================================================
  ensureSpace(40);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(
    "This document is system-generated and valid for official Railways use.",
    pageWidth / 2,
    pageHeight - 40,
    { align: "center" }
  );

  const finalName =
    fileName || `${material.materialId || "MATERIAL"}_Railway_Report.pdf`;

  pdf.save(finalName);
}
