"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/shared/firebaseConfig";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

export default function EngineerDashboardPage() {
  const router = useRouter();

  // 🔹 all materials from Firestore
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  // 🔹 filtered list shown in table
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending_verification" | "verified" | "pending_request"
  >("all");

  const [stats, setStats] = useState({
    total: 0,
    pendingVerification: 0,
    verified: 0,
    pendingRequest: 0,
  });

  // -----------------------------
  // LOAD ALL MATERIALS ONCE
  // -----------------------------
  useEffect(() => {
    loadAllMaterials();
  }, []);

  async function loadAllMaterials() {
    try {
      setLoading(true);

      const qRef = query(
        collection(db, "materials"),
        orderBy("depotEntryDate", "desc")
      );

      const snapshot = await getDocs(qRef);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setAllMaterials(data);
    } catch (err) {
      console.error("LOAD MATERIALS ERROR:", err);
      alert("Failed to load materials.");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // RECALCULATE STATS + APPLY FILTER
  // -----------------------------
  useEffect(() => {
    calculateStats(allMaterials);
    applyFilter(allMaterials, filter);
  }, [allMaterials, filter]);

  function calculateStats(data: any[]) {
    const nextStats = {
      total: data.length,
      pendingVerification: data.filter(
        (m) => m.installationStatus === "Installed" && !m.geoTagVerified
      ).length,
      verified: data.filter((m) => m.geoTagVerified).length,
      pendingRequest: data.filter((m) => m.requestStatus === "pending").length,
    };
    setStats(nextStats);
  }

  function applyFilter(data: any[], filterValue: typeof filter) {
    let filtered = data;

    if (filterValue === "pending_verification") {
      filtered = data.filter(
        (m) => m.installationStatus === "Installed" && !m.geoTagVerified
      );
    } else if (filterValue === "verified") {
      filtered = data.filter((m) => m.geoTagVerified);
    } else if (filterValue === "pending_request") {
      filtered = data.filter((m) => m.requestStatus === "pending");
    }

    setMaterials(filtered);
  }

  // -----------------------------
  // BADGE HELPERS
  // -----------------------------
  const getStatusBadge = (material: any) => {
    if (material.requestStatus === "pending") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Request Pending
        </span>
      );
    }
    if (material.geoTagVerified) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Verified
        </span>
      );
    }
    if (material.installationStatus === "Installed") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Awaiting Verification
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
        Not Installed
      </span>
    );
  };

  // -----------------------------
  // ENGINEER QUICK ACTIONS
  // -----------------------------
  async function handleVerifyGeoTag(id: string) {
    try {
      await updateDoc(doc(db, "materials", id), {
        geoTagVerified: true,
      });

      setAllMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, geoTagVerified: true } : m))
      );
    } catch (err) {
      console.error("VERIFY GEO TAG ERROR:", err);
      alert("Failed to verify geo tag.");
    }
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col">
      <MainHeader />

      <div className="flex pt-[90px] flex-col lg:flex-row">
        {/* Sidebar: only on large screens */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-8 pb-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A]">
                  Engineer Dashboard
                </h1>
                <p className="mt-2 text-xs md:text-sm text-gray-600">
                  Verify installations and manage component requests
                </p>
              </div>
              <Link
                href="/track/engineer/requests"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[#3A7AFF] text-white text-sm font-medium rounded-xl hover:bg-[#2A6AEF] transition-colors shadow-sm"
              >
                View All Requests
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Total */}
              <DashboardCard
                label="Total Materials"
                value={stats.total}
                color="blue"
                iconPath="M4 6h16M4 10h16M10 14h10M10 18h10"
              />

              {/* Pending Verification */}
              <DashboardCard
                label="Pending Verification"
                value={stats.pendingVerification}
                color="yellow"
                iconPath="M12 8v4m0 4h.01M4.93 4.93l14.14 14.14"
              />

              {/* Verified */}
              <DashboardCard
                label="Verified"
                value={stats.verified}
                color="green"
                iconPath="M5 13l4 4L19 7"
              />

              {/* Pending Requests */}
              <DashboardCard
                label="Pending Requests"
                value={stats.pendingRequest}
                color="red"
                iconPath="M12 8v4m0 4h.01M4 6h16"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-8 mb-6 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All Materials" },
                {
                  id: "pending_verification",
                  label: "Pending Verification",
                },
                { id: "verified", label: "Verified" },
                {
                  id: "pending_request",
                  label: "Pending Requests",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as typeof filter)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                    ${
                      filter === tab.id
                        ? "bg-[#3A7AFF] text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Materials Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <Th>Material Details</Th>
                      <Th>Installation Info</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <LoadingRow />
                    ) : materials.length === 0 ? (
                      <EmptyRow />
                    ) : (
                      materials.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50/50">
                          {/* Material section */}
                          <td className="py-4 px-4 sm:px-6 align-top">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {material.materialId}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                  {material.fittingType || "Unknown type"}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                  {material.depotCode || "No depot"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Installation section */}
                          <td className="py-4 px-4 sm:px-6 align-top">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                {material.depotEntryDate || "Not entered"}
                              </p>
                              {material.tmsTrackId && (
                                <p className="text-xs text-gray-500">
                                  TMS: {material.tmsTrackId}
                                </p>
                              )}
                              {material.gpsLocation && (
                                <p className="text-xs text-gray-500 break-all">
                                  📍 {material.gpsLocation}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 sm:px-6 align-top">
                            <div className="space-y-2">
                              {getStatusBadge(material)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 align-top">
                            <div className="flex flex-wrap gap-2">
                              {/* View details */}
                              <button
                                onClick={() =>
                                  router.push(
                                    `/track/engineer/material?id=${material.id}`
                                  )
                                }
                                className="inline-flex items-center px-3 py-2 bg-[#3A7AFF] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#2A6AEF] transition-colors shadow-sm"
                              >
                                View Details
                                <svg
                                  className="ml-2 w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 5l7 7-7 7M21 12H3"
                                  />
                                </svg>
                              </button>

                              {/* Verify Geo-tag */}
                              {material.installationStatus === "Installed" &&
                                !material.geoTagVerified && (
                                  <button
                                    onClick={() =>
                                      handleVerifyGeoTag(material.id)
                                    }
                                    className="px-3 py-2 text-xs font-medium rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                                  >
                                    Verify Geo Tag
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* -----------------------------
   SMALL HELPER COMPONENTS
----------------------------- */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={4} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#3A7AFF] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading materials...</p>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={4} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center px-4">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 text-sm">No materials found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try changing your filter criteria
          </p>
        </div>
      </td>
    </tr>
  );
}

type CardColor = "blue" | "yellow" | "green" | "red";

interface DashboardCardProps {
  label: string;
  value: number | string;
  color: CardColor;
  iconPath: string;
}

function DashboardCard({ label, value, color, iconPath }: DashboardCardProps) {
  const bgMap: Record<CardColor, string> = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  const bg = bgMap[color];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
        </div>

        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${bg} flex items-center justify-center`}
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={iconPath}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
