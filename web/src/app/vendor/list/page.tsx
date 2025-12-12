"use client";

import { useEffect, useState } from "react";
import { db } from "@/shared/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

type Material = {
  id: string;
  materialId?: string;
  fittingType?: string;
  qrUrl?: string;
  status?: string;
  [key: string]: any;
};

export default function MaterialListPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "materials"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Material[];
      setMaterials(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
              Vendor &gt; Materials
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
              Manufactured Materials
            </h1>
            <p className="mt-1 text-xs md:text-sm text-gray-600">
              List of all materials generated with QR codes in the system.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl shadow flex items-center gap-2 text-sm text-gray-700">
              <span className="h-3 w-3 rounded-full bg-[#A259FF] animate-pulse" />
              Loading materials…
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && materials.length === 0 && (
          <div className="mt-10 flex justify-center">
            <div className="bg-white/90 rounded-3xl border border-purple-100 px-6 py-6 shadow text-center max-w-md">
              <p className="text-sm font-semibold text-[#4B3A7A] mb-1">
                No materials found
              </p>
              <p className="text-[11px] text-gray-500">
                Once manufacturers add materials, they will appear here with their
                QR codes.
              </p>
            </div>
          </div>
        )}

        {/* Grid of materials */}
        {materials.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {materials.map((m) => (
              <Link key={m.id} href={`/vendor/${m.id}`}>
                <div className="bg-white/95 p-4 md:p-5 rounded-2xl shadow-md border border-purple-100/60 hover:shadow-lg hover:-translate-y-1 transition-transform cursor-pointer flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-[#4B3A7A]">
                        {m.materialId || "Unknown Material ID"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {m.fittingType || "Unknown Fitting Type"}
                      </p>
                    </div>

                    {m.status && (
                      <span className="px-2 py-1 rounded-full text-[10px] bg-[#F7E8FF] text-[#A259FF] font-semibold">
                        {m.status}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-center">
                    {m.qrUrl ? (
                      <img
                        src={m.qrUrl}
                        className="w-28 h-28 md:w-32 md:h-32 object-contain rounded-xl border border-gray-100 bg-gray-50"
                        alt={`QR for ${m.materialId}`}
                      />
                    ) : (
                      <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400 text-center px-2">
                        QR not available
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
