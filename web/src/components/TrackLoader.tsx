"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function TrackLoader() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/track/dashboard"), 2200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="
        w-full 
        min-h-[100dvh] 
        bg-[#EFE4FF] 
        flex flex-col 
        justify-center 
        items-center 
        relative 
        overflow-hidden 
        px-4
      "
    >
      {/* Animated worker icon */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        <Image
          src="/track-loader.gif"
          width={240}
          height={240}
          alt="Track Loading..."
          className="object-contain drop-shadow-xl w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60"
          priority
        />
      </motion.div>

      {/* Glow shadow */}
      <motion.div
        className="
          absolute 
          bottom-[28%] 
          w-28 h-3 
          sm:w-36 sm:h-4 
          bg-[#A259FF]/40 
          blur-2xl 
          rounded-full
        "
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Text */}
      <motion.p
        className="
          text-[#5A0F9F] 
          font-semibold 
          text-xs sm:text-sm 
          mt-10 sm:mt-12 
          tracking-wide 
          text-center
        "
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        Loading track staff tools…
      </motion.p>
    </motion.div>
  );
}
