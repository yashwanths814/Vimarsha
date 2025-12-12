"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import type { ReactNode } from "react";

type MaterialPublic = {
  manufacturerName: string;
  manufacturerId: string;
  fittingType: string;
  drawingNumber: string;
  batchNumber: string;
  purchaseOrderNumber: string;
  manufacturingDate: string;
};

export default function PublicMaterialPage() {
  const params = useParams();
  const id = params?.id as string;

  const [material, setMaterial] = useState<MaterialPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const ref = doc(db, "materials", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setError("Material not found.");
        } else {
          const data = snap.data() as any;
          setMaterial({
            manufacturerName: data.manufacturerName || "",
            manufacturerId: data.manufacturerId || "",
            fittingType: data.fittingType || "",
            drawingNumber: data.drawingNumber || "",
            batchNumber: data.batchNumber || "",
            purchaseOrderNumber: data.purchaseOrderNumber || "",
            manufacturingDate: data.manufacturingDate || "",
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load material details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow px-5 py-3 text-sm text-black">
          Loading material…
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl px-6 sm:px-8 py-5 sm:py-6 text-sm">
          <p className="text-red-600 mb-2 font-semibold">Error</p>
          <p className="text-black">{error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-6 sm:p-8 text-sm text-black">
        <h1 className="text-xl sm:text-2xl font-extrabold text-black mb-3 sm:mb-4">
          Track Fitting – Material Details
        </h1>

        <p className="text-[11px] sm:text-xs text-black/60 mb-5 sm:mb-6">
          This page was opened from a QR code. All data is fetched securely from
          the track fittings system.
        </p>

        <div className="space-y-4 sm:space-y-5">
          <Section title="Manufacturer">
            <Field label="Manufacturer Name" value={material.manufacturerName} />
            <Field label="Manufacturer ID" value={material.manufacturerId} />
          </Section>

          <Section title="Technical">
            <Field label="Fitting Type" value={material.fittingType} />
            <Field label="Drawing Number" value={material.drawingNumber} />
            <Field
              label="Manufacturing Date"
              value={material.manufacturingDate}
            />
          </Section>

          <Section title="Purchase / UDM">
            <Field label="Batch Number" value={material.batchNumber} />
            <Field
              label="Purchase Order Number"
              value={material.purchaseOrderNumber}
            />
          </Section>
        </div>

        <p className="mt-6 text-[11px] text-black/40">
          For internal use by Railway officers and depot staff.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border rounded-2xl p-4 border-gray-300">
      <h2 className="text-xs font-semibold text-black mb-3 uppercase tracking-wide">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-xs">
      <span className="text-black/60 sm:w-1/3">{label}</span>
      <span className="text-black font-medium sm:w-2/3 break-words">
        {value || "-"}
      </span>
    </div>
  );
}
