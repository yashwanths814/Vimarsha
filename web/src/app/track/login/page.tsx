"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function TrackLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("installation");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // just store existing user, no auto redirect
  const [existingUser, setExistingUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setExistingUser(u);
    });
    return () => unsub();
  }, []);

  function redirectByRole(role: string) {
    if (role === "installation") router.push("/track/installation");
    else if (role === "maintenance") router.push("/track/maintenance/dashboard");
    else if (role === "engineer") router.push("/track/engineer");
    else router.push("/track/dashboard");
  }

  async function handleLogin() {
    setMsg(null);

    if (!empId.trim() || !email.trim() || !password.trim()) {
      setMsg("Please fill all fields before logging in.");
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, "trackStaff", cred.user.uid));

      if (!userDoc.exists()) {
        setMsg("This account is not registered as Track Staff.");
        setLoading(false);
        return;
      }

      const data = userDoc.data();

      if (data.empId !== empId.trim()) {
        setMsg("❌ Employee ID does not match this account.");
        setLoading(false);
        return;
      }

      if (data.role !== selectedRole) {
        setMsg(`❌ Role mismatch. You are registered as: ${data.role}`);
        setLoading(false);
        return;
      }

      redirectByRole(data.role);
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // allow pressing Enter to submit
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex items-center justify-center px-4 py-6">
      <div
        className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-6 py-7 md:px-8 md:py-9"
        onKeyDown={handleKeyDown}
      >
        {/* Small badge / app label */}
        <div className="flex items-center justify-center mb-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E8FF] border border-[#E4D4FF] text-[10px] font-semibold text-[#A259FF] uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A259FF]" />
            Track Fitting Portal
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-center text-[#4B3A7A] mb-1">
          Track Staff Login
        </h1>

        <p className="text-center text-[11px] text-gray-500 mb-4">
          Use your official email and Employee ID to continue.
        </p>

        {existingUser && (
          <p className="text-[10px] text-center text-gray-400 mb-2">
            Logged in as:{" "}
            <span className="font-medium text-[#A259FF]">
              {existingUser.email}
            </span>
          </p>
        )}

        {msg && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600 text-center">
            {msg}
          </div>
        )}

        {/* FORM */}
        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-700">
              Employee ID
            </label>
            <input
              type="text"
              placeholder="Enter Employee ID"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-700">
              Official Email
            </label>
            <input
              type="email"
              placeholder="name@railway.gov.in"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-700">
              Login As
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 bg-white"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="installation">Installation Staff</option>
              <option value="maintenance">Maintenance Staff</option>
              <option value="engineer">Engineer</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2.5 md:py-3 rounded-2xl bg-[#A259FF] text-white font-semibold text-sm shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Please wait…" : "Login"}
        </button>

        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-[#A259FF] font-medium hover:underline"
          onClick={() => router.push("/track/forgot")}
        >
          Forgot Password?
        </button>

        <p className="mt-4 text-center text-[11px] text-gray-600">
          New Track Staff?{" "}
          <button
            type="button"
            className="text-[#A259FF] font-semibold hover:underline"
            onClick={() => router.push("/track/register")}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
