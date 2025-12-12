"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/shared/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar"; // or EngineerSidebar if you create one

type Fault = {
  id: string;
  materialId: string;
  componentType?: string;
  status?: "Open" | "InProgress" | "Closed" | string;
  faultGps?: string;
  detectedAt?: string;
};

export default function EngineerFaultDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [faultsOpen, setFaultsOpen] = useState<Fault[]>([]);
  const [faultsClosed, setFaultsClosed] = useState<Fault[]>([]);
  const [faultsInProgress, setFaultsInProgress] = useState<Fault[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }
      await loadFaults();
    });

    return () => unsub();
  }, [router]);

  async function loadFaults() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "faults"));

      const openArr: Fault[] = [];
      const closedArr: Fault[] = [];
      const inProgArr: Fault[] = [];

      snap.forEach((docSnap) => {
        const d = docSnap.data() as Omit<Fault, "id">;
        const item: Fault = {
          id: docSnap.id,
          materialId: d.materialId,
          componentType: d.componentType,
          status: d.status,
          faultGps: d.faultGps,
          detectedAt: d.detectedAt,
        };

        switch (item.status) {
          case "Closed":
            closedArr.push(item);
            break;
          case "InProgress":
            inProgArr.push(item);
            break;
          default:
            openArr.push(item);
            break;
        }
      });

      setFaultsOpen(openArr);
      setFaultsClosed(closedArr);
      setFaultsInProgress(inProgArr);
    } catch (err) {
      console.error("LOAD FAULTS ERROR:", err);
      alert("Failed to load faults. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4">
        <div className="bg-white/80 px-6 py-4 rounded-2xl shadow flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#A259FF] animate-pulse" />
          <p className="text-sm text-gray-700 font-medium">
            Loading engineer faults…
          </p>
        </div>
      </div>
    );
  }

  const total = faultsOpen.length + faultsClosed.length + faultsInProgress.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col">
      <MainHeader />

      <div className="flex pt-[90px] flex-col lg:flex-row">
        {/* Sidebar (hidden on mobile, visible on lg+) */}
        <div className="hidden lg:block">
          {/* You can later swap to <EngineerSidebar /> */}
          <TrackSidebar />
        </div>

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 pb-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">
                  Engineer &gt; Faults
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Fault Verification &amp; Closure
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Review open anomalies, verify on-site, and close faults after repair.
                </p>
              </div>

              <div className="flex gap-2 justify-start sm:justify-end">
                <button
                  onClick={loadFaults}
                  className="px-4 py-2 rounded-2xl bg-white/80 border border-purple-100 text-xs font-medium text-[#4B3A7A] shadow-sm hover:bg-white"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/90 rounded-3xl shadow-lg px-5 py-4 border border-red-100">
                <p className="text-[11px] text-gray-500 mb-1">Open Faults</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-red-600 leading-none">
                    {faultsOpen.length}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-red-50 text-red-700">
                    Needs attention
                  </span>
                </div>
              </div>

              <div className="bg-white/90 rounded-3xl shadow-lg px-5 py-4 border border-yellow-100">
                <p className="text-[11px] text-gray-500 mb-1">In Progress</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-yellow-600 leading-none">
                    {faultsInProgress.length}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                    On field
                  </span>
                </div>
              </div>

              <div className="bg-white/90 rounded-3xl shadow-lg px-5 py-4 border border-green-100">
                <p className="text-[11px] text-gray-500 mb-1">Closed</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-green-600 leading-none">
                    {faultsClosed.length}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-700">
                    Verified
                  </span>
                </div>
              </div>

              <div className="bg-white/90 rounded-3xl shadow-lg px-5 py-4 border border-purple-100">
                <p className="text-[11px] text-gray-500 mb-1">Total Records</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-[#4B3A7A] leading-none">
                    {total}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#F7E8FF] text-[#A259FF]">
                    All faults
                  </span>
                </div>
              </div>
            </div>

            {/* Open Faults Table */}
            <section className="bg-white/95 rounded-3xl shadow-xl border border-red-100/70 p-4 sm:p-5 md:p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A]">
                    Open Faults
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Faults awaiting verification and closure.
                  </p>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 w-fit">
                  {faultsOpen.length} open
                </span>
              </div>

              {faultsOpen.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No open faults 🎉
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                        <th className="py-2.5 px-3 text-left">Fault ID</th>
                        <th className="py-2.5 px-3 text-left">Material ID</th>
                        <th className="py-2.5 px-3 text-left">Component</th>
                        <th className="py-2.5 px-3 text-left">Detected At</th>
                        <th className="py-2.5 px-3 text-left">GPS</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {faultsOpen.map((f, idx) => (
                        <tr
                          key={f.id}
                          className={`border-t border-gray-100 ${
                            idx % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {f.id}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {f.materialId || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {f.componentType || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {f.detectedAt || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {f.faultGps || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() =>
                                router.push(`/engineer/faults/details?id=${f.id}`)
                              }
                              className="text-[11px] font-semibold text-[#A259FF] hover:underline"
                            >
                              View &amp; Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Closed Faults Table */}
            <section className="bg-white/95 rounded-3xl shadow-xl border border-green-100/70 p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A]">
                    Recently Closed Faults
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Verified and closed by engineers.
                  </p>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 w-fit">
                  {faultsClosed.length} closed
                </span>
              </div>

              {faultsClosed.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No closed faults yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                        <th className="py-2.5 px-3 text-left">Fault ID</th>
                        <th className="py-2.5 px-3 text-left">Material ID</th>
                        <th className="py-2.5 px-3 text-left">Component</th>
                        <th className="py-2.5 px-3 text-left">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {faultsClosed.map((f, idx) => (
                        <tr
                          key={f.id}
                          className={`border-t border-gray-100 ${
                            idx % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {f.id}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {f.materialId || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {f.componentType || "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Closed
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() =>
                                router.push(`/engineer/faults/details?id=${f.id}`)
                              }
                              className="text-[11px] font-semibold text-[#A259FF] hover:underline"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
