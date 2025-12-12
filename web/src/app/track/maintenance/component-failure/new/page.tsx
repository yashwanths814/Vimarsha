"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
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

type GpsLocation = {
  lat: number | null;
  lng: number | null;
};

export default function ComponentFailureNewPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // form fields
  const [componentType, setComponentType] = useState("Clip");
  const [materialId, setMaterialId] = useState("");
  const [failureType, setFailureType] = useState("Crack");
  const [severity, setSeverity] = useState<"critical" | "medium" | "low">(
    "medium"
  );
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState<GpsLocation>({ lat: null, lng: null });
  const [images, setImages] = useState<string[]>([]);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);

  // 🔐 auth + role check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }

      const staffSnap = await getDoc(doc(db, "trackStaff", user.uid));
      const data = staffSnap.exists() ? staffSnap.data() : null;

      if (!data || data.role !== "maintenance") {
        router.push("/track/login");
        return;
      }

      setCurrentUserId(user.uid);
      setCurrentUserName(data.name || "Maintenance Staff");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 📍 get current GPS location
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGpsMsg("Geolocation not supported in this browser");
      return;
    }

    setGpsMsg("Getting current location…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsMsg("Location captured ✅");
      },
      (err) => {
        console.error(err);
        setGpsMsg("Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    try {
      setSaving(true);
      const path = `faultEvidence/${currentUserId}/${Date.now()}-${file.name}`;
      const fileRef = ref(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentUserId) return;

    if (!materialId.trim()) {
      setError("Please enter or scan Material ID");
      return;
    }

    if (!description.trim()) {
      setError("Please add a short description of failure");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "faults"), {
        source: "maintenance",
        componentType,
        materialId: materialId.trim(),
        failureType,
        severity,
        description: description.trim(),
        gps: {
          lat: gps.lat,
          lng: gps.lng,
        },
        images,
        status: "open",
        aiDetection: false,
        createdBy: currentUserId,
        createdByName: currentUserName,
        timeOfOccurrence: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // Clear form
      setComponentType("Clip");
      setMaterialId("");
      setFailureType("Crack");
      setSeverity("medium");
      setDescription("");
      setGps({ lat: null, lng: null });
      setImages([]);
      setGpsMsg(null);

      alert("Fault logged and sent to Engineer ✅");
      router.push("/track/maintenance"); // back to dashboard
    } catch (err) {
      console.error(err);
      setError("Failed to log fault");
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
        <MainHeader title="Log Component Failure" />

        {error && (
          <div className="mt-3 mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4 text-sm"
        >
          {/* Component Type + Material ID */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr,1.8fr] gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Component Type
              </label>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              >
                <option>Clip</option>
                <option>Pad</option>
                <option>Liner</option>
                <option>Sleeper</option>
                <option>Rail Joint</option>
                <option>Bolt</option>
                <option>Fastener Assembly</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Material ID (Scan or Enter)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  placeholder="e.g. EC12345"
                  className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                />
                <button
                  type="button"
                  onClick={() => router.push("/track/scan")}
                  className="px-3 py-2 rounded-xl bg-[#F3E3FF] text-[#A259FF] text-xs font-semibold"
                >
                  Scan QR
                </button>
              </div>
            </div>
          </div>

          {/* Failure type + Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Failure Type
              </label>
              <select
                value={failureType}
                onChange={(e) => setFailureType(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              >
                <option>Crack</option>
                <option>Corrosion</option>
                <option>Missing</option>
                <option>Wear</option>
                <option>Misalignment</option>
                <option>Loosening</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold text-gray-700">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as "critical" | "medium" | "low")
                }
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              >
                <option value="critical">Critical</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Failure Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              placeholder="Describe what you saw at site…"
            />
          </div>

          {/* GPS */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              GPS Location
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-3 py-2 rounded-xl bg-[#A259FF] text-white font-semibold"
              >
                Use Current Location
              </button>
              {gps.lat && gps.lng && (
                <span className="text-gray-700">
                  Lat: {gps.lat.toFixed(6)}, Lng: {gps.lng.toFixed(6)}
                </span>
              )}
              {gpsMsg && <span className="text-gray-500">{gpsMsg}</span>}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Upload Proof Images
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="fault"
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
            {saving ? "Logging…" : "Log Fault"}
          </button>
        </form>
      </main>
    </div>
  );
}
