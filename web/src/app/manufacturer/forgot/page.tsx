"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import Link from "next/link";
import MainHeader from "@/components/Header";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const reset = async () => {
        if (!email) {
            setMsg("Please enter your email.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setMsg("Reset link sent to your email.");
        } catch (error) {
            setMsg("Failed to send reset link.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            <MainHeader />

            {/* Centered card container */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-[90px] md:pt-[110px]">
                <div className="bg-white shadow-2xl rounded-3xl p-6 sm:p-10 w-full max-w-md">

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-[#A259FF] mb-6">
                        Forgot Password
                    </h1>

                    {msg && (
                        <p
                            className={`text-center mb-4 text-sm ${
                                msg.includes("sent") ? "text-green-600" : "text-red-500"
                            }`}
                        >
                            {msg}
                        </p>
                    )}

                    <label className="block text-xs text-gray-600 mb-1">
                        Registered Email
                    </label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full p-3 border rounded-xl mb-6 outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <button
                        onClick={reset}
                        disabled={loading}
                        className="w-full p-3 bg-[#A259FF] text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8b46e6] transition"
                    >
                        {loading ? "Sending…" : "Send Reset Link"}
                    </button>

                    <p className="mt-6 text-center text-[#7F57D1] font-semibold text-sm">
                        <Link href="/manufacturer/login">Back to Login</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
