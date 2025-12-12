"use client";

import { useEffect } from "react";
import { auth } from "@/shared/firebaseConfig";
import { signOut } from "firebase/auth";

export default function DepotLogout() {
  useEffect(() => {
    // Clear session cookie
    document.cookie = "__session=; Max-Age=0; path=/";

    // Logout user
    signOut(auth).finally(() => {
      // Redirect after logout
      window.location.replace("/depot/login");
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7E8FF] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">

        {/* Spinner */}
        <div className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin mb-4"></div>

        <p className="text-gray-600 text-sm sm:text-base">
          Logging you out safely…
        </p>
      </div>
    </div>
  );
}
