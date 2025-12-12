"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/shared/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import MainHeader from "@/components/Header";
import DepotSidebar from "@/components/DepotSidebar";
import AppLoader from "@/components/AppLoader";

type DepotProfileData = {
    name: string;
    email: string;
    phone: string;
    depot: string;
    empId: string;
    designation: string;
    photoUrl: string;
};

export default function DepotProfile() {
    const router = useRouter();

    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [profile, setProfile] = useState<DepotProfileData | null>(null);
    const [form, setForm] = useState<DepotProfileData>({
        name: "",
        email: "",
        phone: "",
        depot: "",
        empId: "",
        designation: "",
        photoUrl: "",
    });

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push("/depot/login");
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
            // First try depotOfficers collection
            let snap = await getDoc(doc(db, "depotOfficers", uidParam));

            // If not found in depotOfficers, try trackStaff with role="depot"
            if (!snap.exists()) {
                const trackSnap = await getDoc(doc(db, "trackStaff", uidParam));
                if (trackSnap.exists() && trackSnap.data().role === "depot") {
                    const data = trackSnap.data() as any;
                    const normalized: DepotProfileData = {
                        name: data.name ?? "",
                        email: data.email ?? "",
                        phone: data.phone ?? "",
                        depot: data.depot ?? "",
                        empId: data.empId ?? "",
                        designation: data.designation ?? "Depot Officer",
                        photoUrl: data.photoUrl ?? "",
                    };
                    setProfile(normalized);
                    setForm(normalized);
                    setLoading(false);
                    return;
                }
            }

            if (snap.exists()) {
                const data = snap.data() as Partial<DepotProfileData>;
                const normalized: DepotProfileData = {
                    name: data.name ?? "",
                    email: data.email ?? "",
                    phone: data.phone ?? "",
                    depot: data.depot ?? "",
                    empId: data.empId ?? "",
                    designation: data.designation ?? "Depot Officer",
                    photoUrl: data.photoUrl ?? "",
                };
                setProfile(normalized);
                setForm(normalized);
            } else {
                // If no profile doc, prefill from auth user
                const current = auth.currentUser;
                const base: DepotProfileData = {
                    name: current?.displayName ?? "",
                    email: current?.email ?? "",
                    phone: "",
                    depot: "",
                    empId: "",
                    designation: "Depot Officer",
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

        try {
            const fileRef = ref(storage, `depotProfiles/${uid}.jpg`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setForm((prev) => ({ ...prev, photoUrl: url }));
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert("Failed to upload photo. Please try again.");
        }
    };

    const save = async () => {
        if (!uid) return;
        setSaving(true);
        try {
            let updated = false;

            // Check depotOfficers doc
            const depotDoc = await getDoc(doc(db, "depotOfficers", uid));
            if (depotDoc.exists()) {
                await updateDoc(doc(db, "depotOfficers", uid), {
                    ...form,
                    updatedAt: serverTimestamp(),
                });
                updated = true;
            }

            // Also sync with trackStaff if role=depot
            const trackDoc = await getDoc(doc(db, "trackStaff", uid));
            if (trackDoc.exists() && trackDoc.data().role === "depot") {
                await updateDoc(doc(db, "trackStaff", uid), {
                    ...form,
                    updatedAt: serverTimestamp(),
                });
                updated = true;
            }

            // If not found anywhere, create new in depotOfficers
            if (!updated) {
                await setDoc(doc(db, "depotOfficers", uid), {
                    ...form,
                    role: "depot",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }

            setProfile(form);
            setEditing(false);
            alert("Profile updated successfully!");
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

            <div className="flex flex-col lg:flex-row pt-[90px]">
                {/* Depot Sidebar */}
                <DepotSidebar />

                {/* MAIN CONTENT */}
                <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] px-4 sm:px-6 lg:px-10 pb-10">
                    <div className="max-w-5xl mx-auto">
                        {/* Page header */}
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
                            <div>
                                <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                                    Depot &gt; Profile
                                </p>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-[#4B3A7A] tracking-tight">
                                    Depot Officer Profile
                                </h1>
                                <p className="mt-1 text-xs md:text-sm text-gray-600">
                                    Manage your professional details and depot information.
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
                                            className="px-4 py-2 rounded-2xl border border-gray-300 bg-white text-xs md:text-sm hover:bg-gray-50 transition"
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
                        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-purple-100/70 p-5 sm:p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                                {/* Avatar + basic info */}
                                <div className="lg:w-1/3 flex flex-col items-center lg:items-start gap-5 sm:gap-6">
                                    <div className="relative">
                                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                                            <Image
                                                src={form.photoUrl || "/depot-officer.png"}
                                                width={192}
                                                height={192}
                                                className="object-cover w-full h-full"
                                                alt="Depot Officer"
                                                priority
                                            />
                                        </div>
                                        {editing && (
                                            <label className="absolute bottom-2 right-2 bg-[#A259FF] text-white text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer shadow-lg hover:bg-[#8E3FE8] transition flex items-center gap-1.5 sm:gap-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                Change Photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePhoto}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="text-center lg:text-left space-y-3">
                                        <div>
                                            <p className="text-base sm:text-lg font-bold text-[#4B3A7A]">
                                                {form.name || "Depot Officer"}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-600">{form.email}</p>
                                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                                                {form.designation}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            {form.empId && (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7E8FF] text-[#A259FF] text-[11px] sm:text-xs">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                                        />
                                                    </svg>
                                                    <span className="font-semibold">EMP ID: {form.empId}</span>
                                                </div>
                                            )}
                                            {form.depot && (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F8F3] text-[#27AE60] text-[11px] sm:text-xs">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                                                    <span className="font-semibold">Depot: {form.depot}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details form */}
                                <div className="lg:w-2/3 space-y-4 text-sm">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Full Name
                                            </label>
                                            <input
                                                className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                                                disabled={!editing}
                                                value={form.name}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                                placeholder="Enter your full name"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Email (login)
                                            </label>
                                            <input
                                                disabled
                                                className="w-full border border-gray-200 bg-gray-50 px-3 py-2 rounded-xl text-sm text-gray-600"
                                                value={form.email}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Phone Number
                                            </label>
                                            <input
                                                className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                                                disabled={!editing}
                                                value={form.phone}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                                                }
                                                placeholder="Enter contact number"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Depot / Station
                                            </label>
                                            <input
                                                className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                                                disabled={!editing}
                                                value={form.depot}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, depot: e.target.value }))
                                                }
                                                placeholder="Enter depot name"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Employee ID
                                            </label>
                                            <input
                                                className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                                                disabled={!editing}
                                                value={form.empId}
                                                onChange={(e) =>
                                                    setForm((prev) => ({ ...prev, empId: e.target.value }))
                                                }
                                                placeholder="Enter employee ID"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] sm:text-xs text-gray-600 font-medium">
                                                Designation
                                            </label>
                                            <input
                                                className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50 disabled:bg-gray-50"
                                                disabled={!editing}
                                                value={form.designation}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        designation: e.target.value,
                                                    }))
                                                }
                                                placeholder="Enter designation"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 sm:mt-6 p-4 bg-[#F7E8FF] rounded-xl border border-purple-100">
                                        <div className="flex items-start gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 sm:h-5 sm:w-5 text-[#A259FF] mt-0.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <div>
                                                <p className="text-xs font-medium text-[#4B3A7A]">
                                                    Profile Information
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-gray-600 mt-1">
                                                    Your profile details help identify you in depot operations,
                                                    inventory management, and activity logs. Email and Employee ID
                                                    are used for authentication and cannot be changed.
                                                </p>
                                            </div>
                                        </div>
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
