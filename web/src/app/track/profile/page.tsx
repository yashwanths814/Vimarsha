"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MainHeader from "@/components/Header";
import TrackSidebar from "@/components/TrackSidebar";
import AppLoader from "@/components/AppLoader";

type TrackProfileData = {
  name: string;
  email: string;
  phone: string;
  depot: string;
  photoUrl: string;
};

export default function TrackProfile() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState<TrackProfileData | null>(null);
  const [form, setForm] = useState<TrackProfileData>({
    name: "",
    email: "",
    phone: "",
    depot: "",
    photoUrl: "",
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/track/login");
        return;
      }

      const userId = user.uid;
      setUid(userId);
      await loadProfile(userId);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile(uidParam: string) {
    try {
      const snap = await getDoc(doc(db, "trackUsers", uidParam));
      if (snap.exists()) {
        const data = snap.data() as Partial<TrackProfileData>;
        const normalized: TrackProfileData = {
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          depot: data.depot ?? "",
          photoUrl: data.photoUrl ?? "",
        };
        setProfile(normalized);
        setForm(normalized);
      } else {
        // if no profile doc, at least prefill email from auth user
        const current = auth.currentUser;
        const base: TrackProfileData = {
          name: current?.displayName ?? "",
          email: current?.email ?? "",
          phone: "",
          depot: "",
          photoUrl: "",
        };
        setProfile(base);
        setForm(base);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uid) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const fileRef = ref(storage, `trackProfiles/${uid}.jpg`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    setForm((prev) => ({ ...prev, photoUrl: url }));
  };

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "trackUsers", uid), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setProfile(form);
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF]">
      <MainHeader />

      <div className="flex pt-[90px]">
        {/* Sidebar – hidden on mobile, visible from lg */}
        <div className="hidden lg:block">
          <TrackSidebar />
        </div>

        {/* MAIN CONTENT */}
        <main
          className="
            w-full px-4 pb-10
            lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-10
          "
        >
          <div className="max-w-4xl mx-auto">
            {/* Mobile back row */}
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/80 text-[11px] font-medium text-[#A259FF] shadow-sm border border-purple-100"
              >
                ← Back
              </button>
              <span className="text-[10px] px-3 py-1 rounded-full bg-white/80 border border-purple-100 text-[#A259FF] font-semibold">
                Track Profile
              </span>
            </div>

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
              <div>
                <p className="hidden lg:block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Track &gt; Profile
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                  Track Staff Profile
                </h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  View and update your profile details used across installation workflows.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 md:px-6 py-2 rounded-2xl bg-[#A259FF] text-white text-xs md:text-sm font-semibold shadow-md hover:bg-[#8E3FE8] transition"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        if (profile) setForm(profile);
                      }}
                      className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-xs md:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="px-4 md:px-6 py-2 rounded-2xl bg-[#A259FF] text-white text-xs md:text-sm font-semibold shadow-md hover:bg-[#8E3FE8] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      {saving && (
                        <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                      )}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card */}
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar + basic info */}
                <div className="md:w-1/3 flex flex-col items-center md:items-start gap-4">
                  <div className="relative">
                    <Image
                      src={form.photoUrl || "/profile.png"}
                      width={150}
                      height={150}
                      className="rounded-full object-cover shadow-xl border-4 border-white"
                      alt="Profile"
                    />
                    {editing && (
                      <label className="absolute bottom-1 right-1 bg-[#A259FF] text-white text-[10px] px-3 py-1 rounded-full cursor-pointer shadow-md">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhoto}
                        />
                      </label>
                    )}
                  </div>

                  <div className="text-center md:text-left">
                    <p className="text-sm font-semibold text-[#4B3A7A]">
                      {form.name || "Unnamed Staff"}
                    </p>
                    <p className="text-[11px] text-gray-500">{form.email}</p>
                    {form.depot && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-[#F7E8FF] text-[#A259FF]">
                        Depot: <span className="font-semibold">{form.depot}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Details form */}
                <div className="md:w-2/3 space-y-4 text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-medium">
                        Full Name
                      </label>
                      <input
                        className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                        disabled={!editing}
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-medium">
                        Email (login)
                      </label>
                      <input
                        disabled
                        className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded-xl text-xs text-gray-600"
                        value={form.email}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-medium">
                        Phone Number
                      </label>
                      <input
                        className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                        disabled={!editing}
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-500 font-medium">
                        Depot / Station
                      </label>
                      <input
                        className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                        disabled={!editing}
                        value={form.depot}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, depot: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-gray-400 border-t border-dashed border-purple-100 pt-3">
                    These details help supervisors identify who performed installation
                    activities and at which depot.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
