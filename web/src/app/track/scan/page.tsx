"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";

// 🔧 IMPORTANT: point to the worker file
// Option 1 (if you copied qr-scanner-worker.min.js into /public):
// QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

// Option 2 (if using it from node_modules via bundler):
QrScanner.WORKER_PATH = new URL(
  "qr-scanner/qr-scanner-worker.min.js",
  import.meta.url
).toString();

export default function ScanPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow text-sm text-[#A259FF]">
            Loading scanner…
          </div>
        </div>
      }
    >
      <ScanPage />
    </Suspense>
  );
}

function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("Initialising camera…");

  useEffect(() => {
    if (!videoRef.current) return;
    if (scannerRef.current) return; // 🚫 avoid double-init in StrictMode

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (!result?.data) return;

        setMessage("Processing QR…");
        setScanning(false);
        scanner.stop();

        // ----------------------------
        // ✅ Extract docId from URL OR use raw id
        // ----------------------------
        let docId = "";

        try {
          // if it's a full URL, parse it
          const url = new URL(result.data);
          const parts = url.pathname.split("/");
          docId = parts.pop() || "";
        } catch {
          // not a URL → treat entire data as docId
          docId = result.data.trim();
        }

        if (!docId) {
          setMessage("QR has no valid Material ID");
          return;
        }

        // ----------------------------
        // 🚀 Redirect to installation material page
        // ----------------------------
        router.push(`/track/installation/material?id=${docId}`);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment", // 📷 back camera on mobile if available
      }
    );

    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => {
        setScanning(true);
        setMessage("Scanning… Align the QR inside the frame.");
      })
      .catch((err) => {
        console.error("Scanner start error:", err);
        setScanning(false);
        setMessage("Unable to access camera. Check permissions & HTTPS.");
      });

    return () => {
      scanner.stop();
      scannerRef.current = null;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col items-center px-4 py-6">
      {/* Top row */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
        >
          ← Back
        </button>

        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 border border-purple-100 text-[10px] font-semibold text-[#A259FF]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              scanning ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {scanning ? "Camera Active" : "Idle"}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-[#A259FF] text-center">
        Scan Material QR
      </h1>
      <p className="text-[11px] text-gray-600 mt-1 mb-5 text-center">
        Point your camera at the QR code printed near the rail fitting.
      </p>

      {/* Video frame */}
      <div className="w-full max-w-md rounded-3xl bg-black shadow-2xl overflow-hidden border border-[#A259FF]/40">
        <div className="relative w-full aspect-[3/4]">
          <video ref={videoRef} className="w-full h-full object-cover" />
          {/* Visual frame overlay */}
          <div className="pointer-events-none absolute inset-6 border-2 border-white/60 rounded-2xl" />
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-purple-100 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#A259FF] animate-pulse" />
          <span className="text-[11px] text-gray-700">{message}</span>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-500 text-center max-w-xs">
        If the camera doesn’t open, ensure browser camera permission is allowed
        and the page is served over HTTPS.
      </p>
    </div>
  );
}
