"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader"; // 🚆 Train Loader

// --------- TYPES ---------
type Employee = {
  uid: string;
  name?: string;
  empId?: string;
  email?: string;
  companyId?: string;
  companyName?: string;
  role?: string;
};

type Material = {
  id: string;
  materialId?: string;
  fittingType?: string;
  drawingNumber?: string;
  batchNumber?: string;
  manufacturingDate?: string; // YYYY-MM-DD
  manufacturerId?: string;
  createdBy?: string; // employee uid

  // 🔍 failure-related fields (adapt as per your schema)
  failureCount?: number;
  installationStatus?: string; // e.g. "installed" | "fault"
  status?: string; // sometimes people use "fault" here
};

type EmployeeRow = Employee & {
  total: number;
  lastDate: string;
  failures: number;
  failureRate: number; // 0–100
};

// 🔍 Generic failure detector – tweak based on your Firestore schema
function isFailure(m: Material): boolean {
  if (typeof m.failureCount === "number" && m.failureCount > 0) return true;
  if (m.installationStatus === "fault") return true;
  if (m.status === "fault") return true;
  return false;
}

export default function ManufacturerAdminEmployeesPage() {
  const router = useRouter();

  // AUTH STATE: checking | allowed | denied
  const [authStatus, setAuthStatus] =
    useState<"checking" | "allowed" | "denied">("checking");

  // DATA
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters
  const [search, setSearch] = useState("");

  // -----------------------------------------------------------
  // AUTH CHECK
  // -----------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthStatus("denied");
        router.replace("/manufacturer/admin-login");
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      // ✅ Role must match "manufacturer_admin"
      if (snap.exists() && snap.data().role === "manufacturer_admin") {
        setAuthStatus("allowed");
      } else {
        setAuthStatus("denied");
        router.replace("/manufacturer/admin-login");
      }
    });

    return () => unsub();
  }, [router]);

  // -----------------------------------------------------------
  // LOAD EMPLOYEES + MATERIALS (after auth allowed)
  // -----------------------------------------------------------
  useEffect(() => {
    if (authStatus !== "allowed") return;

    async function loadData() {
      setLoadingData(true);

      const empSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "manufacturer"))
      );
      const empList: Employee[] = empSnap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      }));
      setEmployees(empList);

      const matSnap = await getDocs(collection(db, "materials"));
      const matList: Material[] = matSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMaterials(matList);

      setLoadingData(false);
    }

    loadData();
  }, [authStatus]);

  // -----------------------------------------------------------
  // EMPLOYEE STATS + FAILURE STATS
  // -----------------------------------------------------------
  const employeeRows: EmployeeRow[] = employees.map((emp) => {
    const empMats = materials.filter((m) => m.createdBy === emp.uid);

    const lastDate =
      empMats.length > 0
        ? [...empMats]
            .map((m) => m.manufacturingDate || "")
            .filter(Boolean)
            .sort()
            .reverse()[0] || "-"
        : "-";

    const failureMats = empMats.filter((m) => isFailure(m));
    const failures = failureMats.length;

    const failureRate =
      empMats.length > 0 ? (failures / empMats.length) * 100 : 0;

    return {
      ...emp,
      total: empMats.length,
      lastDate,
      failures,
      failureRate: Number(failureRate.toFixed(1)), // e.g. 12.5
    };
  });

  // GLOBAL STATS
  const totalEmployees = employees.length;
  const totalMaterials = materials.length;
  const totalFailures = materials.filter(isFailure).length;
  const overallFailureRate =
    totalMaterials > 0 ? Number(((totalFailures / totalMaterials) * 100).toFixed(1)) : 0;

  // -----------------------------------------------------------
  // FILTER EMPLOYEES
  // -----------------------------------------------------------
  const filtered = employeeRows.filter((e) => {
    const s = search.toLowerCase();
    if (!s) return true;

    return (
      e.name?.toLowerCase().includes(s) ||
      e.empId?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s)
    );
  });

  // -----------------------------------------------------------
  // LOADERS
  // -----------------------------------------------------------
  if (authStatus === "checking") return <AppLoader />; // auth loader
  if (authStatus === "denied") return null; // already redirected
  if (loadingData) return <AppLoader />; // data loader

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      {/* Main layout: column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
        {/* Sidebar: full width on mobile, fixed width on desktop */}
        <div className="w-full md:w-64 md:flex-shrink-0">
          <ManufacturerAdminSidebar />
        </div>

        {/* Main content */}
        <main className="w-full md:ml-64 px-3 sm:px-4 md:px-6 lg:px-10 py-5 md:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#A259FF]">
            Employees – Production & Failures
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mb-5">
            All manufacturer employees with their material counts and failure analysis.
          </p>

          {/* 🔹 GLOBAL SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <SummaryCard
              label="Total Employees"
              value={totalEmployees}
              accent="#A259FF"
            />
            <SummaryCard
              label="Total Materials"
              value={totalMaterials}
              accent="#FF8A00"
            />
            <SummaryCard
              label="Failed Materials"
              value={totalFailures}
              accent="#FF4B4B"
            />
            <SummaryCard
              label="Overall Failure Rate"
              value={`${overallFailureRate}%`}
              accent="#2EC4B6"
            />
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / Emp ID / email"
            className="w-full sm:w-80 mb-4 border px-3 py-2 rounded-xl text-[11px] sm:text-xs outline-none focus:ring-2 focus:ring-[#A259FF]/40 bg-white"
          />

          <div className="bg-white rounded-3xl shadow-lg p-3 sm:p-4 md:p-5">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-[11px] sm:text-xs">
                <thead>
                  <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                    <th className="py-2 px-2 text-left">Name</th>
                    <th className="py-2 px-2 text-left">Emp ID</th>
                    <th className="py-2 px-2 text-left">Email</th>
                    <th className="py-2 px-2 text-left">Total Materials</th>
                    <th className="py-2 px-2 text-left">Failed Materials</th>
                    <th className="py-2 px-2 text-left">Failure Rate</th>
                    <th className="py-2 px-2 text-left">Last Mfg Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((emp) => (
                    <tr
                      key={emp.uid}
                      className="border-t hover:bg-gray-50/60"
                    >
                      <td className="py-2 px-2">{emp.name || "-"}</td>
                      <td className="py-2 px-2">{emp.empId || "-"}</td>
                      <td className="py-2 px-2 break-all">
                        {emp.email || "-"}
                      </td>
                      <td className="py-2 px-2">{emp.total}</td>

                      {/* Failed materials (highlight if > 0) */}
                      <td
                        className={`py-2 px-2 ${
                          emp.failures > 0 ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {emp.failures}
                      </td>

                      {/* Failure rate */}
                      <td
                        className={`py-2 px-2 ${
                          emp.failures > 0 ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {emp.failureRate}%
                      </td>

                      <td className="py-2 px-2">{emp.lastDate}</td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 px-2 text-center text-[10px] sm:text-[11px] text-gray-500"
                      >
                        No employees match this search.
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

/* 🔹 Summary card component for top stats */
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
