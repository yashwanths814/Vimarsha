"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/shared/firebaseConfig";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        async function doLogout() {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Logout failed:", error);
            }

            // Small delay for user feedback
            setTimeout(() => {
                router.push("/track/login");
            }, 1500);
        }

        doLogout();
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7E8FF]">
            <div className="bg-white shadow-lg rounded-3xl px-10 py-8 text-center space-y-4">
                <h1 className="text-2xl font-bold text-[#A259FF]">Logging Out…</h1>
                <p className="text-sm text-gray-600">
                    You are being safely signed out. Redirecting to login…
                </p>

                <span className="h-3 w-3 rounded-full border-2 border-[#A259FF] border-t-transparent animate-spin inline-block"></span>
            </div>
        </div>
    );
}
