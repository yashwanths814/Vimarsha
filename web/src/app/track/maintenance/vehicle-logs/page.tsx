"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { auth, db, storage } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

type LogEntry = {
  id: string;
  issueObserved: string;
  repairPerformed: string;
  partsReplaced: string;
  notes?: string;
  technicianId: string;
  technicianName: string;
  createdAt?: any;
  images?: string[];
};

export default function VehicleMaintenanceLogsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [issueObserved, setIssueObserved] = useState("");
  const [repairPerformed, setRepairPerformed] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // 🔐 Auth + role check + initial data load
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

      await loadLogs(user.uid);
    });

    return () => unsub();
  }, []);

  async function loadLogs(userId: string) {
    setLoading(true);
    setError(null);

    try {
      const qLogs = query(
        collection(db, "vehicleMaintenanceLogs"),
        where("technicianId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(qLogs);
      const list: LogEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setLogs(list);
    } catch (e) {
      console.error(e);
      setError("Failed to load maintenance logs");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    try {
      setSaving(true);
      const path = `vehicleMaintenance/${currentUserId}/${Date.now()}-${file.name}`;
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
    if (!currentUserId) return;

    if (!issueObserved.trim() || !repairPerformed.trim()) {
      setError("Please fill Issue Observed and Repair Performed");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addDoc(collection(db, "vehicleMaintenanceLogs"), {
        issueObserved: issueObserved.trim(),
        repairPerformed: repairPerformed.trim(),
        partsReplaced: partsReplaced.trim(),
        notes: notes.trim(),
        technicianId: currentUserId,
        technicianName: currentUserName,
        images,
        createdAt: serverTimestamp(),
      });

      // Clear form
      setIssueObserved("");
      setRepairPerformed("");
      setPartsReplaced("");
      setNotes("");
      setImages([]);

      // Reload list
      await loadLogs(currentUserId);
    } catch (err) {
      console.error(err);
      setError("Failed to save maintenance log");
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
        <MainHeader title="Vehicle Maintenance Logs" />

        {error && (
          <div className="mt-3 mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white rounded-2xl shadow p-4 sm:p-6 space-y-3 text-sm"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Add New Maintenance Log
          </h2>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Issue Observed
            </label>
            <textarea
              value={issueObserved}
              onChange={(e) => setIssueObserved(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              placeholder="Example: Left drive motor overheating after 30 minutes of run…"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Repair Performed
            </label>
            <textarea
              value={repairPerformed}
              onChange={(e) => setRepairPerformed(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              placeholder="Example: Cleaned cooling vents, replaced thermal paste, tested at 1-hour continuous run…"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Parts Replaced
            </label>
            <input
              type="text"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              placeholder="Example: Left motor fan, 12V relay module"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Additional Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              placeholder="Any additional observations…"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-gray-700">
              Upload Images (before/after)
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
                  alt="Maintenance"
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
            {saving ? "Saving…" : "Save Log"}
          </button>
        </form>

        {/* LIST OF LOGS */}
        <section className="mt-6 bg-white rounded-2xl shadow p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Your Maintenance History
          </h2>

          {logs.length === 0 ? (
            <p className="text-xs text-gray-400">
              No maintenance logs yet. Add your first log above.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-100 rounded-xl p-3 text-xs bg-[#FBF8FF]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-[#4B3A7A]">
                      {log.issueObserved.slice(0, 60)}
                      {log.issueObserved.length > 60 ? "…" : ""}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {log.createdAt?.toDate
                        ? log.createdAt.toDate().toLocaleString()
                        : ""}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-1">
                    <span className="font-semibold">Repair:</span>{" "}
                    {log.repairPerformed}
                  </p>

                  {log.partsReplaced && (
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">Parts Replaced:</span>{" "}
                      {log.partsReplaced}
                    </p>
                  )}

                  {log.notes && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-semibold">Notes:</span>{" "}
                      {log.notes}
                    </p>
                  )}

                  {log.images && log.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {log.images.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="log"
                          className="h-14 w-14 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-[10px] text-gray-500">
                    Technician: {log.technicianName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
