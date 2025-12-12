"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function AppLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full min-h-[100dvh] bg-[#F7E8FF] flex flex-col justify-center items-center px-4 relative overflow-hidden"
    >
      {/* Train GIF */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        <Image
          src="/loader.gif"
          width={300}
          height={300}
          alt="Loading..."
          className="w-40 h-40 md:w-64 md:h-64"
        />
      </motion.div>

      {/* Glow shadow */}
      <motion.div
        className="absolute bottom-24 md:bottom-28 w-32 md:w-40 h-2 bg-[#C985E6]/30 blur-xl rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
