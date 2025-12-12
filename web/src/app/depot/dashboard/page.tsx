// src/app/depot/page.tsx (or wherever this lives)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import {
    collection,
    getDocs,
    updateDoc,
    orderBy,
    query,
    doc,
} from "firebase/firestore";

import MainHeader from "@/components/Header";
import DepotSidebar from "@/components/DepotSidebar";

// You can refine this type later as needed
type Material = {
    id: string;
    materialId?: string;
    gpsLocation?: string;
    installationStatus?: string;
    requestStatus?: string;
    faultType?: string;
    [key: string]: any;
};

type FilterType = "all" | "pending_approval" | "installed" | "faults";

export default function DepotDashboard() {
    const router = useRouter();

    const [allMaterials, setAllMaterials] = useState<Material[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    const [stats, setStats] = useState({
        total: 0,
        installed: 0,
        pendingApproval: 0,
        faults: 0,
    });

    // Load all materials
    useEffect(() => {
        loadMaterials();
    }, []);

    async function loadMaterials() {
        setLoading(true);

        try {
            const q = query(collection(db, "materials"), orderBy("materialId"));
            const snap = await getDocs(q);

            const data: Material[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Material, "id">),
            }));

            setAllMaterials(data);
        } catch (err) {
            console.error("LOAD ERROR:", err);
        } finally {
            setLoading(false);
        }
    }

    // Recompute stats + filtered list when data or filter changes
    useEffect(() => {
        computeStats(allMaterials);
        filterMaterials(allMaterials, filter);
    }, [allMaterials, filter]);

    function computeStats(arr: Material[]) {
        setStats({
            total: arr.length,
            installed: arr.filter((m) => m.installationStatus === "Installed").length,
            pendingApproval: arr.filter((m) => m.requestStatus === "pending").length,
            faults: arr.filter((m) => m.faultType).length,
        });
    }

    function filterMaterials(data: Material[], f: FilterType) {
        let out = data;

        if (f === "pending_approval") {
            out = data.filter((m) => m.requestStatus === "pending");
        } else if (f === "installed") {
            out = data.filter((m) => m.installationStatus === "Installed");
        } else if (f === "faults") {
            out = data.filter((m) => m.faultType);
        }

        setMaterials(out);
    }

    async function approveRequest(id: string) {
        try {
            await updateDoc(doc(db, "materials", id), {
                requestStatus: "approved",
                officerApprovalDate: new Date().toISOString(),
            });

            alert("Request Approved");
            loadMaterials();
        } catch (e: any) {
            alert(e.message);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
            <MainHeader />

            {/* Layout: sidebar + main, stacked on mobile */}
            <div className="flex flex-col lg:flex-row pt-[90px]">
                <DepotSidebar />

                <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 pb-10">
                    <div className="max-w-6xl mx-auto">

                        {/* PAGE TITLE */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4B3A7A]">
                            Depot Officer Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                            Approve engineer verification requests & monitor installation activity.
                        </p>

                        {/* STATS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                            <Stat label="Total Materials" value={stats.total} color="blue" />
                            <Stat label="Installed" value={stats.installed} color="green" />
                            <Stat label="Pending Approval" value={stats.pendingApproval} color="yellow" />
                            <Stat label="Fault Cases" value={stats.faults} color="red" />
                        </div>

                        {/* FILTER TABS */}
                        <div className="flex flex-wrap gap-2 mt-8 mb-6">
                            {[
                                { id: "all", name: "All" },
                                { id: "pending_approval", name: "Pending Approval" },
                                { id: "installed", name: "Installed" },
                                { id: "faults", name: "Fault Cases" },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all ${
                                        filter === t.id
                                            ? "bg-[#A259FF] text-white shadow"
                                            : "bg-white text-gray-600 border border-gray-300"
                                    }`}
                                    onClick={() => setFilter(t.id as FilterType)}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>

                        {/* MAIN TABLE (scrollable on mobile) */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs sm:text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <Th>Material</Th>
                                            <Th>Installation</Th>
                                            <Th>Engineer Status</Th>
                                            <Th>Actions</Th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loading ? (
                                            <LoadingRow />
                                        ) : materials.length === 0 ? (
                                            <EmptyRow />
                                        ) : (
                                            materials.map((m) => (
                                                <tr
                                                    key={m.id}
                                                    className="border-b hover:bg-gray-50 transition"
                                                >
                                                    <td className="p-3 sm:p-4 font-semibold text-gray-800 whitespace-nowrap">
                                                        {m.materialId}
                                                    </td>

                                                    <td className="p-3 sm:p-4">
                                                        <p className="truncate max-w-[180px] sm:max-w-xs">
                                                            {m.gpsLocation || "—"}
                                                        </p>
                                                        <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                                                            {m.installationStatus || "Not Installed"}
                                                        </p>
                                                    </td>

                                                    <td className="p-3 sm:p-4">
                                                        {m.requestStatus === "pending" ? (
                                                            <span className="px-2 py-1 text-[11px] sm:text-xs rounded bg-yellow-200 text-yellow-900">
                                                                Pending Officer Review
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-[11px] sm:text-xs rounded bg-green-100 text-green-800">
                                                                {m.requestStatus || "No Request"}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="p-3 sm:p-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    router.push(`/depot/material?id=${m.id}`)
                                                                }
                                                                className="px-3 py-1 text-xs sm:text-sm bg-blue-500 text-white rounded-lg"
                                                            >
                                                                View
                                                            </button>

                                                            {m.requestStatus === "pending" && (
                                                                <button
                                                                    onClick={() => approveRequest(m.id)}
                                                                    className="px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded-lg"
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

/* ====================== REUSABLE COMPONENTS ====================== */

function Stat({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: "blue" | "green" | "yellow" | "red";
}) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        yellow: "text-yellow-600 bg-yellow-50",
        red: "text-red-600 bg-red-50",
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow border flex justify-between items-center">
            <div>
                <p className="text-xs sm:text-sm text-gray-600">{label}</p>
                <p className="text-xl sm:text-2xl font-bold">{value}</p>
            </div>

            <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl ${colorMap[color]}`}
            >
                ●
            </div>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th className="p-3 sm:p-4 text-left text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
            {children}
        </th>
    );
}

function LoadingRow() {
    return (
        <tr>
            <td colSpan={4} className="text-center p-6">
                <div className="flex flex-col items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">Loading…</p>
                </div>
            </td>
        </tr>
    );
}

function EmptyRow() {
    return (
        <tr>
            <td colSpan={4} className="text-center p-6 text-xs sm:text-sm text-gray-500">
                No data found.
            </td>
        </tr>
    );
}
