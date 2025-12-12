// src/app/loader/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoaderPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/intro"), 2500);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen w-full bg-[#F3E8FF] flex items-center justify-center relative overflow-hidden px-4"
        >
            {/* Train GIF */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-[220px] sm:max-w-[260px] md:max-w-[320px] aspect-square flex items-center justify-center"
            >
                <Image
                    src="/loader.gif"
                    width={320}
                    height={320}
                    alt="Loading railway lifecycle system"
                    className="w-full h-full object-contain"
                    priority
                />
            </motion.div>

            {/* Glow shadow */}
            <motion.div
                className="absolute bottom-16 sm:bottom-20 w-28 sm:w-36 h-2 bg-[#C985E6]/30 blur-xl rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.div>
    );
}
