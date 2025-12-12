"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import MainHeader from "@/components/Header";
import DepotSidebar from "@/components/DepotSidebar";

type MaterialDoc = {
  materialId?: string;
  fittingType?: string;
  drawingNumber?: string;
  materialSpec?: string;
  weightKg?: string;
  boardGauge?: string;
  manufacturingDate?: string;
  expectedLifeYears?: string;
  purchaseOrderNumber?: string;
  batchNumber?: string;
  depotCode?: string;
  udmLotNumber?: string;

  depotEntryDate?: string;
  tmsTrackId?: string;
  installationStatus?: string;
  gpsLocation?: string;
  jioTagPhotoData?: string;

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

  requestStatus?: string;

  /** AI Verification Fields */
  aiVerified?: boolean;
  aiVerificationStatus?: string;
};

export default function DepotMaterialPage() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Read ?id from URL (client-side)
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
  }, []);

  async function loadMaterial(materialId: string) {
    try {
      const snap = await getDoc(doc(db, "materials", materialId));

      if (!snap.exists()) {
        alert("Material not found");
        router.push("/depot");
        return;
      }

      setMaterial(snap.data() as MaterialDoc);
    } catch (err) {
      console.error(err);
      alert("Unable to load material details.");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!id) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "materials", id), {
        requestStatus: "approved",
        officerApprovalDate: new Date().toISOString(),
      });
      alert("Request Approved!");
      router.push("/depot");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function reject() {
    if (!id) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "materials", id), {
        requestStatus: "rejected",
        officerApprovalDate: new Date().toISOString(),
      });
      alert("Request Rejected.");
      router.push("/depot");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* -------------------- LOADING UI -------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF] px-4">
        <div className="p-5 bg-white rounded-2xl shadow flex gap-3 items-center">
          <div className="h-7 w-7 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-700">Loading material…</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
        <div className="p-5 bg-white rounded-2xl shadow text-gray-700">
          Material not found.
        </div>
      </div>
    );
  }

  const m = material;

  /* -------------------- MAIN PAGE -------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px] flex-col lg:flex-row">
        <DepotSidebar />

        <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto space-y-10">

            {/* ---------- HEADER ---------- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-[#4B3A7A]">
                  Material Details
                </h1>
                <p className="text-sm text-gray-600">
                  Complete lifecycle, installation, and AI verification details.
                </p>
              </div>

              <div className="px-4 py-2 bg-white shadow rounded-xl border text-[#A259FF] text-sm font-semibold">
                ID: {m.materialId}
              </div>
            </div>

            {/* ---------- DETAILS CARD ---------- */}
            <div className="bg-white shadow-xl rounded-3xl p-6 border space-y-10">

              {/* --- Manufacturer Section --- */}
              <Section title="Manufacturer & Technical Details">
                <Grid>
                  <Info label="Fitting Type" value={m.fittingType} />
                  <Info label="Drawing Number" value={m.drawingNumber} />
                  <Info label="Material Spec" value={m.materialSpec} />
                  <Info label="Weight (kg)" value={m.weightKg} />
                  <Info label="Board Gauge" value={m.boardGauge} />
                  <Info label="Manufacturing Date" value={m.manufacturingDate} />
                  <Info label="Expected Life" value={m.expectedLifeYears} />
                  <Info label="Purchase Order" value={m.purchaseOrderNumber} />
                  <Info label="Batch No." value={m.batchNumber} />
                  <Info label="Depot Code" value={m.depotCode} />
                  <Info label="UDM Lot No." value={m.udmLotNumber} />
                </Grid>
              </Section>

              {/* --- Installation Section --- */}
              <Section title="Installation Details (Track Staff)">
                <Grid>
                  <Info label="Depot Entry Date" value={m.depotEntryDate} />
                  <Info label="TMS Track ID" value={m.tmsTrackId} />
                  <Info label="Installation Status" value={m.installationStatus} />
                  <Info label="GPS Location" value={m.gpsLocation} />
                </Grid>

                {m.jioTagPhotoData && (
                  <div className="mt-4 space-y-2">
                    <Photo label="Installation Photo" src={m.jioTagPhotoData} />

                    {/* --- AI Verification Badge --- */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E8FF] border border-[#D3B4FF]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          m.aiVerified ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      ></span>

                      <span className="text-xs text-[#4B3A7A]">
                        {m.aiVerified
                          ? `Verified by AI: ${m.aiVerificationStatus}`
                          : "Not yet verified by AI model"}
                      </span>
                    </div>
                  </div>
                )}
              </Section>

              {/* --- Fault Details --- */}
              <Section title="Fault & Detection Details">
                <Grid>
                  <Info label="Fault Type" value={m.faultType || "—"} />
                  <Info label="Severity" value={m.faultSeverity || "—"} />
                  <Info label="Detected At" value={m.faultDetectedAt || "—"} />
                  <Info label="Detected By" value={m.faultSource || "—"} />

                  {/* AI Verification Summary */}
                  <Info
                    label="AI Verification"
                    value={
                      m.aiVerified
                        ? m.aiVerificationStatus || "Verified - no issues"
                        : "Not verified"
                    }
                  />
                </Grid>

                <TextBlock label="Maintenance Staff Notes" value={m.maintenanceNotes} />
              </Section>

              {/* --- Engineer Verification --- */}
              <Section title="Engineer Verification Summary">
                <Grid>
                  <Info label="Last Maintenance" value={m.lastMaintenanceDate} />
                  <Info label="Engineer GPS" value={m.engineerGpsLocation} />
                  <Info label="Fault Status" value={m.faultStatus} />
                </Grid>

                <TextBlock label="Engineer Remarks" value={m.engineerRemarks} />
                <TextBlock label="Root Cause" value={m.engineerRootCause} />
                <TextBlock
                  label="Preventive Measures"
                  value={m.engineerPreventiveAction}
                />

                {m.engineerPhotoData && (
                  <Photo label="Engineer Visit Photo" src={m.engineerPhotoData} />
                )}
              </Section>

              {/* --- Buttons --- */}
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                {m.requestStatus === "pending" ? (
                  <>
                    <button
                      onClick={reject}
                      disabled={saving}
                      className="px-6 py-2 bg-red-500 text-white rounded-xl shadow hover:bg-red-600 disabled:opacity-60"
                    >
                      Reject
                    </button>

                    <button
                      onClick={approve}
                      disabled={saving}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-[#A259FF]">
                    Request Status: {m.requestStatus}
                  </p>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#4B3A7A]">{title}</h2>
      {children}
      <div className="border-t border-dashed border-purple-200 pt-4" />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-700 mb-1">{label}</p>
      <textarea
        readOnly
        className="w-full bg-gray-50 border px-3 py-2 rounded-xl text-sm min-h-[80px]"
        value={value || "—"}
      />
    </div>
  );
}

function Photo({ label, src }: { label: string; src: string }) {
  return (
    <div>
      <p className="text-xs text-gray-700 mb-1">{label}</p>
      <img
        src={src}
        alt={label}
        className="w-full max-w-xs h-52 rounded-xl border object-cover shadow"
      />
    </div>
  );
}
