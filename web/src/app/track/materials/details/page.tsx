"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

export default function InstallationMaterialPage() {
  const router = useRouter();

  // 🔹 ID from ?id=... in the URL (client-only)
  const [id, setId] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ⭐ editing toggle (read-only by default)
  const [editing, setEditing] = useState(false);

  // Installation-Editable Fields
  const [depotEntryDate, setDepotEntryDate] = useState("");
  const [tmsTrackId, setTmsTrackId] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [installationStatus, setInstallationStatus] = useState("Not Installed");

  // Jio Tag Photo
  const [jioTagPhoto, setJioTagPhoto] = useState<File | null>(null);
  const [jioTagPreview, setJioTagPreview] = useState("");

  // ------------------------------------
  // Get id from query & load material
  // ------------------------------------
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

  // -----------------------------
  // LOAD FIRESTORE MATERIAL DATA
  // -----------------------------
  async function loadMaterial(materialId: string) {
    try {
      const snap = await getDoc(doc(db, "materials", materialId));

      if (!snap.exists()) {
        alert("Material not found");
        router.push("/track/installation");
        return;
      }

      const d = snap.data();
      setData(d);

      // Prefill editable fields
      setDepotEntryDate(d.depotEntryDate || "");
      setTmsTrackId(d.tmsTrackId || "");
      setGpsLocation(d.gpsLocation || "");
      setInstallationStatus(d.installationStatus || "Not Installed");

      // Show existing Jio tag image if present
      if (d.jioTagPhotoUrl) {
        setJioTagPreview(d.jioTagPhotoUrl);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to load material details.");
      router.push("/track/installation");
    }
  }

  // -----------------------------
  // Handle Jio Tag Photo
  // -----------------------------
  function handleJioTagPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editing) return; // guard
    const file = e.target.files?.[0];
    if (file) {
      setJioTagPhoto(file);
      setJioTagPreview(URL.createObjectURL(file));
    }
  }

  // -----------------------------
  // GPS AUTO DETECT
  // -----------------------------
  function detectLocation() {
    if (!editing) return; // guard
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(
          6
        )}`;
        setGpsLocation(loc);
      },
      () => alert("GPS permission denied or unavailable")
    );
  }

  // -----------------------------
  // SAVE INSTALLATION UPDATES
  // -----------------------------
  async function saveUpdates() {
    if (!id) return;

    setSaving(true);

    try {
      // Upload Jio Tag Photo if changed
      let jioPhotoUrl = data?.jioTagPhotoUrl || "";

      if (jioTagPhoto) {
        const storageRef = ref(storage, `jio-tag-photos/${id}.jpg`);
        await uploadBytes(storageRef, jioTagPhoto);
        jioPhotoUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "materials", id), {
        depotEntryDate,
        tmsTrackId,
        gpsLocation,
        installationStatus,
        jioTagPhotoUrl: jioPhotoUrl,
      });

      alert("Installation details updated successfully");
      setEditing(false); // back to read-only
    } catch (err) {
      console.error(err);
      alert("Failed to save installation details.");
    } finally {
      setSaving(false);
    }
  }

  // footer button handler: either enter edit mode or save
  function handlePrimaryButton() {
    if (!editing) {
      setEditing(true);
    } else {
      saveUpdates();
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

  // If load failed or no id
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        {/* Sidebar – hide on mobile, show on large screens */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        {/* MAIN CONTENT */}
        <main
          className="
            w-full px-4 pb-10
            lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-10
          "
        >
          <div className="max-w-5xl mx-auto">
            {/* Mobile back row */}
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>

              {data?.materialId && (
                <span className="text-[10px] px-3 py-1 rounded-full bg-white/70 border border-purple-100 text-[#A259FF] font-semibold">
                  ID: {data.materialId}
                </span>
              )}
            </div>

            {/* Top Header Card */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="hidden lg:block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Track &gt; Installation &gt; Material
                </p>
                <h1 className="text-xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Material Installation Update
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Review manufacturer details and update installation information
                  from the field.
                </p>
              </div>

              {data?.materialId && (
                <div className="hidden sm:inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur px-4 py-2 shadow-sm border border-purple-100">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    Material ID
                  </span>
                  <span className="text-xs font-semibold text-[#A259FF]">
                    {data.materialId}
                  </span>
                </div>
              )}
            </div>

            {/* Main Card */}
            <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-5 md:p-7 space-y-7 text-xs md:text-sm">
              {/* SECTION 1: Manufacturer Details */}
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
                <p className="text-[11px] text-gray-500 mb-4">
                  These details are provided by the manufacturer and cannot be edited
                  from this screen.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <ReadOnlyField label="Material ID" value={data.materialId} />
                  <ReadOnlyField label="Fitting Type" value={data.fittingType} />

                  {/* Row 2 */}
                  <ReadOnlyField label="Drawing Number" value={data.drawingNumber} />
                  <ReadOnlyField label="Material Spec" value={data.materialSpec} />

                  {/* Row 3 */}
                  <ReadOnlyField label="Weight (kg)" value={data.weightKg} />
                  <ReadOnlyField label="Board Gauge" value={data.boardGauge} />

                  {/* Row 4 */}
                  <ReadOnlyField
                    label="Manufacturing Date"
                    value={data.manufacturingDate}
                    type="date"
                  />
                  <ReadOnlyField
                    label="Expected Service Life (years)"
                    value={data.expectedLifeYears}
                  />

                  {/* Row 5 */}
                  <ReadOnlyField
                    label="Purchase Order Number"
                    value={data.purchaseOrderNumber}
                  />
                  <ReadOnlyField label="Batch Number" value={data.batchNumber} />

                  {/* Row 6 */}
                  <ReadOnlyField label="Depot Code" value={data.depotCode} />
                  <ReadOnlyField label="UDM Lot Number" value={data.udmLotNumber} />
                </div>
              </section>

              <div className="border-t border-dashed border-purple-100" />

              {/* SECTION 2: Installation Details */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A] flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E4D4FF] text-[11px] font-bold text-[#4B3A7A]">
                      2
                    </span>
                    Installation Details
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide text-[#A259FF] bg-[#F7E8FF] border border-[#E4D4FF] rounded-full px-3 py-1">
                    {editing ? "Editing" : "Field Editable"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-4">
                  Update depot entry, track information and on-site installation
                  details. Ensure GPS and Jio Tag image match the installed location.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <EditableField
                    label="Depot Entry Date"
                    type="date"
                    value={depotEntryDate}
                    onChange={(e) => setDepotEntryDate(e.target.value)}
                    disabled={!editing}
                  />
                  <EditableField
                    label="TMS Track ID"
                    value={tmsTrackId}
                    onChange={(e) => setTmsTrackId(e.target.value)}
                    disabled={!editing}
                  />
                </div>

                {/* GPS DETECT */}
                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-700">
                    GPS Installation Location
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-grow px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs disabled:bg-gray-50"
                      placeholder="Latitude, Longitude"
                      value={gpsLocation}
                      onChange={(e) => setGpsLocation(e.target.value)}
                      disabled={!editing}
                    />
                    <button
                      onClick={detectLocation}
                      type="button"
                      disabled={!editing}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#A259FF] text-white text-xs font-medium shadow hover:bg-[#8E3FE8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Detect GPS
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Tip: Use the “Detect GPS” button when standing near the installed
                    material for accurate coordinates.
                  </p>
                </div>

                {/* Installation Status */}
                <div className="mb-4 space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-700">
                    Installation Status
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs disabled:bg-gray-50"
                    value={installationStatus}
                    onChange={(e) => setInstallationStatus(e.target.value)}
                    disabled={!editing}
                  >
                    <option>Not Installed</option>
                    <option>Installed</option>
                  </select>
                </div>

                {/* Jio Tag Photo */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-gray-700">
                    Jio Tag Photo
                  </label>
                  <div className="flex flex-col md:flex-row gap-4 md:items-start">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleJioTagPhoto}
                        disabled={!editing}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#A259FF] file:text-white file:text-[11px] hover:file:bg-[#8E3FE8] cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-[10px] text-gray-400">
                        Upload a clear photo of the installed Jio tag showing the
                        ID and surrounding track area.
                      </p>
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

              {/* Footer Button – Update or Save */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handlePrimaryButton}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-2xl bg-[#A259FF] text-white font-semibold text-sm shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {saving && editing && (
                    <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                  {!editing
                    ? "Update Installation Details"
                    : saving
                    ? "Saving Installation Details…"
                    : "Save Installation Details"}
                </button>

                {editing && !saving && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      // reset inputs from original data
                      setDepotEntryDate(data.depotEntryDate || "");
                      setTmsTrackId(data.tmsTrackId || "");
                      setGpsLocation(data.gpsLocation || "");
                      setInstallationStatus(
                        data.installationStatus || "Not Installed"
                      );
                      setJioTagPhoto(null);
                      if (data.jioTagPhotoUrl) setJioTagPreview(data.jioTagPhotoUrl);
                    }}
                    className="w-full text-center text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    Cancel changes and revert
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* Small helper components */

function ReadOnlyField({
  label,
  value,
  type,
}: {
  label: string;
  value: any;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-gray-600">{label}</label>
      <input
        type={type ?? "text"}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs"
        readOnly
        value={value ?? ""}
      />
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  disabled,
  type,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-gray-700">{label}</label>
      <input
        type={type ?? "text"}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 text-xs disabled:bg-gray-50"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
