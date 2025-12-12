"use client";

import { useEffect, useState } from "react";
import { db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";

export default function MaterialDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [material, setMaterial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const ref = doc(db, "materials", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setMaterial(snap.data());
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error("Material load error:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#A259FF] animate-pulse" />
          <span className="text-sm text-gray-700 font-medium">
            Loading material details…
          </span>
        </div>
      </div>
    );
  }

  if (notFound || !material) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
        <MainHeader />
        <div className="flex pt-[90px]">
          <div className="hidden lg:block">
            <TrackSidebar />
          </div>

          <main className="w-full px-4 pb-10 lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-10">
            <div className="max-w-3xl mx-auto mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 mb-4 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>

              <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-red-100 px-6 py-6">
                <h1 className="text-lg md:text-xl font-bold text-red-600 mb-2">
                  Material not found
                </h1>
                <p className="text-sm text-gray-600">
                  The scanned Material ID is not available. Please verify the QR code
                  or try scanning again.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const entries = Object.entries(material);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        {/* Sidebar – hidden on mobile */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        {/* MAIN CONTENT */}
        <main className="w-full px-4 pb-10 lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-10">
          <div className="max-w-4xl mx-auto">
            {/* Mobile header row */}
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>
              {id && (
                <span className="text-[10px] px-3 py-1 rounded-full bg-white/80 border border-purple-100 text-[#A259FF] font-semibold">
                  ID: {id}
                </span>
              )}
            </div>

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
              <div>
                <p className="hidden lg:block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Track &gt; Materials &gt; Details
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Material Details
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Scanned material metadata as stored in the central database.
                </p>
              </div>

              {material.materialId && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur px-4 py-2 shadow-sm border border-purple-100">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">
                    Material ID
                  </span>
                  <span className="text-xs font-semibold text-[#A259FF]">
                    {material.materialId}
                  </span>
                </div>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
                {entries
                  .filter(([key]) => key !== "qrUrl") // show qr separately
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="border border-gray-100 rounded-2xl px-3 py-2.5 bg-gray-50/60"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                        {key}
                      </p>
                      <p className="text-[13px] text-gray-800 break-words">
                        {String(value)}
                      </p>
                    </div>
                  ))}
              </div>

              {/* QR Preview */}
              {material.qrUrl && (
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-[11px] text-gray-500 mb-2">
                    QR Code for this Material
                  </p>
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                    <img
                      src={material.qrUrl}
                      className="w-40 h-40 object-contain"
                      alt="Material QR Code"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
