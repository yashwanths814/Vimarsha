"use client";

import { auth } from "@/shared/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function TrackHome() {
  const router = useRouter();

  function logout() {
    signOut(auth);
    router.push("/track/login");
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF] flex flex-col justify-center items-center px-6 py-10">

      <h1 className="text-3xl md:text-4xl font-extrabold text-[#A259FF] mb-2 text-center">
        Track Staff Dashboard
      </h1>

      <p className="text-sm md:text-base mb-10 text-gray-600 text-center">
        Choose an operation below
      </p>

      <div className="grid grid-cols-1 gap-5 w-full max-w-xs">

        <button
          onClick={() => router.push("/track/scan")}
          className="py-4 bg-[#A259FF] text-white rounded-2xl shadow text-xl font-semibold active:scale-95 transition"
        >
          📷 Scan Material QR
        </button>

        <button
          onClick={() => router.push("/track/history")}
          className="py-4 bg-white border-2 border-[#A259FF] text-[#A259FF] rounded-2xl shadow text-xl font-semibold active:scale-95 transition"
        >
          📑 View Work History
        </button>

        <button
          onClick={logout}
          className="py-4 bg-red-500 text-white rounded-2xl shadow text-xl font-semibold active:scale-95 transition"
        >
          🚪 Logout
        </button>

      </div>

    </div>
  );
}
