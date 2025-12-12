"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db, storage } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

export default function DruvaStatusPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    status: "Ready",
    batteryHealth: "",
    motorHealth: "",
    sensorCamera: "OK",
    sensorGps: "OK",
    sensorAiModule: "OK",
    lastServiceDate: "",
    nextServiceDate: "",
    remarks: "",
    photos: [] as string[],
  });

  // ✅ auth + role check + data load
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }

      // optional: ensure this is maintenance staff
      const staffSnap = await getDoc(doc(db, "trackStaff", user.uid));
      const role = staffSnap.exists() ? staffSnap.data().role : null;

      if (role !== "maintenance") {
        // you can change this if engineers should also access
        router.push("/track/login");
        return;
      }

      await loadDruvaStatus();
    });

    return () => unsub();
  }, []);

  async function loadDruvaStatus() {
    setLoading(true);
    setError(null);

    try {
      const snap = await getDoc(doc(db, "druvaStatus", "vehicle-1"));
      if (snap.exists()) {
        const data = snap.data();
        setForm((prev: any) => ({
          ...prev,
          ...data,
          batteryHealth: data.batteryHealth?.toString() ?? "",
          motorHealth: data.motorHealth?.toString() ?? "",
        }));
      }
    } catch (e: any) {
      setError("Failed to load Druva status");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const path = `druvaPhotos/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      setForm((prev: any) => ({
        ...prev,
        photos: [...(prev.photos || []), url],
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await setDoc(
        doc(db, "druvaStatus", "vehicle-1"),
        {
          status: form.status,
          batteryHealth: Number(form.batteryHealth) || 0,
          motorHealth: Number(form.motorHealth) || 0,
          sensorCamera: form.sensorCamera,
          sensorGps: form.sensorGps,
          sensorAiModule: form.sensorAiModule,
          lastServiceDate: form.lastServiceDate || null,
          nextServiceDate: form.nextServiceDate || null,
          remarks: form.remarks || "",
          photos: form.photos || [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      alert("Druva status updated ✅");
    } catch (err) {
      console.error(err);
      setError("Failed to save Druva status");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
        <div className="h-10 w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7E8FF]">
      <TrackSidebar />

      <main className="flex-1 ml-64 p-4 sm:p-6">
        <MainHeader title="Druva Vehicle Status" />

        {error && (
          <div className="mt-3 mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4 text-sm"
        >
          {/* Status */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Current Status
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
            >
              <option>Ready</option>
              <option>In Operation</option>
              <option>Under Maintenance</option>
              <option>Faulty</option>
            </select>
          </div>

          {/* Battery & Motor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Battery Health (%)
              </label>
              <input
                type="number"
                value={form.batteryHealth}
                onChange={(e) => updateField("batteryHealth", e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Motor Health (%)
              </label>
              <input
                type="number"
                value={form.motorHealth}
                onChange={(e) => updateField("motorHealth", e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>
          </div>

          {/* Sensors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "sensorCamera", label: "Camera" },
              { key: "sensorGps", label: "GPS" },
              { key: "sensorAiModule", label: "AI Module" },
            ].map((s) => (
              <div key={s.key}>
                <label className="block mb-1 text-xs font-semibold text-gray-700">
                  {s.label} Status
                </label>
                <select
                  value={form[s.key]}
                  onChange={(e) => updateField(s.key, e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                >
                  <option>OK</option>
                  <option>Faulty</option>
                </select>
              </div>
            ))}
          </div>

          {/* Service dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Last Service Date
              </label>
              <input
                type="date"
                value={form.lastServiceDate || ""}
                onChange={(e) =>
                  updateField("lastServiceDate", e.target.value)
                }
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Next Scheduled Maintenance
              </label>
              <input
                type="date"
                value={form.nextServiceDate || ""}
                onChange={(e) =>
                  updateField("nextServiceDate", e.target.value)
                }
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Remarks
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Upload Photos (if damaged)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {form.photos?.map((url: string) => (
                <img
                  key={url}
                  src={url}
                  alt="Druva"
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#A259FF] text-white text-sm font-semibold shadow disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Status"}
          </button>
        </form>
      </main>
    </div>
  );
}
