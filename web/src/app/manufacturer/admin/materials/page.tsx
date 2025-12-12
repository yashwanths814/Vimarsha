"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader"; // ✅ Train Loader

// 📊 Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---------- TYPES ----------
type Material = {
  id: string;
  materialId?: string;
  fittingType?: string;
  drawingNumber?: string;
  batchNumber?: string;
  purchaseOrderNumber?: string;
  manufacturingDate?: string; // YYYY-MM-DD
  manufacturerId?: string;
  [key: string]: any;
};

const PIE_COLORS = ["#A259FF", "#FF9F1C", "#2EC4B6", "#FF6B6B"];

export default function AdminMaterialsPage() {
  const router = useRouter();

  // --- AUTH STATE ---
  const [authStatus, setAuthStatus] =
    useState<"checking" | "allowed" | "denied">("checking");

  // --- DATA STATE ---
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filterType, setFilterType] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // ============================
  // AUTH CHECK
  // ============================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthStatus("denied");
        router.replace("/manufacturer/admin-login");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      // ✅ use "manufacturer_admin" (with underscore)
      if (snap.exists() && snap.data().role === "manufacturer_admin") {
        setAuthStatus("allowed");
      } else {
        setAuthStatus("denied");
        router.replace("/manufacturer/admin-login");
      }
    });

    return () => unsub();
  }, [router]);

  // ============================
  // LOAD MATERIALS (after allowed)
  // ============================
  useEffect(() => {
    if (authStatus !== "allowed") return;

    async function loadData() {
      setLoadingData(true);

      const snap = await getDocs(collection(db, "materials"));
      setMaterials(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );

      setLoadingData(false);
    }

    loadData();
  }, [authStatus]);

  // ============================
  // FILTERED DATA
  // ============================
  const filteredMaterials = useMemo(
    () =>
      materials.filter((m) =>
        filterType ? m.fittingType === filterType : true
      ),
    [materials, filterType]
  );

  // ============================
  // ANALYTICS DATA
  // ============================

  // Summary stats
  const totalMaterials = materials.length;
  const totalFiltered = filteredMaterials.length;

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    materials.forEach((m) => {
      const key = m.fittingType || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [materials]);

  const filteredTypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMaterials.forEach((m) => {
      const key = m.fittingType || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [filteredMaterials]);

  // Pie chart: type distribution (on filtered data)
  const pieData = useMemo(
    () =>
      Object.entries(filteredTypeCounts).map(([name, value]) => ({
        name,
        value,
      })),
    [filteredTypeCounts]
  );

  // Bar chart: materials per manufacturer (filtered)
  const manufacturerCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMaterials.forEach((m) => {
      const key = m.manufacturerId || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([manufacturerId, count]) => ({
      manufacturerId,
      count,
    }));
  }, [filteredMaterials]);

  // Line chart: monthly production trend (filtered)
  const monthlySeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    filteredMaterials.forEach((m) => {
      if (!m.manufacturingDate) return;
      const month = m.manufacturingDate.slice(0, 7); // YYYY-MM
      buckets[month] = (buckets[month] || 0) + 1;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [filteredMaterials]);

  // ============================
  // EXPORT REPORT (CSV)
  // ============================
  function handleExportCSV() {
    if (filteredMaterials.length === 0) {
      alert("No materials in current filter to export.");
      return;
    }

    const header = [
      "Material ID",
      "Type",
      "Drawing Number",
      "Batch",
      "Purchase Order",
      "Manufacturing Date",
      "Manufacturer ID",
    ];

    const rows = filteredMaterials.map((m) => [
      m.materialId || "",
      m.fittingType || "",
      m.drawingNumber || "",
      m.batchNumber || "",
      m.purchaseOrderNumber || "",
      m.manufacturingDate || "",
      m.manufacturerId || "",
    ]);

    const csvContent =
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "materials_report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  // ============================
  // LOADING & ACCESS STATES
  // ============================

  if (authStatus === "checking") return <AppLoader />;
  if (authStatus === "denied") return null;
  if (loadingData) return <AppLoader />;

  // ============================
  // PAGE CONTENT
  // ============================
  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      {/* Layout: stacked on mobile, sidebar + main on md+ */}
      <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
        {/* Sidebar: full width on mobile, fixed width on desktop */}
        <div className="w-full md:w-64 md:flex-shrink-0">
          <ManufacturerAdminSidebar />
        </div>

        {/* Main content */}
        <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-2">
            All Materials – Admin View
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            View and analyse materials manufactured across companies.
          </p>

          {/* 🔹 TOP SUMMARY + FILTER + EXPORT */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end mb-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
              <SummaryCard
                label="Total Materials"
                value={totalMaterials}
                accent="#A259FF"
              />
              <SummaryCard
                label="Current Filter Count"
                value={totalFiltered}
                accent="#2EC4B6"
              />
              <SummaryCard
                label="Unique Types"
                value={Object.keys(typeCounts).length}
                accent="#FF9F1C"
              />
            </div>

            {/* Filter + Export */}
            <div className="space-y-2 lg:w-80">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">
                  Filter by Material Type
                </label>
                <select
                  className="w-full border px-3 py-2 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                  <option value="Rail Pad">Rail Pad</option>
                  <option value="Liner">Liner</option>
                  <option value="Sleeper">Sleeper</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-2 rounded-xl 
             bg-[#D8B4F8] hover:bg-[#C89AEF] 
             text-[#4B3A7A] text-xs sm:text-sm font-semibold 
             transition shadow"
              >
                ⬇️ Export Filtered Materials (CSV)
              </button>

            </div>
          </div>

          {/* 🔹 ANALYTICS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Pie: Type distribution */}
            <div className="bg-white rounded-3xl shadow-md p-3 sm:p-4">
              <h2 className="text-[12px] sm:text-sm font-semibold text-[#6B4FA3] mb-2">
                Type Distribution (Filtered)
              </h2>
              {pieData.length === 0 ? (
                <p className="text-[11px] text-gray-500">
                  No data available for current filter.
                </p>
              ) : (
                <div className="w-full h-52 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bar: Materials per manufacturer */}
            <div className="bg-white rounded-3xl shadow-md p-3 sm:p-4">
              <h2 className="text-[12px] sm:text-sm font-semibold text-[#6B4FA3] mb-2">
                Materials per Manufacturer (Filtered)
              </h2>
              {manufacturerCounts.length === 0 ? (
                <p className="text-[11px] text-gray-500">
                  No manufacturers in current filter.
                </p>
              ) : (
                <div className="w-full h-52 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={manufacturerCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="manufacturerId"
                        fontSize={10}
                        tickFormatter={(value) =>
                          value.length > 8 ? value.slice(0, 8) + "…" : value
                        }
                      />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#A259FF"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Line: Monthly production */}
            <div className="bg-white rounded-3xl shadow-md p-3 sm:p-4">
              <h2 className="text-[12px] sm:text-sm font-semibold text-[#6B4FA3] mb-2">
                Monthly Production (Filtered)
              </h2>
              {monthlySeries.length === 0 ? (
                <p className="text-[11px] text-gray-500">
                  No manufacturing dates available for this filter.
                </p>
              ) : (
                <div className="w-full h-52 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#FF8A00"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* 🔹 TABLE */}
          <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-5">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                    <th className="py-2 px-2 text-left">Material ID</th>
                    <th className="py-2 px-2 text-left">Type</th>
                    <th className="py-2 px-2 text-left">Drawing</th>
                    <th className="py-2 px-2 text-left">Batch</th>
                    <th className="py-2 px-2 text-left">PO No</th>
                    <th className="py-2 px-2 text-left">Mfg Date</th>
                    <th className="py-2 px-2 text-left">Manufacturer</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMaterials.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t hover:bg-gray-50/60"
                    >
                      <td className="py-2 px-2 font-mono text-[11px] break-all">
                        {m.materialId || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.fittingType || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.drawingNumber || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.batchNumber || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.purchaseOrderNumber || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.manufacturingDate || "—"}
                      </td>
                      <td className="py-2 px-2">
                        {m.manufacturerId || "—"}
                      </td>
                    </tr>
                  ))}

                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 px-2 text-center text-[11px] text-gray-500"
                      >
                        No materials found for this filter.
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

/* 🔹 Summary Card */
function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-md px-3 sm:px-4 py-3 sm:py-4 flex flex-col justify-center"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <p className="text-[10px] sm:text-[11px] text-gray-500 mb-1">{label}</p>
      <p className="text-lg sm:text-xl md:text-2xl font-bold">{value}</p>
    </div>
  );
}
