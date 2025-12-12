"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import QRCode from "qrcode-generator";

type Material = {
  materialId: string;
  fittingType: string;
  drawingNumber: string;
  // ...other fields
};

function buildQrSvgForMaterialId(materialId: string): string {
  const qr = QRCode(1, "L"); // version 1 is enough for 7 chars
  qr.addData(materialId);
  qr.make();

  const count = qr.getModuleCount();
  const moduleSize = 6;
  const margin = 2;
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
      <rect width="100%" height="100%" fill="#ffffff"/>
      <g fill="#000000" shape-rendering="crispEdges">${rects}</g>
    </svg>
  `;
}

export default function GenerateQrPage() {
  const searchParams = useSearchParams();
  const materialIdParam = searchParams.get("materialId"); // 👈 from ViewMaterialsPage

  const [material, setMaterial] = useState<Material | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!materialIdParam) {
      setError("Missing materialId in URL.");
      return;
    }

    async function load(materialId: string) {
      setLoading(true);
      setError(null);

      try {
        // if your docId == materialId (recommended)
        const ref = doc(db, "materials", materialId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Material not found.");
          return;
        }

        const data = snap.data() as Material;
        setMaterial(data);

        if (!data.materialId) {
          setError("Material ID field missing in document.");
          return;
        }

        const svg = buildQrSvgForMaterialId(data.materialId);
        setQrSvg(svg);
      } catch (e) {
        console.error(e);
        setError("Failed to load QR data.");
      } finally {
        setLoading(false);
      }
    }

    load(materialIdParam);
  }, [materialIdParam]);

  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      {/* Layout: stacked on mobile, sidebar + content on md+ */}
      <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:flex-shrink-0">
          <ManufacturerSidebar />
        </div>

        {/* Main content */}
        <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-2">
            QR for Material {material?.materialId || materialIdParam || ""}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-xl">
            QR encodes only the 7-character Material ID. Your mobile app should
            scan it and fetch full data from Firestore.
          </p>

          <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 flex flex-col items-center text-xs">
            {loading && (
              <p className="text-gray-500 py-4">Loading QR…</p>
            )}

            {!loading && error && (
              <p className="text-red-500 text-center text-xs sm:text-sm py-4">
                {error}
              </p>
            )}

            {!loading && !error && qrSvg && (
              <>
                <div
                  className="bg-[#F7E8FF] p-4 rounded-xl mb-3"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <p className="text-gray-600 text-xs sm:text-sm">
                  Payload:{" "}
                  <span className="font-mono">
                    {material?.materialId || materialIdParam}
                  </span>
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
