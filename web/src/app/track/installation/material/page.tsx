"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

type AiVerificationDoc = {
  status?: string; // "verified" | "pending" | "running" | "error" | etc.
  component?: string | null;
  confidencePercent?: number | null;
  error?: string | null;
  aiVerifiedAt?: string | null; // ISO string for UI
  verified?: boolean | null;
  materialId?: string | null;
};

export default function InstallationMaterialPage() {
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [depotEntryDate, setDepotEntryDate] = useState("");
  const [tmsTrackId, setTmsTrackId] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [installationStatus, setInstallationStatus] = useState("Not Installed");

  const [jioTagPreview, setJioTagPreview] = useState("");
  const [jioTagPhotoData, setJioTagPhotoData] = useState<string>("");

  const [aiDoc, setAiDoc] = useState<AiVerificationDoc | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

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

  async function loadMaterial(materialId: string) {
    try {
      setLoading(true);
      const snap = await getDoc(doc(db, "materials", materialId));

      if (!snap.exists()) {
        alert("Material not found");
        router.push("/track/installation");
        return;
      }

      const d = snap.data();
      setData(d);

      setDepotEntryDate(d.depotEntryDate || "");
      setTmsTrackId(d.tmsTrackId || "");
      setGpsLocation(d.gpsLocation || "");
      setInstallationStatus(d.installationStatus || "Not Installed");

      if (d.jioTagPhotoData) {
        setJioTagPhotoData(d.jioTagPhotoData);
        setJioTagPreview(d.jioTagPhotoData);
      }

      const mid = d?.materialId || materialId;
      await loadAiVerification(mid);
    } catch (err) {
      console.error("LOAD MATERIAL ERROR:", err);
      alert("Failed to load material details.");
      router.push("/track/installation");
    } finally {
      setLoading(false);
    }
  }

  // ✅ YOUR REAL PATH: ai_varification/{materialId}
  async function loadAiVerification(materialId: string) {
    setAiLoading(true);

    try {
      const ref = doc(db, "ai_varification", materialId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        if (!alive.current) return;
        setAiDoc(null);
        return;
      }

      const d: any = snap.data();

      const ts =
        d?.aiVerifiedAt && typeof d.aiVerifiedAt?.toDate === "function"
          ? d.aiVerifiedAt.toDate().toISOString()
          : typeof d?.aiVerifiedAt === "string"
          ? d.aiVerifiedAt
          : null;

      if (!alive.current) return;

      setAiDoc({
        status: d.status ?? (d.verified ? "verified" : "unknown"),
        component: d.component ?? null,
        confidencePercent:
          typeof d.confidencePercent === "number" ? d.confidencePercent : null,
        error: d.error ?? null,
        aiVerifiedAt: ts,
        verified: typeof d.verified === "boolean" ? d.verified : null,
        materialId: d.materialId ?? materialId,
      });
    } catch (e) {
      console.error("LOAD AI STATUS ERROR:", e);
      if (!alive.current) return;
      setAiDoc(null);
    } finally {
      if (!alive.current) return;
      setAiLoading(false);
    }
  }

  function handleJioTagPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setJioTagPhotoData(base64);
      setJioTagPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude.toFixed(
          6
        )}, ${pos.coords.longitude.toFixed(6)}`;
        setGpsLocation(loc);
      },
      () => alert("GPS permission denied or unavailable")
    );
  }

  function openAiClassifierNewTab() {
    const mid = data?.materialId || id;
    if (!mid) {
      alert("Material ID missing.");
      return;
    }
    const url = `https://railclassification-7.onrender.com/verify?materialId=${encodeURIComponent(
      mid
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function saveUpdates() {
    if (!id) return;

    setSaving(true);

    try {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "materials", id), {
        depotEntryDate,
        tmsTrackId,
        gpsLocation,
        installationStatus,
        jioTagPhotoData: jioTagPhotoData || null,
      });

      setData((prev: any) => ({
        ...prev,
        depotEntryDate,
        tmsTrackId,
        gpsLocation,
        installationStatus,
        jioTagPhotoData,
      }));

      alert("Installation details updated successfully");
      router.push("/track/installation");
    } catch (err: any) {
      console.error("SAVE ERROR:", err);

      if (err?.code) alert(`Failed: ${err.code}`);
      else if (err?.message) alert(`Failed: ${err.message}`);
      else alert("Failed to save installation details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#A259FF] animate-pulse" />
          <p className="text-sm font-medium text-gray-700">
            Loading material details…
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="bg-white/90 shadow-md px-5 py-4 rounded-2xl text-center">
          <p className="text-sm font-medium text-red-600">
            Material details not available.
          </p>
          <button
            onClick={() => router.push("/track/installation")}
            className="mt-3 text-xs text-[#A259FF] hover:underline"
          >
            ← Back to Installation Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusLower = (aiDoc?.status || "").toLowerCase();
  const showVerified =
    statusLower === "verified" || aiDoc?.verified === true || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        <main
          className="
            w-full
            px-4 pb-10
            lg:ml-64 lg:w:[calc(100%-16rem)] lg:px-10
          "
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-4 lg:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-xs font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>
              <span className="text-[11px] text-gray-500">
                Installation Update
              </span>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Material Installation Update
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Review manufacturer details and update installation information
                  from the field.
                </p>
              </div>

              {data?.materialId && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur px-3 py-2 shadow-sm border border-purple-100">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    Material ID
                  </span>
                  <span className="text-xs font-semibold text-[#A259FF]">
                    {data.materialId}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-4 md:p-7 space-y-7 text-xs md:text-sm">
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A] flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E8FF] text-[11px] font-bold text-[#A259FF]">
                      1
                    </span>
                    Manufacturer Details
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    Read Only
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Material ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.materialId}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Fitting Type
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.fittingType}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Drawing Number
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.drawingNumber}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Material Spec
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.materialSpec}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Weight (kg)
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.weightKg}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Board Gauge
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.boardGauge}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      readOnly
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      value={data.manufacturingDate}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Expected Service Life (years)
                    </label>
                    <input
                      readOnly
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      value={data.expectedLifeYears}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Purchase Order Number
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.purchaseOrderNumber}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Batch Number
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.batchNumber}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      Depot Code
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.depotCode}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600">
                      UDM Lot Number
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
                      readOnly
                      value={data.udmLotNumber}
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-dashed border-purple-100" />

              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A] flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E4D4FF] text-[11px] font-bold text-[#4B3A7A]">
                      2
                    </span>
                    Installation Details
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide text-[#A259FF] bg-[#F7E8FF] border border-[#E4D4FF] rounded-full px-3 py-1">
                    Field Editable
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      Depot Entry Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs"
                      value={depotEntryDate}
                      onChange={(e) => setDepotEntryDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-700">
                      TMS Track ID
                    </label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs"
                      value={tmsTrackId}
                      onChange={(e) => setTmsTrackId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-700">
                    GPS Installation Location
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-grow px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs"
                      placeholder="Latitude, Longitude"
                      value={gpsLocation}
                      onChange={(e) => setGpsLocation(e.target.value)}
                    />
                    <button
                      onClick={detectLocation}
                      type="button"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#A259FF] text-white text-xs font-medium shadow hover:bg-[#8E3FE8] transition-colors"
                    >
                      Detect GPS
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-700">
                    Installation Status
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs"
                    value={installationStatus}
                    onChange={(e) => setInstallationStatus(e.target.value)}
                  >
                    <option>Not Installed</option>
                    <option>Installed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-gray-700">
                    Jio Tag Photo
                  </label>

                  <div className="flex flex-col md:flex-row gap-4 md:items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleJioTagPhoto}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#A259FF] file:text-white file:text-[11px] hover:file:bg-[#8E3FE8] cursor-pointer"
                      />

                      <div className="mt-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <button
                          type="button"
                          onClick={openAiClassifierNewTab}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#3A7AFF] text-white text-xs font-semibold shadow hover:opacity-95 transition"
                        >
                          Open AI Classifier
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const mid = data?.materialId || id;
                            if (!mid) return;
                            loadAiVerification(mid);
                          }}
                          disabled={!(data?.materialId || id) || aiLoading}
                          className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-medium shadow hover:bg-gray-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {aiLoading ? "Refreshing…" : "Refresh Status"}
                        </button>

                        {!aiDoc && !aiLoading && (
                          <span className="text-[11px] px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                            AI Status: Not Available
                          </span>
                        )}

                        {aiDoc && showVerified && (
                          <span className="text-[11px] px-3 py-1 rounded-full bg-green-100 text-green-800">
                            AI Status: VERIFIED{" "}
                            {aiDoc.component
                              ? `• ${String(aiDoc.component).toUpperCase()}`
                              : ""}{" "}
                            {typeof aiDoc.confidencePercent === "number"
                              ? `(${aiDoc.confidencePercent.toFixed(2)}%)`
                              : ""}
                          </span>
                        )}

                        {aiDoc && !showVerified && statusLower && (
                          <span className="text-[11px] px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            AI Status: {statusLower.toUpperCase()}
                          </span>
                        )}

                        {aiDoc && statusLower === "error" && (
                          <span className="text-[11px] px-3 py-1 rounded-full bg-red-100 text-red-800">
                            AI Status: ERROR{aiDoc.error ? ` • ${aiDoc.error}` : ""}
                          </span>
                        )}
                      </div>

                      {aiDoc?.aiVerifiedAt && (
                        <p className="text-[10px] text-gray-400">
                          Verified At:{" "}
                          <span className="font-medium text-gray-600">
                            {aiDoc.aiVerifiedAt}
                          </span>
                        </p>
                      )}
                    </div>

                    {jioTagPreview && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                          <img
                            src={jioTagPreview}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover"
                            alt="Jio Tag Preview"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">
                          Current Jio Tag Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <button
                  onClick={saveUpdates}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-2xl bg-[#A259FF] text-white font-semibold text-sm shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {saving && (
                    <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                  {saving
                    ? "Saving Installation Details…"
                    : "Save Installation Details"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
