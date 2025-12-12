"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/shared/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import AppLoader from "@/components/AppLoader";

type Props = {
  children: ReactNode;
};

export default function RequireManufacturerAdmin({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setChecking(false);
        router.replace("/manufacturer/admin-login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data().role : null;
        console.log("RequireManufacturerAdmin role:", role);

        if (role === "manufacturer_admin") {
          setAllowed(true);
        } else {
          await signOut(auth);
          setAllowed(false);
          router.replace("/manufacturer/admin-login");
        }
      } catch (err) {
        console.error("Admin guard error:", err);
        await signOut(auth);
        setAllowed(false);
        router.replace("/manufacturer/admin-login");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking) return <AppLoader />;
  if (!allowed) return <AppLoader />; // will redirect

  return <>{children}</>;
}
