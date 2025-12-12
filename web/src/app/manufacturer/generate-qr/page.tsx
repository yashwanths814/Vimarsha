import { Suspense } from "react";
import QRClient from "./qr-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-md text-center text-[#6B4FA3] font-semibold text-sm">
            Loading QR…
          </div>
        </div>
      }
    >
      <QRClient />
    </Suspense>
  );
}
