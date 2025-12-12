"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  updateDoc,
  orderBy,
  query,
  doc,
} from "firebase/firestore";

import { db } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";
import DepotSidebar from "@/components/DepotSidebar";

type EngineerRequest = {
  submittedAt?: string;
  faultStatus?: string;
  engineerRemarks?: string;
  engineerRootCause?: string;
};

type RequestMaterial = {
  id: string;
  materialId?: string;
  fittingType?: string;
  depotCode?: string;
  engineerRequest?: EngineerRequest;
  requestStatus?: "pending" | "approved" | "rejected" | string;
};

type FilterType = "all" | "pending" | "approved";

export default function DepotRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);

      const q = query(collection(db, "materials"), orderBy("materialId"));
      const snap = await getDocs(q);

      const data: RequestMaterial[] = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RequestMaterial, "id">),
        }))
        .filter((m) => m.engineerRequest); // only where engineerRequest exists

      setRequests(data);
    } catch (err) {
      console.error("LOAD REQUESTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  function filteredRequests() {
    if (filter === "pending") {
      return requests.filter((r) => r.requestStatus === "pending");
    }
    if (filter === "approved") {
      return requests.filter((r) => r.requestStatus === "approved");
    }
    return requests;
  }

  async function approveRequest(id: string) {
    try {
      await updateDoc(doc(db, "materials", id), {
        requestStatus: "approved",
        officerApprovalDate: new Date().toISOString(),
      });

      setRequests((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, requestStatus: "approved" } : m
        )
      );
      alert("Request approved successfully.");
    } catch (e: any) {
      console.error("APPROVE ERROR:", e);
      alert(e.message);
    }
  }

  const visible = filteredRequests();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex flex-col lg:flex-row pt-[90px]">
        <DepotSidebar />

        <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 pb-10">
          <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A]">
                  Engineer Requests
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  View and approve verification requests submitted by engineers.
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All Requests" },
                { id: "pending", label: "Pending" },
                { id: "approved", label: "Approved" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as FilterType)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all
                    ${
                      filter === tab.id
                        ? "bg-[#A259FF] text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table (scrollable on mobile) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <Th>Material</Th>
                      <Th>Engineer Request</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <LoadingRow />
                    ) : visible.length === 0 ? (
                      <EmptyRow />
                    ) : (
                      visible.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-gray-50">
                          {/* Material */}
                          <td className="p-3 sm:p-4 align-top whitespace-nowrap">
                            <p className="font-semibold text-gray-900">
                              {m.materialId}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                              {m.fittingType || "—"}
                            </p>
                            <p className="text-[11px] sm:text-xs text-gray-400">
                              Depot: {m.depotCode || "—"}
                            </p>
                          </td>

                          {/* Engineer request summary */}
                          <td className="p-3 sm:p-4 align-top">
                            <div className="space-y-1.5">
                              <p className="text-[11px] sm:text-xs text-gray-500">
                                Submitted:{" "}
                                {m.engineerRequest?.submittedAt
                                  ? new Date(
                                      m.engineerRequest.submittedAt
                                    ).toLocaleString()
                                  : "—"}
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-500">
                                Fault Status:{" "}
                                <span className="font-medium">
                                  {m.engineerRequest?.faultStatus || "—"}
                                </span>
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2">
                                Remarks:{" "}
                                {m.engineerRequest?.engineerRemarks || "—"}
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2">
                                Root Cause:{" "}
                                {m.engineerRequest?.engineerRootCause || "—"}
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3 sm:p-4 align-top">
                            {m.requestStatus === "pending" && (
                              <span className="inline-flex px-2 py-1 text-[11px] sm:text-xs rounded-full bg-yellow-100 text-yellow-800">
                                Pending Officer Review
                              </span>
                            )}
                            {m.requestStatus === "approved" && (
                              <span className="inline-flex px-2 py-1 text-[11px] sm:text-xs rounded-full bg-green-100 text-green-800">
                                Approved
                              </span>
                            )}
                            {!m.requestStatus && (
                              <span className="inline-flex px-2 py-1 text-[11px] sm:text-xs rounded-full bg-gray-100 text-gray-700">
                                No Status
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 sm:p-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  router.push(`/depot/material?id=${m.id}`)
                                }
                                className="px-3 py-1.5 bg-[#3A7AFF] text-white text-[11px] sm:text-xs font-medium rounded-lg hover:bg-[#2A6AEF] transition-colors"
                              >
                                View Full Details
                              </button>

                              {m.requestStatus === "pending" && (
                                <button
                                  onClick={() => approveRequest(m.id)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-[11px] sm:text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Approve
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

/* Small helpers */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-3 sm:p-4 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

function LoadingRow() {
  return (
    <tr>
      <td colSpan={4} className="text-center p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs sm:text-sm text-gray-500">Loading requests...</p>
        </div>
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={4} className="text-center p-8">
        <p className="text-xs sm:text-sm text-gray-500">
          No engineer requests found.
        </p>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
          Once engineers submit verification requests, they will appear here.
        </p>
      </td>
    </tr>
  );
}
