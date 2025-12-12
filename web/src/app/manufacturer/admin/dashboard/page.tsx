"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/shared/firebaseConfig";

import MainHeader from "@/components/Header";
import ManufacturerAdminSidebar from "@/components/ManufacturerAdminSidebar";
import AppLoader from "@/components/AppLoader";

// Recharts
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

// 📄 PDF
import jsPDF from "jspdf";

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
  manufacturerId?: string; // companyId
  createdBy?: string; // employee uid
};

type CompanyGroup = {
  companyId: string;
  companyName: string;
  employees: Employee[];
  materials: Material[];
};

type EfficiencyRow = { name: string; count: number };

const PIE_COLORS = ["#A259FF", "#FF9F1C", "#2EC4B6", "#FF6B6B"];

/* ============================================================
    🔹 LOGO LOADER (SAME AS MATERIAL PDF)
============================================================ */

const logoCache: Record<string, string> = {};

async function loadImageAsBase64(src: string): Promise<string> {
  if (logoCache[src]) return logoCache[src];

  const res = await fetch(src);
  const blob = await res.blob();

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      logoCache[src] = base64;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export default function ManufacturerAdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [materialTypeFilter, setMaterialTypeFilter] = useState("");

  // ---------------- LOAD DATA (CLIENT ONLY) ----------------
  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingData(true);

        const empSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "manufacturer"))
        );
        setEmployees(
          empSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }))
        );

        const matSnap = await getDocs(collection(db, "materials"));
        setMaterials(
          matSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadAll();
  }, []);

  // ---------------- GROUP BY COMPANY ----------------
  const companies: CompanyGroup[] = useMemo(() => {
    const groups = new Map<string, CompanyGroup>();

    employees.forEach((emp) => {
      const cid = emp.companyId || "UNKNOWN";
      if (!groups.has(cid)) {
        groups.set(cid, {
          companyId: cid,
          companyName: emp.companyName || cid,
          employees: [],
          materials: [],
        });
      }
      groups.get(cid)!.employees.push(emp);
    });

    materials.forEach((mat) => {
      const cid = mat.manufacturerId || "UNKNOWN";
      const g = groups.get(cid);
      if (g) g.materials.push(mat);
    });

    return [...groups.values()].sort((a, b) =>
      a.companyName.localeCompare(b.companyName)
    );
  }, [employees, materials]);

  // ---------------- FILTER HELPERS ----------------
  function matchesDateRange(dateStr?: string) {
    if (!dateStr) return false;
    const d = new Date(dateStr);

    if (fromDate) {
      const f = new Date(fromDate);
      if (d < f) return false;
    }
    if (toDate) {
      const t = new Date(toDate);
      t.setHours(23, 59, 59, 999);
      if (d > t) return false;
    }
    return true;
  }

  function toggleCompany(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ---------------- REPORT GENERATION (PDF) ----------------
  async function generateCompanyReport(
    company: CompanyGroup,
    filteredMaterials: Material[],
    employeeEfficiency: EfficiencyRow[]
  ) {
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 40;
    const bottomMargin = 60;
    let y = 40;

    // LOGOS (same as material PDF)
    const [g20Logo, railwayLogo, tourismLogo] = await Promise.all([
      loadImageAsBase64("/g20.png"),
      loadImageAsBase64("/railway.png"),
      loadImageAsBase64("/tourism.png"),
    ]);

    // Border
    const drawBorder = () => {
      pdf.setDrawColor(50);
      pdf.setLineWidth(1.2);
      pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
    };

    drawBorder();

    const logoSize = 60;
    pdf.addImage(g20Logo, "PNG", 60, y, logoSize, logoSize);
    pdf.addImage(
      railwayLogo,
      "PNG",
      pageWidth / 2 - logoSize / 2,
      y,
      logoSize,
      logoSize
    );
    pdf.addImage(
      tourismLogo,
      "PNG",
      pageWidth - 60 - logoSize,
      y,
      logoSize,
      logoSize
    );
    y += 80;

    // TITLE (header style same as material PDF, but company report text)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(
      "INDIAN RAILWAYS – MANUFACTURER COMPANY REPORT",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 25;

    pdf.setFontSize(12);
    pdf.text(
      "Vimarsha – Track Fittings Digital Ecosystem",
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 20;

    pdf.setDrawColor(180);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 20;

    // --------- helpers ----------
    const ensureSpace = (neededHeight = 40) => {
      if (y > pageHeight - bottomMargin - neededHeight) {
        pdf.addPage();
        drawBorder();
        y = 40;
      }
    };

    const sectionHeader = (title: string) => {
      ensureSpace(60);
      y += 5;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(title, marginX, y);
      y += 8;
      pdf.setDrawColor(80);
      pdf.setLineWidth(0.6);
      pdf.line(marginX, y, pageWidth - marginX, y);
      y += 12;
    };

    const writeLine = (label: string, value: any) => {
      const safeValue =
        value === undefined || value === null || value === ""
          ? "—"
          : String(value);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      const content = pdf.splitTextToSize(
        safeValue,
        pageWidth - (marginX + 160)
      );
      const lineHeight = 14;
      const blockHeight = Math.max(18, content.length * lineHeight);

      ensureSpace(blockHeight + 10);

      pdf.text(label, marginX, y);
      pdf.text(": ", marginX + 120, y);
      pdf.text(content, marginX + 140, y);

      y += blockHeight;
    };

    const tableHeader = (cols: { label: string; width: number }[]) => {
      ensureSpace(30);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);

      let x = marginX;
      cols.forEach((c) => {
        pdf.text(c.label, x, y);
        x += c.width;
      });

      y += 16;
      pdf.setDrawColor(220);
      pdf.setLineWidth(0.5);
      pdf.line(marginX, y - 10, pageWidth - marginX, y - 10);
    };

    const tableRow = (values: string[], widths: number[]) => {
      const lineHeight = 14;
      ensureSpace(lineHeight + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      let x = marginX;
      values.forEach((val, idx) => {
        const safe = val && val.trim() !== "" ? val : "—";
        const maxWidth = widths[idx] - 4;
        const text = pdf.splitTextToSize(safe, maxWidth);
        pdf.text(text, x, y);
        x += widths[idx];
      });

      y += lineHeight;
    };

    // --------- SECTION 1 – Company Overview ----------
    const totalEmployees = company.employees.length;
    const totalMaterials = company.materials.length;
    const filteredCount = filteredMaterials.length;

    sectionHeader("1. Company Overview");
    writeLine("Company Name", company.companyName);
    writeLine("Company ID", company.companyId);
    writeLine("Total Employees (All Time)", totalEmployees);
    writeLine("Total Materials (All Time)", totalMaterials);
    writeLine("Materials in This Filtered Report", filteredCount);
    writeLine("Report Generated On", new Date().toLocaleString());

    // --------- SECTION 2 – Employee Efficiency ----------
    sectionHeader("2. Employee Efficiency (Filtered)");

    if (employeeEfficiency.length === 0) {
      writeLine(
        "Summary",
        "No employee work found for the selected filters."
      );
    } else {
      const empCols = [
        { label: "Employee Name / ID", width: 260 },
        { label: "Material Count", width: 130 },
      ];

      tableHeader(empCols);

      employeeEfficiency.forEach((row) => {
        tableRow(
          [row.name.substring(0, 45), String(row.count)],
          empCols.map((c) => c.width)
        );
      });
    }

    // --------- SECTION 3 – Materials ----------
    sectionHeader("3. Materials List (Filtered)");

    if (filteredMaterials.length === 0) {
      writeLine(
        "Summary",
        "No materials match the current filters for this company."
      );
    } else {
      const matCols = [
        { label: "Material ID", width: 150 },
        { label: "Type", width: 110 },
        { label: "Batch", width: 90 },
        { label: "Mfg Date", width: 90 },
        { label: "Created By", width: 120 },
      ];

      tableHeader(matCols);

      filteredMaterials.forEach((m) => {
        const emp = company.employees.find((e) => e.uid === m.createdBy);
        const createdBy =
          (emp && (emp.name || emp.empId || emp.email)) || "Unknown";

        tableRow(
          [
            (m.materialId || "-").substring(0, 20),
            (m.fittingType || "-").substring(0, 18),
            (m.batchNumber || "-").substring(0, 12),
            m.manufacturingDate || "-",
            String(createdBy).substring(0, 20),
          ],
          matCols.map((c) => c.width)
        );
      });
    }

    // FOOTER
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.text(
      "This document is system-generated by Vimarsha and valid for official Indian Railways use.",
      pageWidth / 2,
      pageHeight - 40,
      { align: "center" }
    );

    const fileName = `vimarsha_company_report_${company.companyId}.pdf`;
    pdf.save(fileName);
  }

  // ---------------- LOADER ----------------
  if (loadingData) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF]">
      <MainHeader />

      <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
        <div className="w-full md:w-64 md:flex-shrink-0">
          <ManufacturerAdminSidebar />
        </div>

        <main className="w-full md:ml-64 px-3 sm:px-4 md:px-6 lg:px-10 py-4 md:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#A259FF] mb-2">
            Admin Dashboard — Companies Overview
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mb-5">
            Track manufacturer companies, production, and employee efficiency.
          </p>

          {/* Filters */}
          <div className="bg-white rounded-3xl shadow-md p-3 sm:p-4 mb-5 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="w-full md:w-auto">
              <label className="block text-[10px] sm:text-[11px] text-gray-500 mb-1">
                From Manufacturing Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full md:w-auto text-[11px] sm:text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-[10px] sm:text-[11px] text-gray-500 mb-1">
                To Manufacturing Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full md:w-auto text-[11px] sm:text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
              />
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-[10px] sm:text-[11px] text-gray-500 mb-1">
                Material Type
              </label>
              <select
                value={materialTypeFilter}
                onChange={(e) => setMaterialTypeFilter(e.target.value)}
                className="w-full md:w-auto text-[11px] sm:text-xs px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40 bg-white"
              >
                <option value="">All Types</option>
                <option value="Elastic Rail Clip">Elastic Rail Clip</option>
                <option value="Rail Pad">Rail Pad</option>
                <option value="Liner">Liner</option>
                <option value="Sleeper">Sleeper</option>
              </select>
            </div>

            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setMaterialTypeFilter("");
              }}
              className="text-[11px] sm:text-xs px-4 py-2 rounded-xl 
             bg-[#D8B4F8] hover:bg-[#C89AEF] 
             text-[#4B3A7A] font-semibold 
             transition mt-1 md:mt-0 shadow"
            >
              Clear Filters
            </button>
          </div>

          {companies.length === 0 && (
            <p className="text-sm text-gray-500">
              No manufacturer companies found.
            </p>
          )}

          {companies.map((company) => {
            const filteredMaterials = company.materials.filter((m) => {
              if (!m.manufacturingDate) return false;

              if (fromDate || toDate) {
                if (!matchesDateRange(m.manufacturingDate)) return false;
              }

              if (materialTypeFilter && m.fittingType !== materialTypeFilter)
                return false;

              return true;
            });

            const totalEmployees = company.employees.length;
            const totalMaterials = company.materials.length;

            const now = new Date();
            const ymPrefix = `${now.getFullYear()}-${String(
              now.getMonth() + 1
            ).padStart(2, "0")}`;

            const totalThisMonth = company.materials.filter((m) =>
              m.manufacturingDate?.startsWith(ymPrefix)
            ).length;

            const isOpen = expanded[company.companyId] ?? false;

            const monthlySeries = buildMonthlySeries(filteredMaterials);
            const pieData = buildTypeDistribution(filteredMaterials);
            const employeeEfficiency = buildEmployeeEfficiency(
              company.employees,
              filteredMaterials
            );

            return (
              <div
                key={company.companyId}
                className="bg-white rounded-3xl shadow-xl p-3 sm:p-4 md:p-6 mb-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#6B4FA3]">
                      {company.companyName}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">
                      Company ID:{" "}
                      <span className="font-mono break-all">
                        {company.companyId}
                      </span>
                    </p>

                    {(fromDate || toDate || materialTypeFilter) && (
                      <p className="text-[9px] sm:text-[10px] text-emerald-600 mt-1">
                        Showing filtered analytics &amp; tables.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        generateCompanyReport(
                          company,
                          filteredMaterials,
                          employeeEfficiency
                        )
                      }
                      className="px-3 py-1 rounded-xl 
             text-[11px] sm:text-xs font-semibold 
             bg-[#D8B4F8] hover:bg-[#C89AEF] 
             text-[#4B3A7A] 
             transition shadow"
                    >
                      📄 Generate Report
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompany(company.companyId)}
                      className="px-3 py-1 rounded-xl text-[11px] sm:text-xs font-semibold bg-[#F2E6FF] 
                      text-[#6B4FA3] hover:bg-[#E3D2FF] transition"
                    >
                      {isOpen ? "Hide Details ▲" : "Show Details ▼"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <SummaryCard
                    label="Employees"
                    value={totalEmployees}
                    color="#A259FF"
                  />
                  <SummaryCard
                    label="Total Materials"
                    value={totalMaterials}
                    color="#FF8A00"
                  />
                  <SummaryCard
                    label="This Month"
                    value={totalThisMonth}
                    color="#00C47A"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
                  <div className="bg-[#F7E8FF] rounded-2xl p-3">
                    <h3 className="text-[11px] sm:text-[12px] font-semibold text-[#6B4FA3] mb-2">
                      Monthly Production
                    </h3>

                    {monthlySeries.length === 0 ? (
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        No production data for this filter.
                      </p>
                    ) : (
                      <div className="w-full h-44 sm:h-52 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlySeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#A259FF"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#F7E8FF] rounded-2xl p-3">
                    <h3 className="text-[11px] sm:text-[12px] font-semibold text-[#6B4FA3] mb-2">
                      Material Type Distribution
                    </h3>

                    {pieData.length === 0 ? (
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        No data available.
                      </p>
                    ) : (
                      <div className="w-full h-44 sm:h-52 md:h-56">
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

                  <div className="bg-[#F7E8FF] rounded-2xl p-3">
                    <h3 className="text-[11px] sm:text-[12px] font-semibold text-[#6B4FA3] mb-2">
                      Employee Efficiency
                    </h3>

                    {employeeEfficiency.length === 0 ? (
                      <p className="text-[10px] sm:text-[11px] text-gray-500">
                        No employee work found in this filter.
                      </p>
                    ) : (
                      <div className="w-full h-44 sm:h-52 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={employeeEfficiency}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar
                              dataKey="count"
                              fill="#6B4FA3"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 sm:mt-4 space-y-5 sm:space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">
                        Employees &amp; Work Summary (Filtered)
                      </h3>

                      <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-[11px] sm:text-xs">
                          <thead>
                            <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                              <th className="py-2 px-2 text-left">Name</th>
                              <th className="py-2 px-2 text-left">Emp ID</th>
                              <th className="py-2 px-2 text-left">Email</th>
                              <th className="py-2 px-2 text-left">
                                Materials
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {company.employees.map((emp) => {
                              const count = filteredMaterials.filter(
                                (m) => m.createdBy === emp.uid
                              ).length;

                              return (
                                <tr
                                  className="border-t hover:bg-gray-50/60"
                                  key={emp.uid}
                                >
                                  <td className="py-2 px-2">
                                    {emp.name || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {emp.empId || "-"}
                                  </td>
                                  <td className="py-2 px-2 break-all">
                                    {emp.email || "-"}
                                  </td>
                                  <td className="py-2 px-2">{count}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-2">
                        Materials (Filtered)
                      </h3>

                      <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-[11px] sm:text-xs">
                          <thead>
                            <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                              <th className="py-2 px-2 text-left">
                                Material ID
                              </th>
                              <th className="py-2 px-2 text-left">Type</th>
                              <th className="py-2 px-2 text-left">Drawing</th>
                              <th className="py-2 px-2 text-left">Batch</th>
                              <th className="py-2 px-2 text-left">
                                Manufacturing Date
                              </th>
                              <th className="py-2 px-2 text-left">
                                Created By
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredMaterials.map((m) => {
                              const emp = company.employees.find(
                                (e) => e.uid === m.createdBy
                              );

                              return (
                                <tr
                                  key={m.id}
                                  className="border-t hover:bg-gray-50/60"
                                >
                                  <td className="py-2 px-2 font-mono text-[10px] sm:text-[11px] break-all">
                                    {m.materialId || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {m.fittingType || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {m.drawingNumber || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {m.batchNumber || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {m.manufacturingDate || "-"}
                                  </td>
                                  <td className="py-2 px-2">
                                    {emp
                                      ? emp.name || emp.empId || emp.email
                                      : "Unknown"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
    🔹 HELPER FUNCTIONS
============================================================ */

function buildMonthlySeries(materials: Material[]) {
  const buckets: Record<string, number> = {};

  materials.forEach((m) => {
    if (!m.manufacturingDate) return;

    const month = m.manufacturingDate.slice(0, 7);
    buckets[month] = (buckets[month] || 0) + 1;
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function buildTypeDistribution(materials: Material[]) {
  const buckets: Record<string, number> = {};

  materials.forEach((m) => {
    const type = m.fittingType || "Unknown";
    buckets[type] = (buckets[type] || 0) + 1;
  });

  return Object.entries(buckets).map(([name, value]) => ({
    name,
    value,
  }));
}

function buildEmployeeEfficiency(
  employees: Employee[],
  materials: Material[]
): EfficiencyRow[] {
  const workMap: Record<string, number> = {};

  materials.forEach((m) => {
    if (!m.createdBy) return;
    workMap[m.createdBy] = (workMap[m.createdBy] || 0) + 1;
  });

  return employees
    .map((emp) => ({
      name: emp.name || emp.empId || emp.email || "Unknown",
      count: workMap[emp.uid] || 0,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
    🔹 SUMMARY CARD COMPONENT
============================================================ */

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="bg-white rounded-3xl shadow-lg px-4 sm:px-5 py-3 sm:py-4"
      style={{ borderTop: `4px solid ${color}` }}
    >
      <p className="text-[10px] sm:text-[11px] text-gray-500">{label}</p>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold">{value}</p>
    </div>
  );
}
