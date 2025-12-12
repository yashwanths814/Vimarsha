"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import generateMaterialPdf from "./materialReportPdf"; // ✅ PDF generator

type Material = {
    materialId: string;
    manufacturerId: string;
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
};

export default function PublicMaterialPage() {
    const params = useParams();
    const idParam = params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : (idParam as string | undefined);

    const [material, setMaterial] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function load() {
            if (!id) {
                setError("Missing material ID in the link.");
                setLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "materials", id));
                if (!snap.exists()) {
                    setError("Material not found.");
                } else {
                    setMaterial(snap.data() as Material);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load material details.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    if (loading)
        return (
            <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
                <p className="text-black text-sm">Loading material…</p>
            </div>
        );

    if (error || !material)
        return (
            <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl px-6 py-4 max-w-md w-full text-center">
                    <p className="text-red-600 text-sm font-semibold mb-1">Error</p>
                    <p className="text-sm text-gray-700">
                        {error || "Material not found."}
                    </p>
                </div>
            </div>
        );

    async function handleDownload() {
        if (!material) return;
        try {
            setDownloading(true);
            await generateMaterialPdf(material);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF] px-4 py-10 flex justify-center">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-[#A259FF] text-white p-5 text-center">
                    <h1 className="text-lg sm:text-xl font-bold">
                        {material.fittingType} – Details
                    </h1>
                    <p className="text-[11px] sm:text-[12px] opacity-80 mt-1">
                        Material ID: {material.materialId}
                    </p>
                </div>

                {/* CONTENT */}
                <div className="p-6 text-sm text-black space-y-5">

                    {/* =========================== */}
                    <CardSection title="Manufacturer / Plant Details">
                        <Field label="Manufacturer Name" value={material.manufacturerName} />
                        <Field label="Manufacturer ID" value={material.manufacturerId} />
                    </CardSection>

                    {/* =========================== */}
                    <CardSection title="Technical Specifications">
                        <Field label="Fitting Type" value={material.fittingType} />
                        <Field label="Drawing Number" value={material.drawingNumber} />
                        <Field label="Material Specification" value={material.materialSpec} />
                        <Field label="Weight (kg)" value={material.weightKg} />
                        <Field label="Gauge" value={material.boardGauge} />
                        <Field label="Manufacturing Date" value={material.manufacturingDate} />
                        <Field
                            label="Expected Life"
                            value={`${material.expectedLifeYears} Years`}
                        />
                    </CardSection>

                    {/* =========================== */}
                    <CardSection title="UDM & Purchase Details">
                        <Field
                            label="Purchase Order Number"
                            value={material.purchaseOrderNumber}
                        />
                        <Field label="Batch Number" value={material.batchNumber} />
                        <Field label="Depot Code" value={material.depotCode} />
                        <Field label="Depot Entry Date" value={material.depotEntryDate} />
                        <Field label="UDM Lot Number" value={material.udmLotNumber} />
                        <Field label="Inspection Officer" value={material.inspectionOfficer} />
                    </CardSection>

                    {/* =========================== */}
                    <CardSection title="TMS & Lifecycle">
                        <Field label="TMS Track ID" value={material.tmsTrackId} />
                        <Field
                            label="GPS Installation Location"
                            value={material.gpsLocation}
                        />
                        <Field
                            label="Installation Status"
                            value={material.installationStatus}
                        />
                        <Field label="Dispatch Date" value={material.dispatchDate} />
                        <Field label="Warranty Expiry" value={material.warrantyExpiry} />
                        <Field label="Failure Count" value={material.failureCount} />
                        <Field
                            label="Last Maintenance"
                            value={material.lastMaintenanceDate}
                        />
                    </CardSection>

                    {/* =========================== */}
                    {/* DOWNLOAD BUTTON */}
                    {/* =========================== */}
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full py-3 mt-2 bg-[#A259FF] text-white font-semibold rounded-xl shadow hover:bg-[#8b3ce8] transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                        {downloading ? "Generating PDF…" : "Download Report (PDF)"}
                    </button>

                </div>
            </div>
        </div>
    );
}

/* ========== CARD SECTION ========== */
function CardSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="bg-[#FFF9FF] border border-[#E5D4FF] rounded-xl p-4">
            <h3 className="text-[12px] sm:text-[13px] font-bold text-[#A259FF] mb-3 uppercase tracking-wide">
                {title}
            </h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

/* ========== FIELD ROW ========== */
function Field({ label, value }: { label: string; value?: string | number }) {
    const display = value === undefined || value === null || value === "" ? "-" : String(value);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 py-2 border-b border-gray-200">
            <span className="text-[11px] sm:text-[12px] text-gray-600 sm:w-1/2">
                {label}
            </span>
            <span className="text-[11px] sm:text-[12px] font-semibold sm:w-1/2 sm:text-right break-words">
                {display}
            </span>
        </div>
    );
}
