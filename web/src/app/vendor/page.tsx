"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function VendorDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col items-center px-4 pt-24 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#E4D4FF] text-[10px] font-semibold text-[#A259FF] uppercase tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A259FF]" />
          Vendor Portal
        </span>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-[#4B3A7A]">
          Manufacturer Dashboard
        </h1>
        <p className="mt-1 text-[11px] md:text-sm text-gray-600">
          Manage QR-enabled materials and view manufacturing records.
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-3xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Link href="/vendor/add">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-40 md:h-44 bg-white/95 rounded-2xl shadow-lg border border-purple-100 flex flex-col items-start justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-2xl mb-1">➕</p>
                <p className="text-base md:text-lg font-semibold text-[#4B3A7A]">
                  Add Material
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Create a new material entry and auto-generate QR.
                </p>
              </div>
              <span className="text-[10px] text-[#A259FF] font-semibold">
                Start &rarr;
              </span>
            </motion.button>
          </Link>

          <Link href="/vendor/list">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-40 md:h-44 bg-white/95 rounded-2xl shadow-lg border border-purple-100 flex flex-col items-start justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-2xl mb-1">📦</p>
                <p className="text-base md:text-lg font-semibold text-[#4B3A7A]">
                  View Materials
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Browse all manufactured materials and their QR codes.
                </p>
              </div>
              <span className="text-[10px] text-[#A259FF] font-semibold">
                Open list &rarr;
              </span>
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
