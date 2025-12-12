// src/app/home/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MainHeader from "@/components/Header";

type Role = {
  name: string;
  link: string;
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for Framer Motion + layout
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const roles: Role[] = [
    { name: "Vendor", link: "/manufacturer/login" },
    { name: "Depot", link: "/depot/login" },
    { name: "Track Staff", link: "/track/login" },
    { name: "Admin", link: "/admin" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F7E8FF] flex flex-col">
      {/* GLOBAL HEADER */}
      <MainHeader />

      {/* PAGE BODY */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#A259FF] mb-4 sm:mb-6 text-center"
        >
          Select User Role
        </motion.h2>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xs sm:text-sm md:text-base text-[#6B4FA3] mb-8 sm:mb-10 text-center max-w-xl"
        >
          Choose the portal that matches your role in the Track Fittings Digital
          Ecosystem.
        </motion.p>

        {/* ROLE BUTTONS */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 justify-center items-center">
          {roles.map((role, i) => (
            <Link href={role.link} key={role.name} className="w-full sm:w-auto">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0px 16px 32px #c092ff55",
                }}
                whileTap={{ scale: 0.97 }}
                className="
                  w-full sm:w-56 md:w-64
                  h-14 sm:h-40 md:h-44
                  bg-white 
                  rounded-3xl 
                  shadow-xl 
                  flex items-center justify-center 
                  text-base sm:text-xl md:text-2xl 
                  font-semibold text-[#2A2A2A]
                  transition-all
                "
                aria-label={`Login as ${role.name}`}
              >
                {role.name}
              </motion.button>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
