"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";

export default function TrackLogout() {
  useEffect(() => {
    // Clear Firebase session cookie (if used)
    document.cookie = "__session=; Max-Age=0; path=/;";

    // Firebase logout
    signOut(auth)
      .finally(() => {
        // Force client-side navigation after logout
        window.location.replace("/track/login");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7E8FF]">
      <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow text-[#A259FF] text-sm font-medium">
        Logging out…
      </div>
    </div>
  );
}
