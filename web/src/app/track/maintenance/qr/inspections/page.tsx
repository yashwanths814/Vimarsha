"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDatabase, ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";
import generateDruvaInspectionPdf from "../inspections/generateDruvaInspectionPdf";

type Detection = {
  bbox?: number[] | { [k: string]: number };
  class?: string;
  class_index?: number;
  color?: string;
  confidence?: number;
};

type InspectionRow = {
  id: string; // key: epoch millis
  camera_id?: number;
  detections?: Record<string, Detection> | Detection[];
};

function toDetectionsArray(d: InspectionRow["detections"]): Detection[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return Object.values(d).filter(Boolean);
}

function bboxToString(bbox?: Detection["bbox"]) {
  if (!bbox) return "—";
  if (Array.isArray(bbox)) return bbox.map((n) => Number(n).toFixed(0)).join(", ");
  const arr = Object.keys(bbox)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => (bbox as any)[k]);
  return arr.map((n) => Number(n).toFixed(0)).join(", ");
}

function fmtConfidence(c?: number) {
  if (c === undefined || c === null) return "—";
  const n = Number(c);
  if (Number.isNaN(n)) return "—";
  return n > 1 ? n.toFixed(2) : `${(n * 100).toFixed(2)}%`;
}

export default function QrInspectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InspectionRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const rtdb = getDatabase();
    const inspectionsRef = ref(rtdb, "inspections");

    let detachRt: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/maintenance/login");
        return;
      }

      setLoading(true);

      const unsubscribe = onValue(inspectionsRef, (snap) => {
        const val = snap.val();
        if (!val) {
          setRows([]);
          setLoading(false);
          return;
        }

        const list: InspectionRow[] = Object.entries(val).map(([id, data]: any) => ({
          id,
          ...data,
        }));

        list.sort((a, b) => Number(b.id) - Number(a.id));

        setRows(list);
        setLoading(false);
      });

      detachRt = () => unsubscribe();
    });

    return () => {
      if (detachRt) detachRt();
      unsubAuth();
    };
  }, [router]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      if ((r.id || "").toLowerCase().includes(s)) return true;
      if (String(r.camera_id ?? "").includes(s)) return true;
      const dets = toDetectionsArray(r.detections);
      return dets.some((d) => (d.class || "").toLowerCase().includes(s));
    });
  }, [rows, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
        <div className="animate-spin h-10 w-10 border-4 border-[#A259FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7E8FF]">
      <TrackSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <MainHeader />
        <h1 className="text-xl font-semibold text-gray-800 mt-2">QR Inspected Data</h1>

        <div className="mt-4 bg-white rounded-2xl shadow p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by inspection id / camera_id / class…"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none"
          />
          <div className="text-xs font-semibold text-gray-600 px-3 py-2 rounded-xl bg-[#FAF5FF]">
            Total: {filtered.length}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No inspection records found.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => {
                const dets = toDetectionsArray(r.detections);
                const epoch = Number(r.id);
                const timeStr = Number.isFinite(epoch) ? new Date(epoch).toLocaleString() : r.id;

                return (
                  <li key={r.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold text-[#6B4FA3] text-sm truncate">
                          Inspection ID: {r.id}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Time: {timeStr} • Camera ID: {r.camera_id ?? "—"} • Detections:{" "}
                          {dets.length}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => generateDruvaInspectionPdf(r)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-[#E9B3FB] text-[#4B1D63] text-xs font-bold shadow hover:bg-[#D79AF2] transition"
                          >
                            ⬇️ Download Druva Report (PDF)
                          </button>
                        </div>
                      </div>

                      <span className="text-[11px] px-3 py-1 rounded-full bg-[#F3E3FF] text-[#A259FF] font-semibold">
                        Realtime DB
                      </span>
                    </div>

                    {dets.length === 0 ? (
                      <div className="mt-3 text-sm text-gray-500">No detections in this inspection.</div>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dets.map((d, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-gray-100 p-3 bg-[#FAF5FF]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-sm text-gray-800 truncate">
                                {d.class || "unknown"}
                              </div>
                              <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold">
                                {d.color || "—"}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-gray-600">
                              Confidence:{" "}
                              <span className="font-semibold">{fmtConfidence(d.confidence)}</span>
                            </div>

                            <div className="mt-1 text-xs text-gray-600">
                              Class Index:{" "}
                              <span className="font-semibold">{d.class_index ?? "—"}</span>
                            </div>

                            <div className="mt-1 text-xs text-gray-600">
                              BBox: <span className="font-semibold">{bboxToString(d.bbox)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
