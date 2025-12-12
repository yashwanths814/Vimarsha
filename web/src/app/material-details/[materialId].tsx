"use client";

import { useState, useEffect, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import generateMaterialPdf from "../material/materialReportPdf";

// Type for Material
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

export default function MaterialDetailsPage() {
  const router = useRouter();
  const params = useParams();

  // Route can be /material/[materialId] or /.../[id] – support both
  const materialIdParam = params?.materialId ?? params?.id;
  const materialId = Array.isArray(materialIdParam)
    ? materialIdParam[0]
    : (materialIdParam as string | undefined);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchMaterial() {
      if (!materialId) {
        setError("Missing material ID in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const docRef = doc(db, "materials", materialId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMaterial(docSnap.data() as Material);
        } else {
          setError("Material not found.");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load material details.");
      } finally {
        setLoading(false);
      }
    }

    fetchMaterial();
  }, [materialId]);

  // ---------- LOADING / ERROR ----------
  if (loading)
    return (
      <PageLayout>
        <div className="text-center text-sm text-gray-700">
          Loading material details…
        </div>
      </PageLayout>
    );

  if (error || !material)
    return (
      <PageLayout>
        <div className="text-center text-sm text-red-500">
          {error || "Material not found."}
        </div>
      </PageLayout>
    );

  // ---------- PDF DOWNLOAD ----------
  async function handleDownload() {
    if (!material) return;
    try {
      setDownloading(true);
      await generateMaterialPdf(material);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <PageLayout>
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-2">
            Material Details
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Material ID:{" "}
              <span className="font-mono font-bold">
                {material.materialId}
              </span>
            </p>

            <span
              className={`inline-flex w-fit px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
                material.installationStatus === "Installed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {material.installationStatus || "Status not set"}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT SIDE */}
          <Section title="Manufacturer Details">
            <Detail label="Manufacturer ID" value={material.manufacturerId} />
            <Detail
              label="Manufacturer Name"
              value={material.manufacturerName}
            />
          </Section>

          <Section title="Technical Specifications">
            <Detail label="Fitting Type" value={material.fittingType} />
            <Detail label="Drawing Number" value={material.drawingNumber} />
            <Detail label="Material Spec" value={material.materialSpec} />
            <Detail label="Weight (kg)" value={material.weightKg} />
            <Detail label="Board Gauge" value={material.boardGauge} />
            <Detail
              label="Manufacturing Date"
              value={formatDate(material.manufacturingDate)}
            />
            <Detail
              label="Expected Life"
              value={`${material.expectedLifeYears} yrs`}
            />
          </Section>

          {/* RIGHT SIDE */}
          <Section title="UDM & Purchase Details">
            <Detail
              label="Purchase Order"
              value={material.purchaseOrderNumber}
            />
            <Detail label="Batch Number" value={material.batchNumber} />
            <Detail label="Depot Code" value={material.depotCode} />
            <Detail
              label="Depot Entry Date"
              value={formatDate(material.depotEntryDate)}
            />
            <Detail label="UDM Lot Number" value={material.udmLotNumber} />
            <Detail
              label="Inspection Officer"
              value={material.inspectionOfficer}
            />
          </Section>

          <Section title="TMS & Lifecycle">
            <Detail label="TMS Track ID" value={material.tmsTrackId} />
            <Detail label="GPS Location" value={material.gpsLocation} />
            <Detail
              label="Dispatch Date"
              value={formatDate(material.dispatchDate)}
            />
            <Detail
              label="Warranty Expiry"
              value={formatDate(material.warrantyExpiry)}
            />
            <Detail label="Failure Count" value={material.failureCount} />
            <Detail
              label="Last Maintenance Date"
              value={formatDate(material.lastMaintenanceDate)}
            />
          </Section>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm shadow hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? "Generating PDF…" : "Download Report (PDF)"}
          </button>

          <button
            onClick={() => router.push("/manufacturer/add-material")}
            className="px-6 py-2 bg-[#A259FF] text-white rounded-xl font-semibold text-sm shadow hover:bg-[#8F3FEA] transition"
          >
            Add New Material
          </button>

          <button
            onClick={() => router.push("/manufacturer/dashboard")}
            className="px-6 py-2 border border-[#A259FF] text-[#A259FF] rounded-xl font-semibold text-sm hover:bg-[#F7E8FF] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/* Layout Wrapper – responsive sidebar */
function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />
      <div className="flex flex-col lg:flex-row pt-[90px]">
        <div className="lg:w-64 lg:flex-shrink-0">
          <ManufacturerSidebar />
        </div>
        <main className="w-full lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/* Reusable Section UI */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base sm:text-lg font-semibold text-[#4B3A7A] mb-3 border-b pb-2">
        {title}
      </h2>
      <div className="space-y-1 sm:space-y-2">{children}</div>
    </section>
  );
}

/* Reusable field */
function Detail({ label, value }: { label: string; value?: string }) {
  const display =
    value === undefined || value === null || value === "" ? "Not set" : value;
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      <span className="text-xs sm:text-sm text-gray-900 font-mono text-right break-words max-w-[60%]">
        {display}
      </span>
    </div>
  );
}

/* Date formatter */
function formatDate(dateString: string) {
  if (!dateString) return "Not set";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}
