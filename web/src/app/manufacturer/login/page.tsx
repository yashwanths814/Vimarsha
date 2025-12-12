"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import MainHeader from "@/components/Header";
import AppLoader from "@/components/AppLoader";

type Mode = "login" | "signup";

export default function ManufacturerLoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [empId, setEmpId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // 🔁 Redirect based on stored Firestore role
  async function redirectBasedOnRole(uid: string) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      const role = snap.exists() ? snap.data().role : "manufacturer";

      if (role === "manufacturer_admin" || role === "admin") {
        router.push("/manufacturer/admin/dashboard");
      } else {
        router.push("/manufacturer/dashboard");
      }
    } catch (err) {
      console.error("Error reading user role, defaulting to manufacturer:", err);
      router.push("/manufacturer/dashboard");
    }
  }

  // If already logged in, route by role (no blink, show loader)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        redirectBasedOnRole(u.uid);
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function ensureUserDoc(uid: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        name: name || email.split("@")[0],
        email,
        empId,
        role: "manufacturer", // 👈 this page ONLY creates manufacturer users
        joinedOn: new Date().toISOString().slice(0, 10),
        totalAdded: 0,
      });
    }
  }

  async function handleLogin() {
    setMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user.uid); // ensures doc for old accounts
      await redirectBasedOnRole(cred.user.uid);
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setMsg(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user.uid);
      router.push("/manufacturer/dashboard");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email) {
      setMsg("Enter your email above first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset mail sent.");
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Failed to send reset mail");
    }
  }

  // While checking existing session, show loader
  if (checking) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7E8FF] flex flex-col">
      <MainHeader />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-[90px] md:pt-[110px]">
        <div className="bg-white shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-md">
          {/* User Type Toggle – Admin pill just redirects to admin login page */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex rounded-full bg-[#F3E8FF] p-1">
              <button
                type="button"
                className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition bg-white text-[#A259FF] shadow-sm"
              >
                Manufacturer
              </button>
              <button
                type="button"
                onClick={() => {
                  setMsg(null);
                  console.log("➡️ Going to /manufacturer/admin-login");
                  router.push("/manufacturer/admin-login"); // 👈 IMPORTANT
                }}
                className="px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition text-gray-500 hover:text-[#A259FF]"
              >
                Admin
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-[#A259FF] mb-2">
            Manufacturer {mode === "login" ? "Login" : "Sign Up"}
          </h1>

          <p className="text-center text-xs text-gray-500 mb-6">
            Use your registered email & employee ID.
          </p>

          {msg && (
            <p className="mb-3 text-xs text-center text-red-500 whitespace-pre-line">
              {msg}
            </p>
          )}

          {/* NAME only in signup for Manufacturer */}
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-xl mb-3 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
            />
          )}

          <input
            type="text"
            placeholder="Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="w-full p-3 border rounded-xl mb-3 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
          />

          <input
            type="email"
            placeholder="Official Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-xl mb-3 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
          />

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-[#A259FF]/40"
          />

          <button
            onClick={mode === "login" ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full p-3 rounded-xl bg-[#A259FF] text-white font-semibold hover:bg-[#8F3FEA] text-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>

          <button
            type="button"
            onClick={handleForgot}
            className="mt-3 text-xs text-[#A259FF] hover:underline"
          >
            Forgot password?
          </button>

          {/* Mode switch */}
          <div className="mt-4 text-xs text-center text-gray-600">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-[#A259FF] font-semibold"
                  onClick={() => {
                    setMode("signup");
                    setMsg(null);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  className="text-[#A259FF] font-semibold"
                  onClick={() => {
                    setMode("login");
                    setMsg(null);
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
