"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="
        bg-white/90 
        backdrop-blur-sm
        shadow-md 
        sticky 
        top-0 
        z-50 
        w-full
      "
    >
      <div
        className="
          flex flex-wrap items-center justify-between 
          gap-3 sm:gap-4 md:gap-6
          w-full max-w-6xl 
          mx-auto 
          px-4 sm:px-6 md:px-10 lg:px-16 
          py-2 sm:py-3
        "
      >
        {/* G20 Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="shrink-0"
        >
          <Image
            src="/g20.png"
            width={190}
            height={190}
            alt="G20"
            className="h-8 sm:h-10 md:h-12 lg:h-16 w-auto"
          />
        </motion.div>

        {/* Railway */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="shrink-0"
        >
          <Image
            src="/railway.png"
            width={100}
            height={100}
            alt="Railway"
            className="h-7 sm:h-8 md:h-10 lg:h-12 w-auto"
          />
        </motion.div>

        {/* Ministry */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="shrink-0"
        >
          <Image
            src="/tourism.png"
            width={135}
            height={135}
            alt="Tourism"
            className="h-7 sm:h-8 md:h-10 lg:h-12 w-auto"
          />
        </motion.div>

        {/* Vimarsha */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="shrink-0"
        >
          <Image
            src="/vimarsha.png"
            width={135}
            height={135}
            alt="Vimarsha"
            className="h-7 sm:h-8 md:h-10 lg:h-12 w-auto"
          />
        </motion.div>
      </div>
    </motion.header>
  );
}
