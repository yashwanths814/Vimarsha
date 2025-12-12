"use client";

import { useEffect, useState } from "react";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AppLoader from "@/components/AppLoader";

type Role = "installation" | "maintenance" | "engineer";

type Material = {
  // Manufacturer fields
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

  // Extra fields for maintenance staff
  druvaStatus?: string;
  druvaDamageNotes?: string;
  componentStatus?: string;
  failureType?: string;
  failureLocation?: string;
  failureNotes?: string;

  // Extra fields for engineer
  engineerVerified?: boolean;
  engineerNotes?: string;
  engineerPhotoUrl?: string;
};

export default function TrackMaterialPage() {
  // 🔹 ID from ?id=... (client side only)
  const [id, setId] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("installation");
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Local editable copy
  const [form, setForm] = useState<Partial<Material>>({});

  // QR URL (hydration-safe)
  const [qrUrl, setQrUrl] = useState<string>("");

  // --------------------------
  // Read ?id= from URL (client)
  // --------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const materialId = params.get("id");

    if (!materialId) {
      setMsg("Material ID not provided in URL.");
      setMaterial(null);
      setLoading(false);
      return;
    }

    setId(materialId);
  }, []);

  // --------------------------
  // Load Firestore once id is known
  // --------------------------
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "materials", id!));
        if (!snap.exists()) {
          setMsg("Material not found.");
          setMaterial(null);
        } else {
          const data = snap.data() as Material;
          setMaterial(data);
          setForm(data);
        }
      } catch (err) {
        console.error(err);
        setMsg("Failed to load material.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Build QR URL only on client to avoid hydration mismatch
  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    setQrUrl(`${window.location.origin}/material/${id}`);
  }, [id]);

  function updateField<K extends keyof Material>(field: K, value: Material[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // GPS helper
  function fillGps(field: keyof Material) {
    if (!navigator.geolocation) {
      alert("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(
          6
        )}, ${pos.coords.longitude.toFixed(6)}`;
        updateField(field, coords as any);
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch GPS location.");
      }
    );
  }

  async function handleSave() {
    if (!id || !material) return;

    setSaving(true);
    setMsg(null);

    try {
      const ref = doc(db, "materials", id!);
      const payload: Partial<Material> = {};

      if (role === "installation") {
        payload.depotEntryDate = (form.depotEntryDate ?? "") as string;
        payload.tmsTrackId = (form.tmsTrackId ?? "") as string;
        payload.gpsLocation = (form.gpsLocation ?? "") as string;
        payload.installationStatus = (form.installationStatus ?? "") as string;
      }

      if (role === "maintenance") {
        payload.druvaStatus = form.druvaStatus ?? "";
        payload.druvaDamageNotes = form.druvaDamageNotes ?? "";
        payload.componentStatus = form.componentStatus ?? "";
        payload.failureType = form.failureType ?? "";
        payload.failureLocation = form.failureLocation ?? "";
        payload.failureNotes = form.failureNotes ?? "";

        payload.failureCount = (form.failureCount ??
          material.failureCount ??
          "0") as string;
      }

      if (role === "engineer") {
        payload.lastMaintenanceDate = (form.lastMaintenanceDate ?? "") as string;
        payload.engineerNotes = form.engineerNotes ?? "";
        payload.engineerPhotoUrl = form.engineerPhotoUrl ?? "";
        payload.engineerVerified = true;
      }

      await updateDoc(ref, payload);
      setMsg("Updates saved successfully.");
      setMaterial((prev) =>
        prev ? ({ ...prev, ...payload } as Material) : prev
      );
    } catch (err) {
      console.error(err);
      setMsg("Failed to save updates.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader />;

  if (!material) {
    return (
      <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
        <p className="text-sm text-red-600 text-center">
          {msg || "Material not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF] px-3 py-4 sm:px-4 sm:py-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* HEADER BAR */}
        <div className="bg-[#A259FF] text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold">
              {material.fittingType} – Track Actions
            </h1>
            <p className="text-[11px] opacity-80">
              Material ID: {material.materialId}
            </p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
            <span className="opacity-80 shrink-0">I am:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-white text-[#A259FF] px-2 py-1 rounded-lg text-xs font-semibold w-1/2 sm:w-auto"
            >
              <option value="installation">Installation Staff</option>
              <option value="maintenance">Maintenance Staff</option>
              <option value="engineer">Engineer</option>
            </select>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 space-y-6 text-sm text-black overflow-y-auto max-h-[calc(100vh-6rem)]">
          {msg && (
            <div className="w-full px-3 py-2 rounded-xl bg-[#F7E8FF] text-xs text-[#4B3A7A]">
              {msg}
            </div>
          )}

          {/* MANUFACTURER (READ-ONLY) */}
          <Section title="Manufacturer & Technical (Read-Only)">
            <TwoCol label="Manufacturer Name" value={material.manufacturerName} />
            <TwoCol label="Manufacturer ID" value={material.manufacturerId} />
            <TwoCol label="Fitting Type" value={material.fittingType} />
            <TwoCol label="Drawing Number" value={material.drawingNumber} />
            <TwoCol label="Material Spec" value={material.materialSpec} />
            <TwoCol label="Weight (kg)" value={material.weightKg} />
            <TwoCol label="Gauge" value={material.boardGauge} />
            <TwoCol
              label="Manufacturing Date"
              value={material.manufacturingDate}
            />
            <TwoCol
              label="Expected Life"
              value={`${material.expectedLifeYears || "-"} Years`}
            />
            <TwoCol label="PO Number" value={material.purchaseOrderNumber} />
            <TwoCol label="Batch Number" value={material.batchNumber} />
          </Section>

          {/* QR INFO */}
          <Section title="QR & Tracking Link">
            <p className="text-[11px] text-gray-600 mb-1">
              This is the URL stored inside the manufacturer’s QR code:
            </p>
            <div className="bg-[#F7E8FF] rounded-xl px-3 py-2 text-[10px] break-all">
              {qrUrl || "Loading QR link…"}
            </div>
          </Section>

          {/* INSTALLATION ROLE SECTION */}
          {role === "installation" && (
            <Section title="Installation Staff – Track & Depot Updates">
              <InputRow
                label="Depot Entry Date"
                type="date"
                value={form.depotEntryDate ?? material.depotEntryDate ?? ""}
                onChange={(v) => updateField("depotEntryDate", v as any)}
              />

              <InputRow
                label="TMS Track ID"
                value={form.tmsTrackId ?? material.tmsTrackId ?? ""}
                onChange={(v) => updateField("tmsTrackId", v as any)}
              />

              <InputRow
                label="GPS Installation Location"
                value={form.gpsLocation ?? material.gpsLocation ?? ""}
                onChange={(v) => updateField("gpsLocation", v as any)}
                addonText="Use Live GPS"
                onAddonClick={() => fillGps("gpsLocation")}
              />

              <div className="flex flex-col gap-2 mt-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-gray-600">Installation Status</span>
                <select
                  value={
                    form.installationStatus ??
                    material.installationStatus ??
                    "Not Installed"
                  }
                  onChange={(e) =>
                    updateField("installationStatus", e.target.value as any)
                  }
                  className="px-3 py-2 rounded-xl border text-xs w-full sm:w-auto"
                >
                  <option value="Not Installed">Not Installed</option>
                  <option value="Installed">Installed</option>
                </select>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold w-fit ${
                    (form.installationStatus ?? material.installationStatus) ===
                    "Installed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {form.installationStatus ??
                    material.installationStatus ??
                    "Not Installed"}
                </span>
              </div>
            </Section>
          )}

          {/* MAINTENANCE ROLE SECTION */}
          {role === "maintenance" && (
            <Section title="Maintenance Staff – Druva & Component Health">
              <InputRow
                label="Druva Vehicle Status"
                placeholder="e.g., On Track, In Depot, Under Repair"
                value={form.druvaStatus ?? material.druvaStatus ?? ""}
                onChange={(v) => updateField("druvaStatus", v as any)}
              />

              <InputRow
                label="Druva Damage / Remarks"
                isTextarea
                value={form.druvaDamageNotes ?? material.druvaDamageNotes ?? ""}
                onChange={(v) => updateField("druvaDamageNotes", v as any)}
              />

              <InputRow
                label="Component Status"
                placeholder="Healthy / Failed / Replaced"
                value={form.componentStatus ?? material.componentStatus ?? ""}
                onChange={(v) => updateField("componentStatus", v as any)}
              />

              <InputRow
                label="Failure Type"
                placeholder="e.g., Rail crack, ERC loose, Pad worn"
                value={form.failureType ?? material.failureType ?? ""}
                onChange={(v) => updateField("failureType", v as any)}
              />

              <InputRow
                label="Failure GPS Location"
                value={form.failureLocation ?? material.failureLocation ?? ""}
                onChange={(v) => updateField("failureLocation", v as any)}
                addonText="Use Live GPS"
                onAddonClick={() => fillGps("failureLocation" as any)}
              />

              <InputRow
                label="Failure Notes"
                isTextarea
                value={form.failureNotes ?? material.failureNotes ?? ""}
                onChange={(v) => updateField("failureNotes", v as any)}
              />

              <InputRow
                label="Total Failures Recorded"
                type="number"
                value={form.failureCount ?? material.failureCount ?? "0"}
                onChange={(v) => updateField("failureCount", v as any)}
              />
            </Section>
          )}

          {/* ENGINEER ROLE SECTION */}
          {role === "engineer" && (
            <Section title="Engineer – Verification & Last Maintenance">
              <InputRow
                label="Last Maintenance Date"
                type="date"
                value={form.lastMaintenanceDate ?? material.lastMaintenanceDate ?? ""}
                onChange={(v) => updateField("lastMaintenanceDate", v as any)}
              />

              <InputRow
                label="Engineer Notes"
                isTextarea
                placeholder="Inspection details, repairs done, parts replaced..."
                value={form.engineerNotes ?? material.engineerNotes ?? ""}
                onChange={(v) => updateField("engineerNotes", v as any)}
              />

              <InputRow
                label="Repair Photo URL (with GPS)"
                placeholder="Paste uploaded photo URL"
                value={form.engineerPhotoUrl ?? material.engineerPhotoUrl ?? ""}
                onChange={(v) => updateField("engineerPhotoUrl", v as any)}
              />

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-gray-600">Verification Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold w-fit ${
                    material.engineerVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {material.engineerVerified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            </Section>
          )}

          {/* SAVE BUTTON */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-[#A259FF] text-white text-xs font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Updates"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI SUB COMPONENTS ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#FFF9FF] border border-[#E5D4FF] rounded-2xl p-3 sm:p-4">
      <h3 className="text-[11px] sm:text-[12px] font-bold text-[#A259FF] mb-3 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function TwoCol({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs border-b border-gray-100 py-1.5">
      <span className="text-gray-500 sm:w-1/2">{label}</span>
      <span className="font-semibold sm:w-1/2 sm:text-right break-words">
        {value || "-"}
      </span>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  isTextarea,
  addonText,
  onAddonClick,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  isTextarea?: boolean;
  addonText?: string;
  onAddonClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex justify-between items-center gap-2">
        <span className="text-gray-600">{label}</span>
        {addonText && onAddonClick && (
          <button
            type="button"
            onClick={onAddonClick}
            className="text-[10px] px-2 py-1 bg-[#A259FF]/10 text-[#A259FF] rounded-lg shrink-0"
          >
            {addonText}
          </button>
        )}
      </div>
      {isTextarea ? (
        <textarea
          className="w-full border rounded-xl px-3 py-2 text-[11px] min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full border rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
