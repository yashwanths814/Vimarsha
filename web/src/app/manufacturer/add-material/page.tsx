"use client";

import { useState, FormEvent, useRef } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/shared/firebaseConfig";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import QRCode from "qrcode-generator";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// =============== MATERIAL TYPE ===============
// (unchanged)
type Material = {
  materialId: string;
  manufacturerId: string;
  manufacturerName: string;

  fittingType: string;
  drawingNumber: string;
  materialSpec: string;
  weightKg: string;
  boardGauge: string;
  manufacturingDate: string;
  expectedLifeYears: string;

  purchaseOrderNumber: string;
  batchNumber: string;
  depotCode: string;
  depotEntryDate: string;
  udmLotNumber: string;
  inspectionOfficer: string;

  tmsTrackId: string;
  gpsLocation: string;
  installationStatus: string;
  dispatchDate: string;
  warrantyExpiry: string;
  failureCount: string;
  lastMaintenanceDate: string;
};

const FITTING_TYPES = ["Elastic Rail Clip", "Rail Pad", "Liner", "Sleeper"];

// QR types (unchanged)
type TypeNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40;
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

function toTypeNumber(n: number): TypeNumber {
  const clamped = Math.max(0, Math.min(40, Math.round(n)));
  return clamped as TypeNumber;
}

// =============== NEW FIXED 7-CHAR ID GENERATORS ===============
function buildDepotSegment(depotCode: string): string {
  const cleaned = (depotCode || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  let seg = cleaned.slice(0, 3);
  if (!seg) seg = "XXX";
  return seg.padEnd(3, "X");
}

function buildLotSegment(batchNumber: string, udmLotNumber: string): string {
  const raw = (udmLotNumber || batchNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  let seg = raw.slice(-2);
  if (!seg) seg = "00";
  return seg.padStart(2, "0");
}

function buildDrawingSegment(drawingNumber: string): string {
  const raw = (drawingNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  let seg = raw.slice(-2);
  if (!seg) seg = "00";
  return seg.padStart(2, "0");
}

function generateMaterialId7(form: Material): string {
  const depotSeg = buildDepotSegment(form.depotCode); // 3
  const lotSeg = buildLotSegment(form.batchNumber, form.udmLotNumber); // 2
  const drawSeg = buildDrawingSegment(form.drawingNumber); // 2
  return depotSeg + lotSeg + drawSeg; // 7 chars
}

function getManufacturerId7(): string {
  const raw = auth.currentUser?.uid || "DEMOUSER";
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.slice(0, 7).padEnd(7, "X");
}

// =============== QR SVG GENERATOR (Material ID only) ===============
function buildQrSvg(
  payload: string,
  moduleSize = 5,
  margin = 2,
  color = "#000000",
  bgColor = "#ffffff",
  ecc: ErrorCorrectionLevel = "L",
  version: TypeNumber = 1
): string {
  const qr = QRCode(version, ecc);
  qr.addData(payload);

  try {
    qr.make();
  } catch (err) {
    console.warn("QR version 1 failed, falling back to auto", err);
    const qrAuto = QRCode(0, ecc);
    qrAuto.addData(payload);
    qrAuto.make();
    return buildQrSvgFromQR(qrAuto, moduleSize, margin, color, bgColor);
  }

  return buildQrSvgFromQR(qr, moduleSize, margin, color, bgColor);
}

function buildQrSvgFromQR(
  qr: any,
  moduleSize: number,
  margin: number,
  color: string,
  bgColor: string
): string {
  const count = qr.getModuleCount();
  const size = (count + margin * 2) * moduleSize;
  let rects = "";

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <g fill="${color}" shape-rendering="crispEdges">${rects}</g>
    </svg>
  `;
}

// =============== DOWNLOAD HELPERS ===============
function downloadFile(content: string | Blob, filename: string, mime?: string) {
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else {
    blob = new Blob([content], { type: mime || "application/octet-stream" });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return blob;
}

async function svgStringToPngDataUrl(
  svgString: string,
  scale = 2
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.nodeName !== "svg") {
    throw new Error("Invalid SVG");
  }

  const width = svgEl.getAttribute("width") || "400";
  const height = svgEl.getAttribute("height") || "400";
  svgEl.setAttribute("width", width);
  svgEl.setAttribute("height", height);

  const serialized = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([serialized], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const p = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG image"));
    });
    img.src = url;
    await p;

    const canvas = document.createElement("canvas");
    canvas.width = (img.naturalWidth || parseInt(width, 10)) * scale;
    canvas.height = (img.naturalHeight || parseInt(height, 10)) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context missing");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function svgToRasterDataUrl(
  svgString: string,
  type: "png" | "jpeg" = "png",
  scale = 6
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.nodeName !== "svg") {
    throw new Error("Invalid SVG");
  }
  const width = Number(svgEl.getAttribute("width") || 400);
  const height = Number(svgEl.getAttribute("height") || 400);

  const serialized = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([serialized], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context missing");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (type === "png") return canvas.toDataURL("image/png");
    return canvas.toDataURL("image/jpeg", 0.95);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function downloadPdfFromSvg(svgString: string, filename: string) {
  try {
    const imgDataUrl = await svgStringToPngDataUrl(svgString, 2);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const img = new Image();
    img.src = imgDataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
    const drawWidth = imgWidth * ratio;
    const drawHeight = imgHeight * ratio;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    pdf.addImage(imgDataUrl, "PNG", x, y, drawWidth, drawHeight);
    pdf.save(filename);
  } catch (err) {
    console.error("downloadPdfFromSvg error:", err);
  }
}

// =============== MAIN COMPONENT ===============
export default function AddMaterialPage() {
  const manufacturerId7 = getManufacturerId7();

  const [form, setForm] = useState<Material>({
    materialId: "",
    manufacturerId: manufacturerId7,
    manufacturerName: "",

    fittingType: "",
    drawingNumber: "",
    materialSpec: "",
    weightKg: "",
    boardGauge: "",
    manufacturingDate: "",
    expectedLifeYears: "",

    purchaseOrderNumber: "",
    batchNumber: "",
    depotCode: "",
    depotEntryDate: "",
    udmLotNumber: "",
    inspectionOfficer: "",

    tmsTrackId: "",
    gpsLocation: "",
    installationStatus: "Not Installed",
    dispatchDate: "",
    warrantyExpiry: "",
    failureCount: "0",
    lastMaintenanceDate: "",
  });

  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [qrColor, setQrColor] = useState<string>("#000000");
  const [qrBgColor, setQrBgColor] = useState<string>("#ffffff");
  const [qrModuleSize, setQrModuleSize] = useState<number>(6);
  const [qrMargin, setQrMargin] = useState<number>(2);
  const [qrEcc, setQrEcc] = useState<ErrorCorrectionLevel>("L");
  const [qrVersion, setQrVersion] = useState<TypeNumber>(1);

  const pdfRef = useRef<HTMLDivElement | null>(null);

  function handleChange(field: keyof Material, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      const materialId = generateMaterialId7(form);

      setForm((prev) => ({ ...prev, materialId }));

      const payload: Material & { createdAt: any } = {
        ...form,
        materialId,
        manufacturerId: manufacturerId7,
        createdAt: serverTimestamp(),
      };

      const docRef = doc(db, "materials", materialId);
      await setDoc(docRef, payload, { merge: false });

      const qrPayload = materialId;

      let svg: string;
      try {
        svg = buildQrSvg(
          qrPayload,
          qrModuleSize,
          qrMargin,
          qrColor,
          qrBgColor,
          qrEcc,
          qrVersion
        );
      } catch (err) {
        console.warn("Forced QR version failed, falling back to auto", err);
        svg = buildQrSvg(
          qrPayload,
          qrModuleSize,
          qrMargin,
          qrColor,
          qrBgColor,
          qrEcc,
          0
        );
      }

      setQrSvg(svg);
      setQrText(qrPayload);
      setMsg(
        "Material saved & QR generated! QR contains only the 7-character Material ID."
      );
    } catch (err) {
      console.error(err);
      setMsg("Error saving material.");
    }

    setSaving(false);
  }

  function regenerateQrFromPayload() {
    if (!qrText) return;
    try {
      const svg = buildQrSvg(
        qrText,
        qrModuleSize,
        qrMargin,
        qrColor,
        qrBgColor,
        qrEcc,
        qrVersion
      );
      setQrSvg(svg);
      setMsg("QR regenerated with new settings.");
    } catch (err) {
      console.warn(
        "Regenerate with forced version failed, falling back to auto.",
        err
      );
      const svg = buildQrSvg(
        qrText,
        qrModuleSize,
        qrMargin,
        qrColor,
        qrBgColor,
        qrEcc,
        0
      );
      setQrSvg(svg);
      setMsg("QR regenerated with fallback settings.");
    }
  }

  async function downloadPdf() {
    if (!pdfRef.current) return;

    await new Promise((r) => setTimeout(r, 150));

    const wrapper = pdfRef.current;
    const svgs = Array.from(wrapper.querySelectorAll("svg"));
    const replacements: { svg: SVGElement; imgEl: HTMLImageElement }[] = [];

    try {
      for (const svg of svgs) {
        const svgHtml = new XMLSerializer().serializeToString(svg);
        let dataUrl: string;
        try {
          dataUrl = await svgStringToPngDataUrl(svgHtml, 2);
        } catch (err) {
          const inner = svg.outerHTML || svgHtml;
          dataUrl = await svgStringToPngDataUrl(inner, 2);
        }
        const img = document.createElement("img");
        img.src = dataUrl;
        img.style.display = "block";
        const rect = svg.getBoundingClientRect();
        img.style.width = rect.width + "px";
        img.style.height = rect.height + "px";

        svg.parentNode?.replaceChild(img, svg);
        replacements.push({ svg: svg as SVGElement, imgEl: img });
      }

      const oldBg = wrapper.style.background;
      wrapper.style.background = "#ffffff";

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
      });

      wrapper.style.background = oldBg;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const marginMm = 10;
      const pxToMm = (px: number) => (px * 25.4) / 96;
      const imgWidthMm = pxToMm(canvas.width);
      const imgHeightMm = pxToMm(canvas.height);

      const maxWidthMm = pageWidth - marginMm * 2;
      const ratio = Math.min(maxWidthMm / imgWidthMm, 1);

      const drawWidthMm = imgWidthMm * ratio;
      const drawHeightMm = imgHeightMm * ratio;
      const x = (pageWidth - drawWidthMm) / 2;
      const y = marginMm;

      pdf.addImage(imgData, "PNG", x, y, drawWidthMm, drawHeightMm);
      pdf.save(`${form.materialId || "material"}_qr_details.pdf`);
    } catch (err) {
      console.error("downloadPdf error:", err);
    } finally {
      for (const r of replacements) {
        const { svg, imgEl } = r;
        imgEl.parentNode?.replaceChild(svg, imgEl);
      }
    }
  }

  // =============== UI (RESPONSIVE) ===============
  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      <div className="flex flex-col lg:flex-row pt-[90px]">
        <ManufacturerSidebar />

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#A259FF] mb-1">
            Add Material
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-600 mb-4 sm:mb-6 max-w-2xl">
            Fill manufacturing details. A 7-character Material ID and
            laser-compatible QR are generated and linked to UDM/TMS lifecycle.
          </p>

          {msg && (
            <div className="px-3 sm:px-4 py-2 rounded-xl bg-white shadow mb-4 text-[11px] sm:text-xs">
              {msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 sm:gap-8">
            {/* LEFT FORM */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 text-[11px] sm:text-xs space-y-6"
            >
              {/* Manufacturer Details */}
              <div>
                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                  Manufacturer Details
                </h2>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-3">
                  Captured from the vendor portal; some fields are auto-populated
                  based on login.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Manufacturer ID (7-char auto)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      readOnly
                      value={form.manufacturerId}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Manufacturer Name
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.manufacturerName}
                      onChange={(e) =>
                        handleChange("manufacturerName", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Material Technical Specs */}
              <div>
                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                  Material Technical Specification
                </h2>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-3">
                  Fields aligned with drawing and IRS/BIS material standards.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Fitting Type
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.fittingType}
                      onChange={(e) =>
                        handleChange("fittingType", e.target.value)
                      }
                      required
                    >
                      <option value="">Select</option>
                      {FITTING_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Drawing Number
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.drawingNumber}
                      onChange={(e) =>
                        handleChange("drawingNumber", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Material Specification
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.materialSpec}
                      onChange={(e) =>
                        handleChange("materialSpec", e.target.value)
                      }
                      placeholder="e.g., IRS:T-31, IS:2062 E250, etc."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Weight (kg)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.weightKg}
                      onChange={(e) =>
                        handleChange("weightKg", e.target.value)
                      }
                      placeholder="Numeric (approx.)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Board Gauge
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.boardGauge}
                      onChange={(e) =>
                        handleChange("boardGauge", e.target.value)
                      }
                      placeholder="e.g., BG / MG"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.manufacturingDate}
                      onChange={(e) =>
                        handleChange("manufacturingDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Expected Service Life (years)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.expectedLifeYears}
                      onChange={(e) =>
                        handleChange("expectedLifeYears", e.target.value)
                      }
                      placeholder="e.g., 10, 15"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.warrantyExpiry}
                      onChange={(e) =>
                        handleChange("warrantyExpiry", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* UDM Data */}
              <div>
                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                  UDM Purchase & Lot Details
                </h2>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-3">
                  Purchase Order and lot information linked with the UDM portal.
                  Material ID uses Depot (3), Lot (2) and Drawing (2) segments.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Purchase Order Number (UDM)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.purchaseOrderNumber}
                      onChange={(e) =>
                        handleChange("purchaseOrderNumber", e.target.value)
                      }
                      placeholder="As per UDM PO"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Batch Number (Lot Serial Source)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.batchNumber}
                      onChange={(e) =>
                        handleChange("batchNumber", e.target.value)
                      }
                      placeholder="Manufacturer batch ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Depot Code (3-char base)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.depotCode}
                      onChange={(e) =>
                        handleChange("depotCode", e.target.value)
                      }
                      placeholder="e.g., SBC01; first 3 used in ID"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      UDM Lot Number (optional)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.udmLotNumber}
                      onChange={(e) =>
                        handleChange("udmLotNumber", e.target.value)
                      }
                      placeholder="Lot as seen in UDM"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Inspection Officer (RITES/RDSO)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                      value={form.inspectionOfficer}
                      onChange={(e) =>
                        handleChange("inspectionOfficer", e.target.value)
                      }
                      placeholder="Officer name / ID"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Depot Entry Date (UDM)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.depotEntryDate}
                      readOnly
                    />
                    <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                      Auto-filled by depot via UDM → synced into this system.
                    </p>
                  </div>
                </div>
              </div>

              {/* TMS Lifecycle (read-only) */}
              <div>
                <h2 className="text-sm font-semibold text-[#4B3A7A] mb-1">
                  TMS Lifecycle & Track Mapping
                </h2>
                <p className="text-[10px] sm:text-[11px] text-gray-500 mb-3">
                  These fields are populated after installation by Track Staff /
                  TMS and EV robot. Manufacturers can view but not modify.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      TMS Track ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.tmsTrackId}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      GPS Installation Location
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.gpsLocation}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Installation Status
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.installationStatus}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Dispatch Date to Field
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.dispatchDate}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Failure Count
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.failureCount}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Last Maintenance Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border bg-gray-100 text-xs"
                      value={form.lastMaintenanceDate}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 rounded-xl bg-[#A259FF] text-white font-semibold text-xs sm:text-sm mt-2 sm:mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Material & Generate QR"}
              </button>
            </form>

            {/* RIGHT: QR PREVIEW CARD */}
            <div
              id="pdf-section"
              ref={pdfRef}
              className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 text-[11px] sm:text-xs flex flex-col items-center"
            >
              <h3 className="text-sm font-semibold text-[#A259FF] mb-3 text-center">
                Laser-Compatible QR (Material ID Only)
              </h3>

              {/* QR SETTINGS UI */}
              <div className="w-full mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      QR Color
                    </label>
                    <input
                      type="text"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      placeholder="#000000"
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    />
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="mt-1 w-full h-8 p-0 border rounded"
                      title="Pick QR color"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Background Color
                    </label>
                    <input
                      type="text"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      placeholder="#ffffff"
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    />
                    <input
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="mt-1 w-full h-8 p-0 border rounded"
                      title="Pick background color"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Module Size (px)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={qrModuleSize}
                      onChange={(e) =>
                        setQrModuleSize(Number(e.target.value))
                      }
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Margin (modules)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={qrMargin}
                      onChange={(e) => setQrMargin(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      Error Correction
                    </label>
                    <select
                      value={qrEcc}
                      onChange={(e) =>
                        setQrEcc(e.target.value as ErrorCorrectionLevel)
                      }
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    >
                      <option value="L">L (Low)</option>
                      <option value="M">M (Medium)</option>
                      <option value="Q">Q (Quartile)</option>
                      <option value="H">H (High)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px]">
                      QR Version
                    </label>
                    <select
                      value={qrVersion}
                      onChange={(e) =>
                        setQrVersion(
                          toTypeNumber(Number(e.target.value) || 0)
                        )
                      }
                      className="w-full px-2 py-1 rounded-xl border text-xs"
                    >
                      <option value="1">1 (Smallest)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="0">Auto</option>
                    </select>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                      Version 1 is enough for 7-character Material ID.
                    </p>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={regenerateQrFromPayload}
                      className="w-full py-2 rounded-xl bg-[#4B3A7A] text-white text-xs"
                      type="button"
                    >
                      Regenerate QR
                    </button>
                  </div>
                </div>
              </div>

              {/* QR PREVIEW / Downloads */}
              {qrSvg ? (
                <>
                  <div
                    className="bg-[#F7E8FF] p-3 rounded-xl mb-4 max-w-full overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />

                  <p className="text-[10px] sm:text-[11px] text-gray-500 mb-3 text-center">
                    QR encodes only the 7-character Material ID (no URL / no
                    JSON). On scan, the app should read this ID and fetch full
                    details from Firestore.
                  </p>

                  <button
                    onClick={() =>
                      qrSvg &&
                      downloadFile(
                        qrSvg,
                        `${form.materialId || "material"}_qr.svg`,
                        "image/svg+xml"
                      )
                    }
                    className="w-full py-2 rounded-xl bg-[#A259FF] text-white text-xs mb-2"
                  >
                    Download SVG
                  </button>

                  <button
                    onClick={async () => {
                      if (!qrSvg) return;
                      try {
                        const dataUrl = await svgToRasterDataUrl(
                          qrSvg,
                          "png",
                          6
                        );
                        const blob = await dataUrlToBlob(dataUrl);
                        downloadFile(
                          blob,
                          `${form.materialId || "material"}_qr.png`
                        );
                      } catch (err) {
                        console.error("PNG download error:", err);
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-[#10A37F] text-white text-xs mb-2"
                  >
                    Download PNG (high-res)
                  </button>

                  <button
                    onClick={() =>
                      qrSvg &&
                      downloadPdfFromSvg(
                        qrSvg,
                        `${form.materialId || "material"}_qr_only.pdf`
                      )
                    }
                    className="w-full py-2 rounded-xl bg-[#6B46C1] text-white text-xs mb-2"
                  >
                    Download PDF (QR only)
                  </button>

                  <button
                    onClick={downloadPdf}
                    className="w-full py-2 rounded-xl bg-[#4B3A7A] text-white text-xs mb-2"
                  >
                    Download PDF (QR + Details)
                  </button>

                  <button
                    onClick={() =>
                      qrText &&
                      downloadFile(
                        qrText,
                        `${form.materialId || "material"}_materialId.txt`,
                        "text/plain"
                      )
                    }
                    className="w-full py-2 rounded-xl border border-[#A259FF] text-[#A259FF] text-xs"
                  >
                    Download Material ID (text)
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-[10px] sm:text-[11px] text-center">
                  After saving the material, a laser-compatible QR will appear
                  here. The QR contains only the 7-character Material ID, which
                  your mobile app can scan to fetch full component details.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
