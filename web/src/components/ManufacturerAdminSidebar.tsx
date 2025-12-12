"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import { useState } from "react";

export default function ManufacturerAdminSidebar() {
  const path = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    path === href || (path?.startsWith(href) && href !== "/manufacturer/admin");

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

  const NavContent = () => (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">
          Manufacturer Admin
        </p>
        <h2 className="text-base sm:text-lg font-extrabold text-[#A259FF]">
          Admin Console
        </h2>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-2.5 sm:gap-3 mt-1 flex-1 overflow-y-auto pr-1">
        <Link
          href="/manufacturer/admin/dashboard"
          className={linkStyle("/manufacturer/admin/dashboard")}
          onClick={() => setOpen(false)}
        >
          📊 Admin Dashboard
        </Link>

        <Link
          href="/manufacturer/admin/employees"
          className={linkStyle("/manufacturer/admin/employees")}
          onClick={() => setOpen(false)}
        >
          👥 Employees
        </Link>

        <Link
          href="/manufacturer/admin/materials"
          className={linkStyle("/manufacturer/admin/materials")}
          onClick={() => setOpen(false)}
        >
          🧩 All Materials
        </Link>
      </nav>

      {/* Footer */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="
            w-full flex items-center justify-center gap-2 
            text-[11px] sm:text-xs font-semibold 
            rounded-xl py-2 sm:py-2.5 
            bg-red-50 text-red-600 hover:bg-red-100 
            disabled:opacity-60 disabled:cursor-not-allowed
            transition
          "
        >
          {loggingOut ? "Logging out…" : "🚪 Logout"}
        </button>

        <p className="mt-3 text-[9px] sm:text-[10px] text-gray-400 leading-snug">
          Vimarsha – Track Fittings Ecosystem
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* 🔔 Mobile hamburger button */}
      <button
        type="button"
        aria-label="Open admin menu"
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
        <span>Admin</span>
      </button>

      {/* 📱 Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />

        {/* Drawer */}
        <aside
          className={`
            absolute inset-y-0 left-0
            w-64 max-w-[80vw]
            bg-white/95 backdrop-blur-sm
            shadow-xl
            px-4 sm:px-6 py-4
            flex flex-col
            rounded-tr-2xl rounded-br-2xl
            transform transition-transform duration-300
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <NavContent />
        </aside>
      </div>

      {/* 💻 Desktop sidebar */}
      <aside
        className="
          hidden md:flex
          fixed inset-y-0 left-0
          w-64
          bg-white/95 backdrop-blur-sm
          shadow-xl
          px-4 sm:px-6 py-4
          flex-col
          z-30
          rounded-tr-2xl
        "
      >
        <NavContent />
      </aside>
    </>
  );
}
