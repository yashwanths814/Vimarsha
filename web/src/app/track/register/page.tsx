"use client";

import { useState, ChangeEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function TrackRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    empId: "",
    name: "",
    email: "",
    phone: "",
    depot: "",
    role: "installation", // DEFAULT
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const register = async () => {
    if (loading) return;

    setMsg("");

    // ---------------------------
    // VALIDATION
    // ---------------------------
    if (
      !form.empId.trim() ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.depot.trim()
    ) {
      setMsg("All fields are required.");
      return;
    }

    if (!form.email.includes("@")) {
      setMsg("Enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // Firebase Auth signup
      const res = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      // Firestore document
      await setDoc(doc(db, "trackStaff", res.user.uid), {
        empId: form.empId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        depot: form.depot.trim(),
        role: form.role, // IMPORTANT — ROLE SAVED
        createdAt: new Date().toISOString(),
      });

      router.push("/track/login");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex justify-center items-center px-4 py-6">
      <div className="bg-white/95 shadow-2xl rounded-3xl w-full max-w-md px-6 py-7 md:px-8 md:py-9">
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E8FF] border border-[#E4D4FF] text-[10px] font-semibold text-[#A259FF] uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A259FF]" />
            Track Fitting Portal
          </span>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-[#4B3A7A] text-center">
            Track Staff Registration
          </h1>
          <p className="mt-1 text-[11px] text-gray-500 text-center max-w-sm">
            Create your account to access installation and maintenance workflows.
          </p>
        </div>

        {msg && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600 text-center">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Employee ID
            </label>
            <input
              name="empId"
              placeholder="Enter Employee ID"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.empId}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Full Name
            </label>
            <input
              name="name"
              placeholder="Enter full name"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.name}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Official Email
            </label>
            <input
              name="email"
              placeholder="name@railway.gov.in"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.email}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Phone Number
            </label>
            <input
              name="phone"
              placeholder="10-digit mobile number"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.phone}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Depot / Section
            </label>
            <input
              name="depot"
              placeholder="e.g., SBC Yard, Mysuru Section"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.depot}
            />
          </div>

          {/* ROLE SELECTOR */}
          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Role
            </label>
            <select
              name="role"
              onChange={update}
              value={form.role}
              className="w-full p-2.5 border rounded-xl text-xs text-gray-700 mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 bg-white"
            >
              <option value="installation">Installation Staff</option>
              <option value="maintenance">Maintenance Staff</option>
              <option value="engineer">Engineer</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-gray-600 font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              onChange={update}
              value={form.password}
            />
          </div>
        </div>

        <button
          onClick={register}
          disabled={loading}
          className="w-full mt-6 py-2.5 bg-[#A259FF] hover:bg-[#8F3FEA] text-white rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Creating Account…" : "Register"}
        </button>

        <p
          onClick={() => router.push("/track/login")}
          className="mt-4 text-center text-[#7F57D1] font-semibold text-xs cursor-pointer hover:underline"
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
