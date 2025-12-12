"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

type RequireDepotProps = {
  children: ReactNode;
};

export default function RequireDepot({ children }: RequireDepotProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/depot/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "trackStaff", user.uid));

        if (!snap.exists() || snap.data()?.role !== "depot") {
          router.push("/depot/login");
          return;
        }

        setAllowed(true);
      } catch (err) {
        console.error("Error checking depot permissions:", err);
        router.push("/depot/login");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking || !allowed) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#F7E8FF] px-4">
        <div className="h-10 w-10 border-4 border-[#A259FF] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-gray-600 text-center">
          Verifying depot access…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
