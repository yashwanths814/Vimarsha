"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import MainHeader from "@/components/Header";

export default function ManufacturerRegister() {
    const router = useRouter();

    const [form, setForm] = useState({
        empId: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        company: "",
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const update = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const register = async (e: FormEvent) => {
        e.preventDefault();
        setMsg(null);

        if (!form.empId || !form.name || !form.email || !form.company) {
            setMsg("Please fill all required fields.");
            return;
        }

        if (form.password.length < 6) {
            setMsg("Password must be at least 6 characters.");
            return;
        }

        try {
            setLoading(true);

            // create auth user
            const res = await createUserWithEmailAndPassword(
                auth,
                form.email,
                form.password
            );

            // save full profile in firestore
            await setDoc(doc(db, "users", res.user.uid), {
                empId: form.empId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                company: form.company,
                role: "manufacturer",
                createdAt: new Date().toISOString(),
            });

            router.push("/manufacturer/login");
        } catch (error: any) {
            console.error(error);
            setMsg(
                error?.message?.includes("auth/email-already-in-use")
                    ? "Email already in use."
                    : "Registration failed. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            <MainHeader />

            <main className="flex-1 flex justify-center items-center px-4 sm:px-6 pt-[90px] md:pt-[110px] pb-8">
                <div className="bg-white shadow-2xl p-6 sm:p-8 md:p-10 rounded-3xl w-full max-w-lg">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-[#A259FF] mb-2">
                        Manufacturer Registration
                    </h1>
                    <p className="text-center text-xs text-gray-500 mb-5">
                        Create an account to start adding track fittings.
                    </p>

                    {msg && (
                        <p className="mb-3 text-xs text-center text-red-500 whitespace-pre-line">
                            {msg}
                        </p>
                    )}

                    <form onSubmit={register} className="grid grid-cols-1 gap-4 text-sm">
                        <input
                            name="empId"
                            placeholder="Employee ID*"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.empId}
                        />

                        <input
                            name="name"
                            placeholder="Full Name*"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.name}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Official Email*"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.email}
                        />

                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.phone}
                        />

                        <input
                            name="company"
                            placeholder="Company Name*"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.company}
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password (min 6 characters)*"
                            className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                            onChange={update}
                            value={form.password}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 p-3 bg-[#A259FF] hover:bg-[#8F3FEA] text-white rounded-xl font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {loading ? "Creating account…" : "Create Account"}
                        </button>
                    </form>

                    <p
                        onClick={() => router.push("/manufacturer/login")}
                        className="mt-4 text-center text-[#7F57D1] font-semibold cursor-pointer text-xs sm:text-sm"
                    >
                        Already have an account? Login
                    </p>
                </div>
            </main>
        </div>
    );
}
