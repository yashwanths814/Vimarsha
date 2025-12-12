"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";

type MaterialForm = {
    manufacturerName?: string;
    fittingType?: string;
    drawingNumber?: string;
    materialSpec?: string;
    weightKg?: string;
    boardGauge?: string;
    manufacturingDate?: string;
    expectedLifeYears?: string;
    batchNumber?: string;
    purchaseOrderNumber?: string;
    [key: string]: any;
};

export default function EditMaterialPage() {
    const router = useRouter();
    const { id } = useParams();
    const docId = Array.isArray(id) ? id[0] : id;

    const [form, setForm] = useState<MaterialForm | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            if (!docId) return;

            const ref = doc(db, "materials", docId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data() as MaterialForm;

                // ❗ PREVENT accidental overwrite of QR-related fields
                delete (data as any).qrCode;
                delete (data as any).qrImageUrl;
                delete (data as any).qrHash;
                delete (data as any).materialId;

                setForm(data);
            } else {
                // If no document, go back to list
                router.replace("/manufacturer/view");
            }
        }

        load();
    }, [docId, router]);

    async function saveChanges() {
        if (!docId || !form) return;

        setSaving(true);

        try {
            const ref = doc(db, "materials", docId);

            await updateDoc(ref, {
                ...form, // all edited fields
                updatedAt: new Date().toISOString(), // useful field
            });

            router.push("/manufacturer/view");
        } catch (err) {
            console.error("Error updating material:", err);
        } finally {
            setSaving(false);
        }
    }

    // Loading state while fetching document
    if (!form) {
        return <AppLoader />;
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Layout: stacked on mobile, sidebar + content on md+ */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-4">
                        Edit Material (QR Unchanged)
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-2xl">
                        Update manufacturing details. QR metadata, hashes, and Material
                        ID will remain unchanged.
                    </p>

                    <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 max-w-3xl">
                        {(
                            [
                                ["manufacturerName", "Manufacturer Name"],
                                ["fittingType", "Fitting Type"],
                                ["drawingNumber", "Drawing Number"],
                                ["materialSpec", "Material Specification"],
                                ["weightKg", "Weight (kg)"],
                                ["boardGauge", "Board Gauge"],
                                ["manufacturingDate", "Manufacturing Date"],
                                ["expectedLifeYears", "Expected Life (years)"],
                                ["batchNumber", "Batch Number"],
                                ["purchaseOrderNumber", "Purchase Order Number"],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="mb-4">
                                <label className="text-xs text-gray-600 mb-1 block">
                                    {label}
                                </label>
                                <input
                                    value={(form?.[key] as string) || ""}
                                    onChange={(e) =>
                                        setForm((prev) =>
                                            prev
                                                ? { ...prev, [key]: e.target.value }
                                                : prev
                                        )
                                    }
                                    className="w-full border rounded-xl px-3 py-2 mt-1 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                />
                            </div>
                        ))}

                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="mt-4 px-5 py-2 rounded-xl bg-[#A259FF] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8b46e6] transition"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
