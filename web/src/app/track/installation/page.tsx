"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/shared/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import AppLoader from "@/components/AppLoader";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

type Material = {
  id: string;
  materialId?: string;
  fittingType?: string;
  depotEntryDate?: string;
  installationStatus?: "Installed" | "Not Installed" | string;
};

export default function InstallationDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [installedList, setInstalledList] = useState<Material[]>([]);
  const [pendingList, setPendingList] = useState<Material[]>([]);

  const [installed, setInstalled] = useState(0);
  const [pending, setPending] = useState(0);

  // ---------------------------
  // AUTH CHECK
  // ---------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }
      await loadMaterials();
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------
  // LOAD MATERIALS
  // ---------------------------
  async function loadMaterials() {
    setLoading(true);

    const snap = await getDocs(collection(db, "materials"));

    const _installed: Material[] = [];
    const _pending: Material[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as Omit<Material, "id">;
      const item: Material = { id: docSnap.id, ...data };

      if (item.installationStatus === "Installed") {
        _installed.push(item);
      } else {
        _pending.push(item);
      }
    });

    setInstalledList(_installed);
    setPendingList(_pending);

    setInstalled(_installed.length);
    setPending(_pending.length);

    setLoading(false);
  }

  if (loading) return <AppLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        {/* Sidebar Navigation – show only on large screens */}
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
          <div className="max-w-6xl mx-auto">
            {/* Mobile quick header / back + scan button */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>
              <button
                onClick={() => router.push("/track/scan")}
                className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-br from-[#A259FF] to-[#F97316] px-3 py-1.5 text-[11px] font-semibold text-white shadow-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                Scan QR
              </button>
            </div>

            {/* Page Header / Breadcrumb + Title */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Track &gt; Installation
                </p>
                <h1 className="text-xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Installation Staff Dashboard
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Monitor pending and completed installations, and quickly jump to QR scanning.
                </p>
              </div>

              {/* Desktop scan button */}
              <div className="hidden md:flex gap-2 justify-end">
                <button
                  onClick={() => router.push("/track/scan")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#A259FF] to-[#F97316] px-4 md:px-6 py-2.5 text-xs md:text-sm font-semibold text-white shadow-md hover:opacity-95 transition"
                >
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  Scan Material QR
                </button>
              </div>
            </div>

            {/* TOP STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg px-5 py-4 border border-yellow-100 flex flex-col justify-between">
                <p className="text-[11px] text-gray-500 mb-1">Not Installed</p>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold text-[#4B3A7A] leading-none">
                    {pending}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                    Pending
                  </span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg px-5 py-4 border border-green-100 flex flex-col justify-between">
                <p className="text-[11px] text-gray-500 mb-1">Installed</p>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold text-[#4B3A7A] leading-none">
                    {installed}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                    Completed
                  </span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-3xl shadow-lg px-5 py-4 border border-purple-100 flex flex-col justify-between">
                <p className="text-[11px] text-gray-500 mb-1">Total Materials</p>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold text-[#4B3A7A] leading-none">
                    {installed + pending}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#F7E8FF] text-[#A259FF] font-medium">
                    Overall
                  </span>
                </div>
              </div>
            </div>

            {/* PENDING LIST */}
            <section className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-5 md:p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A]">
                    Not Installed – Pending Materials
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Materials that are yet to be installed on track.
                  </p>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                  {pending} pending
                </span>
              </div>

              {pendingList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No pending materials 🎉
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                        <th className="py-2.5 px-3 text-left">Material ID</th>
                        <th className="py-2.5 px-3 text-left">Fitting Type</th>
                        <th className="py-2.5 px-3 text-left">Depot Entry</th>
                        <th className="py-2.5 px-3 text-left">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {pendingList.map((m, idx) => (
                        <tr
                          key={m.id}
                          className={`border-t border-gray-100 ${
                            idx % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {m.materialId || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {m.fittingType || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {m.depotEntryDate || "-"}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                              Not Installed
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/track/installation/material?id=${m.id}`}
                              className="text-[11px] font-semibold text-[#A259FF] hover:underline"
                            >
                              Update
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* INSTALLED LIST */}
            <section className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-[#4B3A7A]">
                    Installed Materials
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Materials that have been successfully installed and updated.
                  </p>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {installed} installed
                </span>
              </div>

              {installedList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No installed materials yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                        <th className="py-2.5 px-3 text-left">Material ID</th>
                        <th className="py-2.5 px-3 text-left">Fitting Type</th>
                        <th className="py-2.5 px-3 text-left">Depot Entry</th>
                        <th className="py-2.5 px-3 text-left">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {installedList.map((m, idx) => (
                        <tr
                          key={m.id}
                          className={`border-t border-gray-100 ${
                            idx % 2 === 1 ? "bg-gray-50/40" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-800">
                            {m.materialId || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {m.fittingType || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {m.depotEntryDate || "-"}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Installed
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/track/installation/material?id=${m.id}`}
                              className="text-[11px] font-semibold text-[#A259FF] hover:underline"
                            >
                              View
                            </Link>
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
