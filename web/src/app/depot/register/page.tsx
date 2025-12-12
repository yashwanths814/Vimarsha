"use client";

import { useState, type ChangeEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type DepotRegisterForm = {
    empId: string;
    name: string;
    email: string;
    phone: string;
    depot: string;
    password: string;
    confirmPassword: string;
};

export default function DepotRegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState<DepotRegisterForm>({
        empId: "",
        name: "",
        email: "",
        phone: "",
        depot: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const update = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const register = async () => {
        setMsg("");

        const empId = form.empId.trim();
        const name = form.name.trim();
        const email = form.email.trim();
        const phone = form.phone.trim();
        const depot = form.depot.trim();
        const password = form.password;
        const confirmPassword = form.confirmPassword;

        // VALIDATION
        if (!empId || !name || !email || !phone || !depot || !password) {
            setMsg("❌ All fields are required.");
            return;
        }

        if (!email.includes("@")) {
            setMsg("❌ Enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setMsg("❌ Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setMsg("❌ Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            // Firebase Auth - Create user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const userId = userCredential.user.uid;

            // Firestore document in depotOfficers collection
            await setDoc(doc(db, "depotOfficers", userId), {
                empId,
                name,
                email,
                phone,
                depot,
                designation: "Depot Officer",
                status: "active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            setMsg("✅ Account created successfully! Redirecting to login...");

            setTimeout(() => {
                auth.signOut().then(() => {
                    router.push("/depot/login");
                });
            }, 2000);
        } catch (err: any) {
            console.error(err);

            let errorMessage = "Registration failed.";

            if (err.code === "auth/email-already-in-use") {
                errorMessage = "❌ This email is already registered.";
            } else if (err.code === "auth/invalid-email") {
                errorMessage = "❌ Invalid email address.";
            } else if (err.code === "auth/weak-password") {
                errorMessage = "❌ Password is too weak.";
            } else if (err.code === "auth/operation-not-allowed") {
                errorMessage = "❌ Email/password accounts are not enabled.";
            } else {
                errorMessage = `❌ ${err.message || "Registration failed."}`;
            }

            setMsg(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7E8FF] flex justify-center items-center px-4 sm:px-6 py-8">
            <div className="bg-white shadow-2xl p-6 sm:p-8 md:p-10 rounded-3xl w-full max-w-lg border border-purple-100">

                {/* HEADER */}
                <div className="text-center mb-6 sm:mb-8">
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#4B3A7A] mb-1 sm:mb-2">
                        Depot Officer Registration
                    </h1>
                    <p className="text-gray-600 text-xs sm:text-sm">
                        Create your depot management account
                    </p>
                </div>

                {/* MESSAGE */}
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
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Employee ID *
                        </label>
                        <input
                            name="empId"
                            value={form.empId}
                            placeholder="Enter your employee ID (e.g., DEP001)"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Full Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Official Email *
                        </label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            placeholder="Enter your official email"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Phone Number *
                        </label>
                        <input
                            name="phone"
                            value={form.phone}
                            placeholder="Enter your phone number"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Depot / Station *
                        </label>
                        <input
                            name="depot"
                            value={form.depot}
                            placeholder="Enter your depot or station name"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Password *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            placeholder="Create a password (min. 6 characters)"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            placeholder="Confirm your password"
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm transition"
                            onChange={update}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    onClick={register}
                    disabled={loading}
                    className="w-full mt-6 py-2.5 sm:py-3 bg-[#A259FF] hover:bg-[#8B46FF] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center text-sm sm:text-base"
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
                            Creating Account...
                        </>
                    ) : (
                        "Register as Depot Officer"
                    )}
                </button>

                {/* FOOTER LINKS */}
                <div className="mt-6 pt-5 sm:pt-6 border-t border-gray-200">
                    <p className="text-center text-xs sm:text-sm text-gray-600">
                        Already have an account?{" "}
                        <button
                            onClick={() => router.push("/depot/login")}
                            className="text-[#A259FF] font-semibold hover:underline"
                        >
                            Login here
                        </button>
                    </p>

                    <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
                        By registering, you agree to the depot management terms and conditions.
                    </p>
                </div>
            </div>
        </div>
    );
}
