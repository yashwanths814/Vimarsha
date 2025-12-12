"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import MainHeader from "@/components/Header";

export default function LogoutPage() {
    useEffect(() => {
        // Clear session cookie
        document.cookie = "__session=; Max-Age=0; path=/";

        signOut(auth).finally(() => {
            // Hard redirect ensures full state reset
            window.location.href = "/manufacturer/login";
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            <MainHeader />

            <main className="flex-1 flex items-center justify-center px-4 pt-[90px] md:pt-[110px]">
                <div className="bg-white px-6 py-4 rounded-2xl shadow text-center">
                    <p className="text-sm font-semibold text-[#6B4FA3]">
                        Logging out…
                    </p>
                </div>
            </main>
        </div>
    );
}
