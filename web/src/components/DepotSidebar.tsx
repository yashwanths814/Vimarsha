"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import { useState } from "react";

export default function DepotSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { label: "Dashboard", href: "/depot", icon: "🏛️" },
    { label: "Scan Material", href: "/depot/scan", icon: "📷" },
    { label: "Requests", href: "/depot/requests", icon: "📝" },
    { label: "Profile", href: "/depot/profile", icon: "👤" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/depot" && pathname.startsWith(href));

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all
    ${
      isActive(href)
        ? "bg-[#A259FF] text-white shadow-md"
        : "text-gray-700 hover:bg-gray-100 hover:text-[#A259FF]"
    }`;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.push("/depot/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const NavContent = () => (
    <>
      {/* Header */}
      <div className="h-[64px] flex items-center justify-center border-b border-gray-200 px-3">
        <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-[#A259FF] tracking-wide text-center">
          DEPOT OFFICER
        </h1>
      </div>

      {/* Nav Links */}
      <nav className="px-3 sm:px-4 py-4 space-y-2 flex-1 overflow-y-auto">
        {links.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={linkClass(item.href)}
            onClick={() => setOpen(false)}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer: Depot info + actions */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-100 space-y-2">
        {/* Depot info */}
        <div className="p-2.5 sm:p-3 bg-[#F7E8FF] rounded-lg border border-purple-100">
          <p className="text-[11px] sm:text-xs text-gray-600 font-medium">
            Depot Portal
          </p>
          <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
            Authorized access only
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="
            flex items-center justify-center gap-2 
            w-full px-3 py-2.5 sm:px-4 sm:py-3 
            rounded-xl 
            bg-red-50 text-red-600 hover:bg-red-100 
            font-medium text-xs sm:text-sm 
            transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <span className="text-lg">🚪</span>
          <span>{loggingOut ? "Logging out…" : "Logout"}</span>
        </button>

        {/* Back to Home */}
        <Link
          href="/"
          className="
            flex items-center justify-center gap-2 
            w-full mt-1 
            px-3 py-2 sm:px-4 sm:py-2.5 
            rounded-xl 
            bg-gray-50 text-gray-600 hover:bg-gray-100 
            font-medium text-[11px] sm:text-xs 
            transition-colors
          "
          onClick={() => setOpen(false)}
        >
          <span>🏠</span>
          <span className="truncate">Back to Home</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* 📱 Mobile hamburger button */}
      <button
        type="button"
        aria-label="Open depot menu"
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
        <span>Depot</span>
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
            bg-white/90 backdrop-blur-xl
            border-r border-gray-200
            shadow-xl
            flex flex-col
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
          bg-white/80 backdrop-blur-xl 
          border-r border-gray-200 
          shadow-lg z-30
          flex-col
        "
      >
        <NavContent />
      </aside>
    </>
  );
}
