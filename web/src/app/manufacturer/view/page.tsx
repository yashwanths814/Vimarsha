"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, auth } from "@/shared/firebaseConfig";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from "firebase/firestore";

import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";

// same helper as add-material
function getManufacturerId7FromUid(uid: string): string {
    const cleaned = uid.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return cleaned.slice(0, 7).padEnd(7, "X");
}

export default function ViewMaterialsPage() {
    const router = useRouter();

    const [materials, setMaterials] = useState<any[]>([]);
    const [manufacturerId, setManufacturerId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // get logged-in user and derive 7-char manufacturerId
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user) => {
            if (user) {
                const mid = getManufacturerId7FromUid(user.uid);
                setManufacturerId(mid);
                setAuthChecked(true);
            } else {
                setManufacturerId(null);
                setMaterials([]);
                setAuthChecked(true);
                router.replace("/manufacturer/login");
            }
        });
        return () => unsub();
    }, [router]);

    // subscribe to materials for this manufacturer
    useEffect(() => {
        if (!manufacturerId) return;

        const q = query(
            collection(db, "materials"),
            where("manufacturerId", "==", manufacturerId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const rows: any[] = [];
            snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
            setMaterials(rows);
        });

        return () => unsub();
    }, [manufacturerId]);

    if (!authChecked) {
        return <AppLoader />;
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Responsive layout */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerSidebar />
                </div>

                {/* Main content */}
                <main className="w-full md:ml-64 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-4 sm:mb-6">
                        Manufactured Components
                    </h1>

                    <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 w-full">
                        {materials.length === 0 ? (
                            <p className="text-gray-500 text-xs sm:text-sm">
                                No materials added yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] sm:text-xs">
                                    <thead>
                                        <tr className="bg-[#F7E8FF] text-[#6B4FA3]">
                                            <th className="p-2 text-left">Material ID (7)</th>
                                            <th className="p-2 text-left">Fitting Type</th>
                                            <th className="p-2 text-left">Drawing</th>
                                            <th className="p-2 text-left">Mfg Date</th>
                                            <th className="p-2 text-left">QR</th>
                                            <th className="p-2 text-left">Edit</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {materials.map((m) => (
                                            <tr
                                                key={m.id}
                                                className="border-b border-gray-100 hover:bg-[#F7E8FF]/30 transition-colors"
                                            >
                                                <td className="p-2 font-mono text-[11px] text-[#4B3A7A]">
                                                    {m.materialId}
                                                </td>
                                                <td className="p-2">{m.fittingType || "-"}</td>
                                                <td className="p-2">{m.drawingNumber || "-"}</td>
                                                <td className="p-2">
                                                    {m.manufacturingDate || "-"}
                                                </td>

                                                <td className="p-2">
                                                    {/* 👇 pass the 7-char materialId, not doc.id */}
                                                    <Link
                                                        href={`/manufacturer/generate-qr?materialId=${m.materialId}`}
                                                        className="text-[#A259FF] hover:underline"
                                                    >
                                                        View QR
                                                    </Link>
                                                </td>

                                                <td className="p-2">
                                                    {/* if your edit page uses docId, keep id here */}
                                                    <Link
                                                        href={`/manufacturer/edit/${m.id}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
