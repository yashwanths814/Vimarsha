"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";

export default function DepotLogin() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [empId, setEmpId] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // -------------------------------------------------------
    // AUTH CHECK - Check if user is already logged in as depot officer
    // -------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setChecking(false);
                return;
            }

            try {
                // FIRST: depotOfficers collection
                const depotDoc = await getDoc(doc(db, "depotOfficers", user.uid));

                if (depotDoc.exists()) {
                    router.replace("/depot");
                    return;
                }

                // SECOND: trackStaff with role="depot"
                const trackDoc = await getDoc(doc(db, "trackStaff", user.uid));

                if (trackDoc.exists() && trackDoc.data().role === "depot") {
                    router.replace("/depot");
                    return;
                }

                // If neither, logout
                await signOut(auth);
                setChecking(false);
            } catch (error) {
                console.error("Error checking depot officer:", error);
                await signOut(auth);
                setChecking(false);
            }
        });

        return () => unsub();
    }, [router]);

    // -------------------------------------------------------
    // SHOW LOADER DURING INITIAL CHECK
    // -------------------------------------------------------
    if (checking) {
        return <AppLoader />;
    }

    // -------------------------------------------------------
    // LOGIN HANDLER - Check both collections
    // -------------------------------------------------------
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setLoading(true);

        if (!empId.trim() || !email.trim() || !password.trim()) {
            setMsg("❌ Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            const cred = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            let userData: any = null;

            // FIRST: depotOfficers collection
            const depotDoc = await getDoc(doc(db, "depotOfficers", cred.user.uid));
            if (depotDoc.exists()) {
                userData = depotDoc.data();
            } else {
                // SECOND: trackStaff collection with role="depot"
                const trackDoc = await getDoc(doc(db, "trackStaff", cred.user.uid));
                if (trackDoc.exists() && trackDoc.data().role === "depot") {
                    userData = trackDoc.data();
                }
            }

            if (!userData) {
                setMsg("❌ This account is not registered as a Depot Officer.");
                await signOut(auth);
                setLoading(false);
                return;
            }

            if (userData.empId !== empId.trim()) {
                setMsg("❌ Employee ID does not match this account.");
                await signOut(auth);
                setLoading(false);
                return;
            }

            if (userData.status && userData.status !== "active") {
                setMsg(
                    `❌ Your account is ${userData.status}. Please contact administrator.`
                );
                await signOut(auth);
                setLoading(false);
                return;
            }

            router.replace("/depot");
        } catch (err: any) {
            let errorMessage = "Login failed";

            if (err.code === "auth/invalid-email") {
                errorMessage = "❌ Invalid email format.";
            } else if (err.code === "auth/user-not-found") {
                errorMessage = "❌ No account found with this email.";
            } else if (err.code === "auth/wrong-password") {
                errorMessage = "❌ Incorrect password.";
            } else if (err.code === "auth/too-many-requests") {
                errorMessage =
                    "❌ Too many failed attempts. Please try again later.";
            } else if (err.code === "auth/network-request-failed") {
                errorMessage = "❌ Network error. Please check your connection.";
            } else if (err.code === "auth/user-disabled") {
                errorMessage = "❌ This account has been disabled.";
            } else {
                errorMessage = `❌ ${
                    err.message || "An error occurred during login."
                }`;
            }

            setMsg(errorMessage);
            setLoading(false);
        }
    }

    // -------------------------------------------------------
    // RENDER
    // -------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            <div className="flex justify-center px-4 pb-10 pt-[96px] sm:pt-[120px]">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mt-2 sm:mt-4 p-6 sm:p-8">
                    {/* ICON + HEADING */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#A259FF] mb-3 sm:mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#4B3A7A] mb-1 sm:mb-2">
                            Depot Officer Login
                        </h1>
                        <p className="text-gray-600 text-xs sm:text-sm">
                            Access the depot management portal
                        </p>
                    </div>

                    {/* MESSAGE BANNER */}
                    {msg && (
                        <div
                            className={`mb-5 sm:mb-6 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-center ${
                                msg.includes("✅")
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                        >
                            {msg}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                Employee ID
                            </label>
                            <input
                                type="text"
                                value={empId}
                                onChange={(e) => setEmpId(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                                placeholder="Enter your employee ID"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                Official Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                                placeholder="Enter your official email"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 bg-[#A259FF] hover:bg-[#8B46FF] text-white text-sm sm:text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Logging in...
                                </>
                            ) : (
                                "Login as Depot Officer"
                            )}
                        </button>
                    </form>

                    {/* LINKS SECTION */}
                    <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 space-y-3">
                        <p className="text-center text-xs sm:text-sm text-gray-600">
                            New Depot Officer?{" "}
                            <button
                                onClick={() => router.push("/depot/register")}
                                className="text-[#A259FF] font-semibold hover:underline"
                            >
                                Register here
                            </button>
                        </p>

                        <p className="text-center text-xs sm:text-sm text-gray-600">
                            Forgot your password?{" "}
                            <button
                                onClick={() => router.push("/depot/forgot")}
                                className="text-[#A259FF] font-semibold hover:underline"
                            >
                                Reset here
                            </button>
                        </p>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-center text-[11px] sm:text-xs text-gray-500 mb-2">
                                Not a Depot Officer?
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => router.push("/track/login")}
                                    className="text-[11px] sm:text-xs text-[#A259FF] hover:underline"
                                >
                                    Track Staff Login
                                </button>
                                <button
                                    onClick={() => router.push("/admin/login")}
                                    className="text-[11px] sm:text-xs text-[#27AE60] hover:underline"
                                >
                                    Admin Login
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER NOTE */}
                    <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-200">
                        <p className="text-[10px] sm:text-xs text-center text-gray-500">
                            Depot Management System • v1.0 • Authorized Personnel Only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
