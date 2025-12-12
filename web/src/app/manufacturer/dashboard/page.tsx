"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/shared/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";

type MaterialRow = {
  id: string;
  materialId: string;
  fittingType: string;
  manufacturingDate?: string;
};

type Stats = {
  total: number;
  thisMonth: number;
  erc: number;
  pad: number;
  liner: number;
  sleeper: number;
};

export default function ManufacturerDashboard() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    thisMonth: 0,
    erc: 0,
    pad: 0,
    liner: 0,
    sleeper: 0,
  });

  const [recent, setRecent] = useState<MaterialRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ---------------- MOUNT ----------------
  useEffect(() => setMounted(true), []);

  // ---------------- AUTH CHECK ----------------
  useEffect(() => {
    if (!mounted) return;

    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        setAuthChecked(true);
        router.push("/manufacturer/login");
      } else {
        setUserId(user.uid);
        setAuthChecked(true);
      }
    });

    return () => unsub();
  }, [mounted, router]);

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoadingData(true);

      try {
        const coll = collection(db, "materials");

        // ALL MATERIALS OF THIS MANUFACTURER
        const qAll = query(coll, where("manufacturerId", "==", userId));
        const snapAll = await getDocs(qAll);

        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        let total = 0,
          thisMonth = 0;
        let erc = 0,
          pad = 0,
          liner = 0,
          sleeper = 0;

        snapAll.forEach((docSnap) => {
          total++;
          const data: any = docSnap.data();

          if (data.manufacturingDate?.startsWith(monthPrefix)) {
            thisMonth++;
          }

          const ft = (data.fittingType || "").toLowerCase();
          if (ft.includes("clip") || ft.includes("elastic")) erc++;
          else if (ft.includes("pad")) pad++;
          else if (ft.includes("liner")) liner++;
          else if (ft.includes("sleep")) sleeper++;
        });

        setStats({ total, thisMonth, erc, pad, liner, sleeper });

        // RECENT MATERIALS
        const qRecent = query(
          coll,
          where("manufacturerId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const snapRecent = await getDocs(qRecent);
        const rows: MaterialRow[] = [];
        snapRecent.forEach((d) =>
          rows.push({ id: d.id, ...(d.data() as any) })
        );

        setRecent(rows);
      } finally {
        setLoadingData(false);
      }
    }

    load();
  }, [userId]);

  // ---------------- GLOBAL LOADING STATES ----------------
  if (!mounted || !authChecked) return <AppLoader />;
  if (loadingData) return <AppLoader />;

  // ---------------- UI START ----------------
  return (
    <div className="min-h-[100dvh] bg-[#F7E8FF]">
      <MainHeader />

      {/* Sidebar + Main */}
      <div className="pt-[80px] md:pt-[90px] relative">
        {/* Fixed Sidebar (mobile-friendly version already created) */}
        <ManufacturerSidebar />

        {/* Main content */}
        <main
          className="
            w-full 
            px-4 sm:px-6 md:px-8 lg:px-10 
            py-5 sm:py-6 md:py-8 
            ml-0 md:ml-64 
            transition-[margin] 
            duration-200
          "
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#A259FF] mb-5 sm:mb-6">
            Manufacturer Analytics
          </h1>

          {/* TOP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-3xl shadow-lg px-4 sm:px-5 py-3 sm:py-4 border-t-4 border-[#A259FF]">
              <p className="text-[11px] sm:text-xs text-gray-500">
                Total Components
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4B3A7A] mt-1">
                {stats.total}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg px-4 sm:px-5 py-3 sm:py-4 border-t-4 border-[#F97316]">
              <p className="text-[11px] sm:text-xs text-gray-500">
                This Month
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4B3A7A] mt-1">
                {stats.thisMonth}
              </p>
            </div>

            <Link
              href="/manufacturer/add-material"
              className="
                bg-gradient-to-br from-[#A259FF] to-[#F97316] 
                rounded-3xl shadow-lg 
                px-4 sm:px-5 py-3 sm:py-4 
                text-white flex flex-col justify-center
              "
            >
              <p className="text-[11px] sm:text-xs opacity-80">
                Quick Action
              </p>
              <p className="text-lg sm:text-xl font-semibold mt-1">
                Add Material
              </p>
            </Link>

            <Link
              href="/manufacturer/view"
              className="
                bg-white rounded-3xl shadow-lg 
                px-4 sm:px-5 py-3 sm:py-4 
                border border-[#E9D5FF] 
                flex flex-col justify-center
              "
            >
              <p className="text-[11px] sm:text-xs text-gray-500">
                Components
              </p>
              <p className="text-lg sm:text-xl font-semibold text-[#4B3A7A] mt-1">
                Browse &amp; Export
              </p>
            </Link>
          </div>

          {/* RECENT COMPONENTS */}
          <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-5 md:p-6 mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-[#4B3A7A]">
                Recent Components
              </h2>
              <Link
                href="/manufacturer/view"
                className="text-xs sm:text-sm text-[#A259FF]"
              >
                View all →
              </Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-[11px] sm:text-xs md:text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                    <th className="py-2 px-2 text-left">Material ID</th>
                    <th className="py-2 px-2 text-left">Fitting Type</th>
                    <th className="py-2 px-2 text-left">Mfg Date</th>
                    <th className="py-2 px-2 text-left">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-2 px-2 break-all">
                        {m.materialId}
                      </td>
                      <td className="py-2 px-2">
                        {m.fittingType}
                      </td>
                      <td className="py-2 px-2">
                        {m.manufacturingDate || "-"}
                      </td>
                      <td className="py-2 px-2">
                        <Link
                          href={`/manufacturer/generate-qr?id=${m.id}`}
                          className="text-[#A259FF]"
                        >
                          View QR
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {recent.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 px-2 text-center text-[11px] sm:text-xs text-gray-500"
                      >
                        No components found yet. Start by adding a material.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
