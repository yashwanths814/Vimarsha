// src/app/intro/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function IntroPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/home"), 4000);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen w-full bg-[#F3E8FF] flex flex-col items-center justify-center px-4"
        >
            {/* Logo animation */}
            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full max-w-[200px] sm:max-w-[260px] md:max-w-[320px] aspect-square flex items-center justify-center"
            >
                <Image
                    src="/vimarsha.png"
                    width={320}
                    height={320}
                    alt="Vimarsha logo"
                    className="w-full h-full object-contain"
                    priority
                />
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.9 }}
                className="mt-6 text-3xl sm:text-4xl font-bold text-[#A259FF] text-center"
            >
                Vimarsha
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.9 }}
                className="mt-2 text-sm sm:text-base md:text-lg text-[#7F57D1] text-center max-w-xs sm:max-w-md"
            >
                Track Fittings Digital Ecosystem
            </motion.p>
        </motion.div>
    );
}
