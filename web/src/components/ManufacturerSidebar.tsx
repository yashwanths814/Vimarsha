"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import { useEffect, useState } from "react";

export default function ManufacturerSidebar() {
  const path = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // mobile drawer
  const [open, setOpen] = useState(false);

  // close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const isActive = (href: string) =>
    path === href || (path?.startsWith(href) && href !== "/manufacturer");

  const linkStyle = (href: string) =>
    `block px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition 
    ${
      isActive(href)
        ? "bg-[#A259FF] text-white shadow-md"
        : "text-gray-700 hover:bg-[#F2E6FF] hover:text-[#A259FF]"
    }`;

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.push("/manufacturer/login");
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* 🔔 Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed
          left-4
          top-[86px]
          z-40
          md:hidden
          h-10 w-10
          flex items-center justify-center
          rounded-full
          bg-white/90
          shadow-lg
          border border-[#E9D5FF]
          text-[#A259FF]
          text-2xl
          active:scale-95
          transition
        "
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* 🔳 Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 🧭 Sidebar */}
      <aside
        className={`
          fixed left-0 top-[80px] bottom-0
          w-64 max-w-[80vw]
          bg-white/95
          backdrop-blur-sm
          shadow-xl
          px-4 sm:px-6 py-4
          flex flex-col
          z-50
          rounded-tr-2xl
          transform transition-transform duration-300
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">
              Manufacturer
            </p>
            <h2 className="text-base sm:text-lg font-extrabold text-[#A259FF]">
              Main Console
            </h2>
          </div>

          {/* Close button on mobile inside drawer */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-xl text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2.5 sm:gap-3 mt-1 flex-1 overflow-y-auto pr-1">
          <Link
            href="/manufacturer/dashboard"
            className={linkStyle("/manufacturer/dashboard")}
          >
            📊 Dashboard
          </Link>

          <Link
            href="/manufacturer/add-material"
            className={linkStyle("/manufacturer/add-material")}
          >
            ➕ Add Material
          </Link>

          <Link
            href="/manufacturer/view"
            className={linkStyle("/manufacturer/view")}
          >
            📁 View Materials
          </Link>

          <Link
            href="/manufacturer/materials"
            className={linkStyle("/manufacturer/materials")}
          >
            📦 Materials Dashboard
          </Link>

          <Link
            href="/manufacturer/profile"
            className={linkStyle("/manufacturer/profile")}
          >
            👤 Profile
          </Link>
        </nav>

        {/* Logout + Footer */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="
              mt-1
              w-full
              py-2 sm:py-2.5
              rounded-xl
              border
              border-gray-300
              text-[11px] sm:text-sm
              font-medium
              text-gray-700
              hover:bg-gray-100
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
              flex items-center justify-center gap-2
            "
          >
            {loggingOut ? "Logging out…" : "🚪 Logout"}
          </button>

          <div className="mt-3 text-[9px] sm:text-[10px] text-gray-400 leading-snug">
            Vimarsha – Track Fittings Ecosystem
          </div>
        </div>
      </aside>
    </>
  );
}
