import jsPDF from "jspdf";

type MaterialForPdf = {
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

export default function generateMaterialPdf(material: MaterialForPdf) {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 40;
  const topStart = 60;
  const bottomMargin = 40;
  let y = topStart;

  // ======================================================
  // BORDER DRAWER (reuse when new page added)
  // ======================================================
  const drawBorder = () => {
    pdf.setDrawColor(50);
    pdf.setLineWidth(1.2);
    pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
  };

  drawBorder();

  // ======================================================
  // SIMPLE GOVERNMENT EMBLEM (VECTOR)
  // ======================================================
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text("☸", pageWidth / 2 - 10, y); // Wheel symbol (Ashoka Chakra style)
  y += 35;

  // ======================================================
  // DOCUMENT HEADER
  // ======================================================
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
    { align: "center" }
  );
  y += 20;

  pdf.setDrawColor(180);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  // ======================================================
  // REUSABLE HELPERS
  // ======================================================

  const ensureSpace = (neededHeight = 40) => {
    if (y > pageHeight - bottomMargin - neededHeight) {
      pdf.addPage();
      drawBorder();
      y = topStart;
    }
  };

  const sectionHeader = (title: string) => {
    ensureSpace(50);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, marginX, y);
    y += 8;
    pdf.setDrawColor(80);
    pdf.setLineWidth(0.6);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 12;
  };

  const writeLine = (label: string, value: any) => {
    const safeValue =
      value === undefined || value === null || value === "" ? "—" : String(value);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const content = pdf.splitTextToSize(safeValue, pageWidth - (marginX + 160));
    const lineHeight = 14;
    const blockHeight = Math.max(18, content.length * lineHeight);

    ensureSpace(blockHeight + 10);

    pdf.text(label, marginX, y);
    pdf.text(": ", marginX + 120, y);
    pdf.text(content, marginX + 140, y);

    y += blockHeight;
  };

  // ======================================================
  // DOCUMENT BODY
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
    material.expectedLifeYears !== undefined && material.expectedLifeYears !== null
      ? `${material.expectedLifeYears} years`
      : "—"
  );

  sectionHeader("3. UDM & Purchase Details");
  writeLine("Purchase Order Number", material.purchaseOrderNumber);
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
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(
    "This document is system-generated and valid for official Railways use.",
    pageWidth / 2,
    pageHeight - 40,
    { align: "center" }
  );

  const fileName = `${material.materialId || "MATERIAL"}_Railway_Report.pdf`;
  pdf.save(fileName);
}
