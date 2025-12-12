"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
} from "firebase/firestore";
import { db, auth } from "@/shared/firebaseConfig";

import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";

type Material = {
    materialId: string;        // 7-char ID
    manufacturerId: string;    // 7-char manufacturer ID
    manufacturerName: string;

    fittingType: string;
    drawingNumber: string;
    materialSpec: string;
    weightKg: string;
    boardGauge: string;
    manufacturingDate: string;
    expectedLifeYears: string;

    purchaseOrderNumber: string;
    batchNumber: string;
    depotCode: string;
    depotEntryDate: string;
    udmLotNumber: string;
    inspectionOfficer: string;

    tmsTrackId: string;
    gpsLocation: string;
    installationStatus: string;
    dispatchDate: string;
    warrantyExpiry: string;
    failureCount: string;
    lastMaintenanceDate: string;

    createdAt?: any;
};

// Same logic as in AddMaterialPage – force 7-char manufacturer ID from auth.uid
function getManufacturerId7(): string {
    const raw = auth.currentUser?.uid || "DEMOUSER";
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return cleaned.slice(0, 7).padEnd(7, "X");
}

export default function ManufacturerMaterialsDashboard() {
    const router = useRouter();

    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "installed" | "not_installed"
    >("all");

    // --- LOAD MATERIALS FOR THIS MANUFACTURER ---
    useEffect(() => {
        setLoading(true);
        setError(null);

        const manufacturerId = getManufacturerId7();

        const q = query(
            collection(db, "materials"),
            where("manufacturerId", "==", manufacturerId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Material[] = [];
                snap.forEach((doc) => {
                    const data = doc.data() as Material;
                    list.push(data);
                });
                setMaterials(list);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError("Failed to load materials");
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    // --- FILTERING / SEARCH ---
    const filteredMaterials = useMemo(() => {
        const term = search.trim().toLowerCase();

        return materials.filter((m) => {
            // status filter
            if (
                statusFilter === "installed" &&
                m.installationStatus.toLowerCase() !== "installed"
            ) {
                return false;
            }
            if (
                statusFilter === "not_installed" &&
                m.installationStatus.toLowerCase() === "installed"
            ) {
                return false;
            }

            if (!term) return true;

            // simple OR search over key fields
            const haystack = [
                m.materialId,
                m.fittingType,
                m.depotCode,
                m.batchNumber,
                m.udmLotNumber,
                m.drawingNumber,
                m.purchaseOrderNumber,
                m.tmsTrackId,
                m.installationStatus,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [materials, search, statusFilter]);

    // --- DOWNLOAD CSV REPORT ---
    function downloadCsvReport() {
        if (!filteredMaterials.length) return;

        const headers = [
            "Material ID",
            "Fitting Type",
            "Drawing Number",
            "Material Spec",
            "Depot Code",
            "Batch Number",
            "UDM Lot",
            "PO Number",
            "Manufacturing Date",
            "Expected Life (years)",
            "Installation Status",
            "TMS Track ID",
            "GPS Location",
            "Failure Count",
            "Last Maintenance Date",
            "Warranty Expiry",
            "Depot Entry Date",
        ];

        const rows = filteredMaterials.map((m) => [
            m.materialId || "",
            m.fittingType || "",
            m.drawingNumber || "",
            m.materialSpec || "",
            m.depotCode || "",
            m.batchNumber || "",
            m.udmLotNumber || "",
            m.purchaseOrderNumber || "",
            m.manufacturingDate || "",
            m.expectedLifeYears || "",
            m.installationStatus || "",
            m.tmsTrackId || "",
            m.gpsLocation || "",
            m.failureCount || "",
            m.lastMaintenanceDate || "",
            m.warrantyExpiry || "",
            m.depotEntryDate || "",
        ]);

        const csvLines = [
            headers.join(","),
            ...rows.map((row) =>
                row
                    .map((cell) => {
                        const safe = (cell ?? "").toString().replace(/"/g, '""');
                        return `"${safe}"`;
                    })
                    .join(",")
            ),
        ];

        const csv = csvLines.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `materials_report_${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function openDetails(materialId: string) {
        // Adjust this route if your details path is different
        router.push(`/material/${materialId}`);
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Layout: column on mobile, row on desktop */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-1">
                                Materials Dashboard
                            </h1>
                            <p className="text-[11px] sm:text-xs text-gray-600">
                                View all materials produced by your unit, search by ID or depot,
                                and download reports.
                            </p>
                        </div>

                        <button
                            onClick={downloadCsvReport}
                            disabled={!filteredMaterials.length}
                            className="self-start sm:self-auto px-4 py-2 rounded-xl 
             bg-[#D8B4F8] hover:bg-[#C89AEF] 
             text-[#4B3A7A] text-xs font-semibold 
             shadow 
             disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Download CSV Report
                        </button>

                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-3xl shadow-md p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
                        <div className="flex-1">
                            <label className="block text-[11px] text-gray-600 mb-1">
                                Search (Material ID, Depot, Lot, Drawing, TMS…)
                            </label>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="e.g., BNC0512, SBC, ERC, TMS123…"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[11px] text-gray-600 mb-1">
                                Installation Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as
                                        | "all"
                                        | "installed"
                                        | "not_installed"
                                    )
                                }
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                            >
                                <option value="all">All</option>
                                <option value="installed">Installed only</option>
                                <option value="not_installed">Not installed only</option>
                            </select>
                        </div>

                        <div className="text-[11px] text-gray-500 md:w-[140px]">
                            <p>
                                Total Materials:{" "}
                                <span className="font-semibold text-[#4B3A7A]">
                                    {materials.length}
                                </span>
                            </p>
                            <p>
                                Showing:{" "}
                                <span className="font-semibold text-[#4B3A7A]">
                                    {filteredMaterials.length}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead className="bg-[#F7E8FF] text-[#4B3A7A]">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Material ID
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Fitting Type
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Drawing
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Depot
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Lot / Batch
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Install Status
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            TMS Track ID
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                            Failures
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-3 py-6 text-center text-gray-500"
                                            >
                                                Loading materials…
                                            </td>
                                        </tr>
                                    )}

                                    {error && !loading && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-3 py-6 text-center text-red-500"
                                            >
                                                {error}
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        !error &&
                                        filteredMaterials.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="px-3 py-6 text-center text-gray-500"
                                                >
                                                    No materials found for the selected filters.
                                                </td>
                                            </tr>
                                        )}

                                    {!loading &&
                                        !error &&
                                        filteredMaterials.map((m) => {
                                            const status =
                                                (m.installationStatus || "").toLowerCase();
                                            const statusColor =
                                                status === "installed"
                                                    ? "bg-green-100 text-green-700"
                                                    : status === "not installed" ||
                                                        status === "not_installed"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-gray-100 text-gray-600";

                                            return (
                                                <tr
                                                    key={m.materialId}
                                                    className="border-t border-gray-100 hover:bg-[#F7E8FF]/30 transition-colors"
                                                >
                                                    <td className="px-3 py-2 font-mono text-[11px] text-[#4B3A7A]">
                                                        {m.materialId}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {m.fittingType || "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {m.drawingNumber || "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {m.depotCode || "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {m.udmLotNumber ||
                                                            m.batchNumber ||
                                                            "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusColor}`}
                                                        >
                                                            {m.installationStatus || "Unknown"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {m.tmsTrackId || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {m.failureCount || "0"}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            onClick={() => openDetails(m.materialId)}
                                                            className="px-3 py-1 rounded-xl 
             bg-[#D8B4F8] hover:bg-[#C89AEF] 
             text-[#4B3A7A] text-[11px] font-semibold 
             shadow transition"
                                                        >
                                                            View
                                                        </button>

                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
