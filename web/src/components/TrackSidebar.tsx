"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function TrackSidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (p: string) =>
    path === p || (p !== "/track" && path.startsWith(p));

  const linkClass = (p: string) =>
    `block px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition mb-2
    ${
      isActive(p)
        ? "bg-[#A259FF] text-white shadow-md"
        : "text-gray-700 hover:bg-gray-100 hover:text-[#A259FF]"
    }`;

  // Sidebar Content (used by both mobile + desktop)
  const NavContent = () => (
    <>
      {/* Header */}
      <h2 className="text-base sm:text-lg font-extrabold text-[#A259FF] mb-4">
        Track Panel
      </h2>

      <nav className="flex flex-col flex-1 overflow-y-auto pr-1">
        <Link
          href="/track/materials"
          className={linkClass("/track/materials")}
          onClick={() => setOpen(false)}
        >
          📄 View Material Details
        </Link>

        <Link
          href="/track/scan"
          className={linkClass("/track/scan")}
          onClick={() => setOpen(false)}
        >
          📷 Scan Material QR
        </Link>

        <Link
          href="/track/profile"
          className={linkClass("/track/profile")}
          onClick={() => setOpen(false)}
        >
          👤 Profile
        </Link>

        <Link
          href="/logout"
          className={linkClass("/logout")}
          onClick={() => setOpen(false)}
        >
          🚪 Logout
        </Link>
      </nav>

      <p className="mt-3 text-[10px] sm:text-xs text-gray-400 text-center">
        Vimarsha – Track Fittings Ecosystem
      </p>
    </>
  );

  return (
    <>
      {/* 📱 Hamburger button (Mobile Only) */}
      <button
        type="button"
        aria-label="Open menu"
        className="
          fixed left-3 top-[82px] z-40
          md:hidden
          inline-flex items-center gap-2
          px-3 py-2 rounded-full
          bg-white/90 shadow-lg border border-[#E9D5FF]
          text-xs font-semibold text-[#A259FF]
        "
        onClick={() => setOpen(true)}
      >
        <span className="flex flex-col gap-0.5">
          <span className="w-4 h-[2px] bg-[#A259FF] rounded-full" />
          <span className="w-3 h-[2px] bg-[#A259FF] rounded-full" />
          <span className="w-5 h-[2px] bg-[#A259FF] rounded-full" />
        </span>
        <span>Track</span>
      </button>

      {/* 📱 Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Dark overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Sliding drawer */}
        <aside
          className={`
            absolute inset-y-0 left-0
            w-64 max-w-[80vw]
            bg-white backdrop-blur-sm
            shadow-xl
            p-4 sm:p-5
            flex flex-col
            rounded-tr-2xl rounded-br-2xl
            transform transition-transform duration-300
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <NavContent />
        </aside>
      </div>

      {/* 💻 Desktop Sidebar */}
      <aside
        className="
          hidden md:flex
          fixed inset-y-0 left-0
          w-64 bg-white/95 backdrop-blur-sm
          shadow-xl p-5 flex-col z-30 rounded-tr-2xl
        "
      >
        <NavContent />
      </aside>
    </>
  );
}
