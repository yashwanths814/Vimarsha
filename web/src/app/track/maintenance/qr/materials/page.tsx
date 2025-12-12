"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

type QrScanRow = {
  id: string;
  camera?: string;
  qr_code?: string;
  timestamp?: string;
  location?: { lat?: number; lng?: number };
};

function tsToMillis(ts?: string) {
  if (!ts) return 0;
  const fixed = ts.replace(/\.(\d{3})\d+/, (_m, ms) => `.${ms}`);
  const t = Date.parse(fixed);
  return Number.isNaN(t) ? 0 : t;
}

export default function QrScannedMaterialsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<QrScanRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const rtdb = getDatabase();
    const scansRef = ref(rtdb, "qr_scans");

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/track/maintenance/login");
        return;
      }

      // ✅ Auth confirmed → stop infinite spinner
      setLoading(false);

      onValue(scansRef, (snap) => {
        const val = snap.val();

        if (!val) {
          setRows([]);
          return;
        }

        const list: QrScanRow[] = Object.entries(val).map(
          ([id, data]: any) => ({
            id,
            ...data,
          })
        );

        list.sort(
          (a, b) => tsToMillis(b.timestamp) - tsToMillis(a.timestamp)
        );

        setRows(list);
      });
    });

    return () => {
      off(scansRef);
      unsubAuth();
    };
  }, [router]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.qr_code || "").toLowerCase().includes(s)
    );
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
        <h1 className="text-xl font-semibold text-gray-800 mt-2">
          QR Scanned Materials
        </h1>

        <div className="mt-4 bg-white rounded-2xl shadow p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by QR code…"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none"
          />
          <div className="text-xs font-semibold text-gray-600 px-3 py-2 rounded-xl bg-[#FAF5FF]">
            Total: {filtered.length}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No scans found.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => {
                const lat = r.location?.lat;
                const lng = r.location?.lng;
                const millis = tsToMillis(r.timestamp);
                const timeStr = millis
                  ? new Date(millis).toLocaleString()
                  : r.timestamp || "";

                return (
                  <li
                    key={r.id}
                    className="p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#6B4FA3] text-sm truncate">
                        {r.qr_code || "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Camera: {r.camera || "—"} • {timeStr}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Location:{" "}
                        {typeof lat === "number" &&
                        typeof lng === "number"
                          ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                          : "—"}
                      </div>
                    </div>

                    {typeof lat === "number" &&
                    typeof lng === "number" ? (
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-[#F3E3FF] text-[#A259FF] text-xs font-semibold"
                      >
                        📍 Open Map
                      </a>
                    ) : (
                      <span className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold">
                        No GPS
                      </span>
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
