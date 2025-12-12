"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

type FailureEntry = {
  date: string;
  note: string;
};

export default function EngineerFaultDetailsPage() {
  const router = useRouter();

  // 🔹 Fault ID from ?id=..., read client-side only
  const [faultId, setFaultId] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable (Engineer)
  const [status, setStatus] = useState<"Open" | "InProgress" | "Closed" | string>("Open");
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("");
  const [engineerRemarks, setEngineerRemarks] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [preventiveMeasures, setPreventiveMeasures] = useState("");
  const [closurePhotoData, setClosurePhotoData] = useState<string>("");
  const [closurePhotoPreview, setClosurePhotoPreview] = useState<string>("");

  // -------------------------------
  // Read ?id= from URL (client only)
  // -------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id");

    if (!idFromUrl) {
      setLoading(false);
      return;
    }

    setFaultId(idFromUrl);
  }, []);

  // -------------------------------
  // Load fault once we know faultId
  // -------------------------------
  useEffect(() => {
    if (!faultId) return;
    loadFault(faultId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faultId]);

  async function loadFault(id: string) {
    try {
      setLoading(true);
      const snap = await getDoc(doc(db, "faults", id));
      if (!snap.exists()) {
        alert("Fault not found");
        router.push("/engineer/faults");
        return;
      }

      const d = snap.data();
      setData(d);

      setStatus(d.status || "Open");
      setLastMaintenanceDate(d.lastMaintenanceDate || "");
      setEngineerRemarks(d.engineerRemarks || "");
      setRootCause(d.rootCause || "");
      setPreventiveMeasures(d.preventiveMeasures || "");

      if (d.closurePhotoData) {
        setClosurePhotoData(d.closurePhotoData);
        setClosurePhotoPreview(d.closurePhotoData);
      }
    } catch (err) {
      console.error("LOAD FAULT ERROR:", err);
      alert("Failed to load fault details.");
      router.push("/engineer/faults");
    } finally {
      setLoading(false);
    }
  }

  function handleClosurePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setClosurePhotoData(base64);
      setClosurePhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  async function saveUpdates() {
    if (!faultId) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, "faults", faultId), {
        status,
        lastMaintenanceDate,
        engineerRemarks,
        rootCause,
        preventiveMeasures,
        closurePhotoData: closurePhotoData || null,
      });

      alert("Fault updated successfully");
      router.push("/engineer/faults");
    } catch (err: any) {
      console.error("SAVE FAULT ERROR:", err);
      alert(err?.message || "Failed to save fault details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#A259FF] animate-pulse" />
          <p className="text-sm font-medium text-gray-700">
            Loading fault details…
          </p>
        </div>
      </div>
    );
  }

  if (!faultId || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg px-6 py-4">
          <p className="text-sm text-red-600 font-medium text-center">
            Fault details not available.
          </p>
          <button
            onClick={() => router.push("/engineer/faults")}
            className="mt-3 w-full text-xs text-[#A259FF] hover:underline"
          >
            ← Back to all faults
          </button>
        </div>
      </div>
    );
  }

  const failureHistory: FailureEntry[] = data?.failureHistory || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col">
      <MainHeader />

      <div className="flex pt-[90px] flex-col lg:flex-row">
        {/* Sidebar: only show on large screens */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 pb-10">
          <div className="max-w-5xl mx-auto">
            {/* Top header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Fault Verification &amp; Closure
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Review fault details, verify repairs on-site, and close with full remarks.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                {data?.materialId && (
                  <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur px-4 py-2 shadow-sm border border-purple-100 w-full sm:w-auto justify-between sm:justify-start">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                      Material ID
                    </span>
                    <span className="text-xs font-semibold text-[#A259FF]">
                      {data.materialId}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => router.push("/engineer/faults")}
                  className="text-[11px] text-gray-500 hover:text-[#A259FF]"
                >
                  ← Back to all faults
                </button>
              </div>
            </div>

            {/* Main card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-4 sm:p-5 md:p-7 space-y-7 text-xs md:text-sm">
              {/* Section 1: Fault Snapshot */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A] flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E8FF] text-[11px] font-bold text-[#A259FF]">
                      1
                    </span>
                    Fault Snapshot
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-gray-500 w-fit">
                    Auto / Read Only
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-4">
                  Auto-captured details from hardware or Druva vehicle plus maintenance staff notes.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Fault ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
                      readOnly
                      value={faultId || ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Component Type
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
                      readOnly
                      value={data?.componentType || "-"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Detected At
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
                      readOnly
                      value={data?.detectedAt || "-"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Fault GPS
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
                      readOnly
                      value={data?.faultGps || "-"}
                    />
                  </div>
                </div>

                {/* Staff Notes & history */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Maintenance Staff Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs min-h-[70px]"
                      readOnly
                      value={data?.staffNotes || ""}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Recent Failure History
                    </label>
                    <div className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 max-h-36 overflow-y-auto text-[11px] text-gray-700">
                      {failureHistory.length === 0 ? (
                        <p className="text-gray-400">No previous failures recorded.</p>
                      ) : (
                        <ul className="space-y-1.5 list-disc list-inside">
                          {failureHistory.map((f, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{f.date}</span> – {f.note}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-purple-100" />

              {/* Section 2: Engineer Verification & Closure */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A] flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E4D4FF] text-[11px] font-bold text-[#4B3A7A]">
                      2
                    </span>
                    Engineer Verification &amp; Closure
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide text-[#A259FF] bg-[#F7E8FF] border border-[#E4D4FF] rounded-full px-3 py-1 w-fit">
                    Editable by Engineer
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-4">
                  Confirm repairs, update last maintenance date, attach GPS-verified closure photo,
                  and record root cause &amp; preventive measures.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      Fault Status
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 bg-white"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      Last Maintenance Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                      value={lastMaintenanceDate}
                      onChange={(e) => setLastMaintenanceDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Engineer remarks, root cause, prevention */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      Engineer Remarks
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                      placeholder="Verification notes, observations at site…"
                      value={engineerRemarks}
                      onChange={(e) => setEngineerRemarks(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      Root Cause
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                      placeholder="E.g., excessive vibration, worn pad, improper fastening…"
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-700">
                    Preventive Measures
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                    placeholder="What should be done to avoid recurrence? e.g., tighten inspection frequency, change component type, drainage improvement…"
                    value={preventiveMeasures}
                    onChange={(e) => setPreventiveMeasures(e.target.value)}
                  />
                </div>

                {/* Closure Photo */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-gray-700">
                    Closure Photo (After Repair)
                  </label>
                  <div className="flex flex-col md:flex-row gap-4 md:items-start">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleClosurePhoto}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#A259FF] file:text-white file:text-[11px] hover:file:bg-[#8E3FE8] cursor-pointer"
                      />
                      <p className="mt-1 text-[10px] text-gray-400">
                        Upload a clear photo of the repaired component, preferably with GPS-verified
                        metadata.
                      </p>
                    </div>

                    {closurePhotoPreview && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                          <img
                            src={closurePhotoPreview}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover"
                            alt="Closure Photo Preview"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">
                          Current closure photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Save button */}
              <div className="pt-2">
                <button
                  onClick={saveUpdates}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-2xl bg-[#A259FF] text-white font-semibold text-sm shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {saving && (
                    <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                  {saving ? "Saving Fault Updates…" : "Save &amp; Update Fault"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
