"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode-generator";

import MainHeader from "@/components/Header";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import AppLoader from "@/components/AppLoader";

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

export default function ViewMaterial() {
    const params = useParams();
    const idParam = params?.id;
    const docId = Array.isArray(idParam) ? idParam[0] : (idParam as string | undefined);

    const [data, setData] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrSvg, setQrSvg] = useState<string | null>(null);

    // Create QR SVG – payload will be ONLY materialId
    function generateQR(payload: string) {
        const qr = QRCode(1, "L"); // version 1 is enough for 7 chars
        qr.addData(payload);
        qr.make();

        const size = 4;
        const margin = 4;
        const count = qr.getModuleCount();
        const fullSize = (count + margin * 2) * size;

        let svg = `
          <svg xmlns="http://www.w3.org/2000/svg"
               width="${fullSize}"
               height="${fullSize}"
               viewBox="0 0 ${fullSize} ${fullSize}">
            <rect width="100%" height="100%" fill="white"/>
            <g fill="black">
        `;

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (qr.isDark(r, c)) {
                    svg += `<rect x="${(c + margin) * size}" y="${(r + margin) * size}"
                               width="${size}" height="${size}"/>`;
                }
            }
        }

        svg += "</g></svg>";
        return svg;
    }

    // Fetch material by docId
    useEffect(() => {
        async function load() {
            if (!docId) {
                setError("Missing material ID in URL.");
                setLoading(false);
                return;
            }

            try {
                const ref = doc(db, "materials", docId);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const d = snap.data() as Material;
                    setData(d);

                    const payload = d.materialId || "";

                    if (payload.length !== 7) {
                        console.warn(
                            "Material ID is not 7 characters for doc",
                            docId,
                            "value:",
                            payload
                        );
                    }

                    setQrSvg(generateQR(payload));
                } else {
                    setError("Material not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load material details.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [docId]);

    // Global loading
    if (loading) {
        return <AppLoader />;
    }

    const hasError = error || !data;

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10 flex justify-center">
                    <div className="w-full max-w-5xl">
                        {hasError ? (
                            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center">
                                <h1 className="text-2xl font-extrabold text-red-500 mb-2">
                                    Error
                                </h1>
                                <p className="text-sm text-gray-700">
                                    {error || "Material not found."}
                                </p>
                            </div>
                        ) : data ? (
                            <>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-4">
                                    Material Details
                                </h1>

                                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
                                    {/* QR Preview */}
                                    <div className="flex flex-col items-center mb-6">
                                        {qrSvg ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Generating QR…
                                            </p>
                                        )}

                                        <p className="text-[11px] sm:text-xs text-gray-500 mt-2 text-center">
                                            QR encodes only the 7-character Material ID:{" "}
                                            <span className="font-mono">
                                                {data.materialId}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Material Core Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                        <Info label="Material ID" value={data.materialId} />
                                        <Info
                                            label="Manufacturer"
                                            value={data.manufacturerName}
                                        />
                                        <Info
                                            label="Fitting Type"
                                            value={data.fittingType}
                                        />
                                        <Info
                                            label="Drawing Number"
                                            value={data.drawingNumber}
                                        />
                                        <Info
                                            label="Material Spec"
                                            value={data.materialSpec}
                                        />
                                        <Info label="Weight (kg)" value={data.weightKg} />
                                        <Info
                                            label="Board Gauge"
                                            value={data.boardGauge}
                                        />
                                        <Info
                                            label="Manufacturing Date"
                                            value={data.manufacturingDate}
                                        />
                                        <Info
                                            label="Expected Life (Years)"
                                            value={data.expectedLifeYears}
                                        />

                                        {/* UDM */}
                                        <Info
                                            label="PO Number"
                                            value={data.purchaseOrderNumber}
                                        />
                                        <Info
                                            label="Batch Number"
                                            value={data.batchNumber}
                                        />
                                        <Info
                                            label="Depot Code"
                                            value={data.depotCode}
                                        />
                                        <Info
                                            label="Depot Entry Date"
                                            value={data.depotEntryDate}
                                        />
                                        <Info
                                            label="UDM Lot Number"
                                            value={data.udmLotNumber}
                                        />
                                        <Info
                                            label="Inspection Officer"
                                            value={data.inspectionOfficer}
                                        />

                                        {/* TMS */}
                                        <Info
                                            label="TMS Track ID"
                                            value={data.tmsTrackId}
                                        />
                                        <Info
                                            label="GPS Location"
                                            value={data.gpsLocation}
                                        />
                                        <Info
                                            label="Installation Status"
                                            value={data.installationStatus}
                                        />
                                        <Info
                                            label="Dispatch Date"
                                            value={data.dispatchDate}
                                        />
                                        <Info
                                            label="Warranty Expiry"
                                            value={data.warrantyExpiry}
                                        />
                                        <Info
                                            label="Failure Count"
                                            value={data.failureCount}
                                        />
                                        <Info
                                            label="Last Maintenance"
                                            value={data.lastMaintenanceDate}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col bg-gray-50 p-3 rounded-xl">
            <span className="text-[11px] text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900 break-words">
                {value || "-"}
            </span>
        </div>
    );
}
