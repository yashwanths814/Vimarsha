"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/shared/firebaseConfig";
import { useRouter } from "next/navigation";

export default function TrackForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const reset = async () => {
    if (!email.trim()) {
      setMsgType("error");
      setMsg("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      setMsg(null);
      setMsgType(null);

      await sendPasswordResetEmail(auth, email.trim());
      setMsgType("success");
      setMsg("Reset link has been sent to your email.");
    } catch (error: any) {
      console.error("RESET ERROR:", error);
      let text = "Failed to send reset link. Please check your email.";
      if (error?.code === "auth/user-not-found") {
        text = "No account found with this email.";
      } else if (error?.code === "auth/invalid-email") {
        text = "Please enter a valid email address.";
      }
      setMsgType("error");
      setMsg(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl px-5 sm:px-8 py-8 space-y-5 border border-[#E5D4FF]">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF]">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Enter your registered email, and we’ll send you a reset link.
          </p>
        </div>

        {/* Message */}
        {msg && (
          <div
            className={`w-full text-xs sm:text-sm px-3 py-2 rounded-xl text-center ${
              msgType === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {msg}
          </div>
        )}

        {/* Email input */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-gray-700"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/60 focus:border-[#A259FF]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Reset button */}
        <button
          onClick={reset}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#A259FF] text-white text-sm font-semibold shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading && (
            <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
          )}
          {loading ? "Sending reset link..." : "Send Reset Link"}
        </button>

        {/* Back to login */}
        <p className="pt-2 text-center text-xs sm:text-sm text-[#7F57D1] font-semibold">
          <button
            type="button"
            onClick={() => router.push("/track/login")}
            className="hover:underline"
          >
            ← Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
