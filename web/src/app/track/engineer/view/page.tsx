"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

export default function ViewMaterialPage() {
  const router = useRouter();

  // ID from query (?id=XXXX) – set on client
  const [id, setId] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get id from URL on client and load material
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const materialId = params.get("id");

    if (!materialId) {
      setLoading(false);
      return;
    }

    setId(materialId);
    loadMaterial(materialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------
  // LOAD MATERIAL FROM FIRESTORE
  // ---------------------------------------
  async function loadMaterial(materialId: string) {
    try {
      setLoading(true);
      const snap = await getDoc(doc(db, "materials", materialId));

      if (!snap.exists()) {
        alert("Material not found.");
        router.push("/track/materials");
        return;
      }

      setData(snap.data());
    } catch (err) {
      console.error(err);
      alert("Failed to load material.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="flex items-center gap-3 bg-white/90 shadow-md px-4 py-2 rounded-xl">
          <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" />
          <p className="text-gray-700 text-sm">Loading material details...</p>
        </div>
      </div>
    );
  }

  if (!id || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="bg-white/90 shadow-md px-5 py-4 rounded-2xl text-center">
          <p className="text-sm font-medium text-red-600">
            Material details not available.
          </p>
          <button
            onClick={() => router.push("/track/materials")}
            className="mt-3 text-xs text-[#A259FF] hover:underline"
          >
            ← Back to Materials
          </button>
        </div>
      </div>
    );
  }

  const m = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col">
      <MainHeader />

      <div className="flex pt-[90px] flex-col lg:flex-row">
        {/* Sidebar only on large screens */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 pb-14">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* ---------------- Header ---------------- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A]">
                  Material Details
                </h1>
                <p className="text-gray-600 mt-1 text-xs md:text-sm">
                  Complete lifecycle information for this track component.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-500 bg-white/90 shadow px-4 py-2 rounded-xl border w-full sm:w-auto text-center sm:text-right">
                  Material ID:{" "}
                  <b className="text-[#A259FF] break-all">{m.materialId}</b>
                </span>
                {m.installationStatus === "Installed" ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-[11px] rounded-full">
                    Installed
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[11px] rounded-full">
                    Not Installed
                  </span>
                )}
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 1 — Manufacturer Details */}
            {/* ---------------------------------------------------------------- */}
            <section className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow border border-purple-100">
              <h2 className="text-base md:text-lg font-bold text-[#4B3A7A] mb-4">
                1. Manufacturer Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Field label="Fitting Type" value={m.fittingType} />
                <Field label="Drawing Number" value={m.drawingNumber} />
                <Field label="Material Spec" value={m.materialSpec} />
                <Field label="Weight (kg)" value={m.weightKg} />
                <Field label="Board Gauge" value={m.boardGauge} />
                <Field label="Manufacturing Date" value={m.manufacturingDate} />
                <Field label="Expected Life (Years)" value={m.expectedLifeYears} />
                <Field label="Purchase Order Number" value={m.purchaseOrderNumber} />
                <Field label="Batch Number" value={m.batchNumber} />
                <Field label="Depot Code" value={m.depotCode} />
                <Field label="UDM Lot Number" value={m.udmLotNumber} />
                <Field label="Inspection Officer" value={m.inspectionOfficer} />
              </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 2 — Installation Details */}
            {/* ---------------------------------------------------------------- */}
            <section className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow border border-purple-100">
              <h2 className="text-base md:text-lg font-bold text-[#4B3A7A] mb-4">
                2. Installation Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Field label="Depot Entry Date" value={m.depotEntryDate} />
                <Field label="TMS Track ID" value={m.tmsTrackId} />
                <Field label="Installation GPS Location" value={m.gpsLocation} />
                <Field label="Installation Status" value={m.installationStatus} />
              </div>

              {m.jioTagPhotoData && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-gray-600 mb-1">
                    Jio Tag Photo
                  </p>
                  <img
                    src={m.jioTagPhotoData}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border"
                    alt="Jio Tag"
                  />
                </div>
              )}
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 3 — Fault Snapshot */}
            {/* ---------------------------------------------------------------- */}
            <section className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow border border-red-100">
              <h2 className="text-base md:text-lg font-bold text-red-600 mb-4">
                3. Fault Snapshot
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Field label="Fault Type" value={m.faultType || "—"} />
                <Field label="Fault Severity" value={m.faultSeverity || "—"} />
                <Field
                  label="Fault Detected At"
                  value={m.faultDetectedAt || "—"}
                />
                <Field label="Detection Source" value={m.faultSource || "—"} />
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-semibold text-gray-600">
                  Recent Failure History
                </label>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full p-3 bg-gray-50 border rounded-xl text-[11px]"
                  value={
                    Array.isArray(m.failureHistory)
                      ? "• " + m.failureHistory.join("\n• ")
                      : m.failureHistory || "No failure history."
                  }
                />
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-semibold text-gray-600">
                  Maintenance Staff Notes
                </label>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full p-3 bg-gray-50 border rounded-xl text-[11px]"
                  value={m.maintenanceNotes || "No notes provided."}
                />
              </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 4 — Engineer Verification */}
            {/* ---------------------------------------------------------------- */}
            <section className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow border border-green-100">
              <h2 className="text-base md:text-lg font-bold text-green-700 mb-4">
                4. Engineer Verification &amp; Maintenance Records
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Field label="Last Maintenance Date" value={m.lastMaintenanceDate} />
                <Field label="Engineer Fault Status" value={m.engineerFaultStatus} />
                <Field label="Engineer GPS Location" value={m.engineerGpsLocation} />
              </div>

              <FieldArea label="Engineer Remarks" value={m.engineerRemarks} />
              <FieldArea
                label="Root Cause Identified"
                value={m.engineerRootCause}
              />
              <FieldArea
                label="Preventive Measures"
                value={m.engineerPreventiveAction}
              />

              {m.engineerPhotoData && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-gray-600 mb-1">
                    Engineer Verification Photo
                  </p>
                  <img
                    src={m.engineerPhotoData}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border"
                    alt="Engineer Photo"
                  />
                </div>
              )}
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 5 — Escalation */}
            {/* ---------------------------------------------------------------- */}
            <section className="bg-white/90 p-4 sm:p-6 rounded-3xl shadow border border-yellow-200">
              <h2 className="text-base md:text-lg font-bold text-yellow-700 mb-4">
                5. Escalation to Railway Officer
              </h2>

              <Field
                label="Escalation Status"
                value={m.escalationStatus || "Not Raised"}
              />

              <FieldArea
                label="Officer Comment"
                value={m.officerComment || "No escalation raised."}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------- SMALL COMPONENTS ------------------------- */

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-gray-600">{label}</label>
      <input
        readOnly
        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-[11px]"
        value={value || "—"}
      />
    </div>
  );
}

function FieldArea({ label, value }: { label: string; value: any }) {
  return (
    <div className="mt-4">
      <label className="text-[11px] font-semibold text-gray-600">{label}</label>
      <textarea
        readOnly
        rows={3}
        className="w-full p-3 bg-gray-50 border rounded-xl text-[11px] resize-none"
        value={value || "—"}
      />
    </div>
  );
}
