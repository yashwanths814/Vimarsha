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

export default function ManufacturerAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 🔍 If already logged in, check role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data().role : null;
        console.log("Admin-login existing user role:", role);

        if (role === "manufacturer_admin") {
          router.replace("/manufacturer/admin/dashboard");
        } else {
          await signOut(auth);
          setChecking(false);
        }
      } catch (err) {
        console.error("Error in admin-login onAuthStateChanged:", err);
        await signOut(auth);
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return <AppLoader />;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : null;
      console.log("Admin-login after login role:", role);

      if (role !== "manufacturer_admin") {
        setMsg("You are not authorised as Manufacturer Admin.");
        await signOut(auth);
        return;
      }

      router.replace("/manufacturer/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
      <MainHeader />

      <main className="flex-1 flex items-start md:items-center justify-center pt-[90px] md:pt-[100px] px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mt-4 md:mt-0">
          {/* 🔁 Manufacturer / Admin slider */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center bg-[#F2E6FF] rounded-full p-1 text-[11px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={() => router.push("/manufacturer/login")}
                className="
                  px-3 sm:px-4 py-1 rounded-full
                  text-[#6B4FA3]
                  hover:bg-white/80
                  transition
                "
              >
                Manufacturer
              </button>
              <button
                type="button"
                className="
                  px-3 sm:px-4 py-1 rounded-full
                  bg-white text-[#A259FF] shadow-sm
                "
              >
                Admin
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] text-center mb-2">
            Manufacturer Admin Login
          </h1>

          <p className="text-[11px] sm:text-xs text-gray-600 text-center mb-4">
            Use your admin credentials provided by the railway board / HQ.
          </p>

          {msg && (
            <p className="text-xs sm:text-[13px] text-center text-red-500 mb-3">
              {msg}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2 rounded-xl bg-[#A259FF] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8b46e6] transition"
            >
              {loading ? "Checking…" : "Login as Admin"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
