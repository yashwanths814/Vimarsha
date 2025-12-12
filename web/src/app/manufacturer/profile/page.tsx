"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import ManufacturerSidebar from "@/components/ManufacturerSidebar";
import MainHeader from "@/components/Header";
import { auth, db, storage } from "@/shared/firebaseConfig";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AppLoader from "@/components/AppLoader";

type ProfileData = {
    name: string;
    email: string;
    company: string;
    phone: string;
    photoUrl?: string;
};

export default function ManufacturerProfile() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<ProfileData>({
        name: "",
        email: "",
        company: "",
        phone: "",
        photoUrl: "",
    });

    const [saving, setSaving] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);

    // Ensure client-side only
    useEffect(() => setMounted(true), []);

    // Read auth user once mounted
    useEffect(() => {
        if (!mounted) return;
        const user = auth.currentUser;

        if (user) {
            setUserId(user.uid);
            setForm((p) => ({
                ...p,
                email: user.email || "",
                name: user.displayName || "",
            }));
        } else {
            setLoading(false);
        }
    }, [mounted]);

    // Load Firestore profile
    useEffect(() => {
        if (!userId) return;

        async function loadProfile() {
            const refDoc = doc(db, "manufacturerUsers", userId as string);
            const snap = await getDoc(refDoc);

            if (snap.exists()) {
                const data = snap.data() as ProfileData;
                setProfile(data);
                setForm(data);
                setIsEditing(false);
            } else {
                setProfile(null);
                setIsEditing(true);
            }

            setLoading(false);
        }

        loadProfile();
    }, [userId]);

    function handleChange(field: keyof ProfileData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
        if (!userId) return;
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoUploading(true);
        try {
            const fileRef = ref(storage, `manufacturerProfiles/${userId as string}.jpg`);
            await uploadBytes(fileRef, file);

            const url = await getDownloadURL(fileRef);
            setForm((prev) => ({ ...prev, photoUrl: url }));
        } finally {
            setPhotoUploading(false);
        }
    }

    async function handleSave() {
        if (!userId) return;

        setSaving(true);

        const refDoc = doc(db, "manufacturerUsers", userId as string);
        const payload = {
            ...form,
            updatedAt: serverTimestamp(),
        };

        if (profile) {
            await updateDoc(refDoc, payload);
        } else {
            await setDoc(refDoc, payload);
        }

        setProfile(form); // keep only profile fields
        setIsEditing(false);
        setSaving(false);
    }

    // Global loading state
    if (!mounted || loading) {
        return <AppLoader />;
    }

    return (
        <div className="min-h-screen bg-[#F7E8FF]">
            <MainHeader />

            {/* Responsive layout: sidebar top on mobile, side on desktop */}
            <div className="flex flex-col md:flex-row pt-[80px] md:pt-[90px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 md:flex-shrink-0">
                    <ManufacturerSidebar />
                </div>

                {/* MAIN CONTENT CENTERED */}
                <main className="w-full md:ml-64 flex-1 px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-10 flex justify-center">
                    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#A259FF] mb-6 sm:mb-8">
                            Manufacturer Profile
                        </h1>

                        {/* Avatar */}
                        <div className="flex justify-center mb-8 sm:mb-10">
                            <div className="relative">
                                <Image
                                    src={form.photoUrl || "/profile.png"}
                                    width={160}
                                    height={160}
                                    className="rounded-full shadow-2xl object-cover"
                                    alt="Profile"
                                />

                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-[#A259FF] px-3 py-1 text-white text-xs rounded-full cursor-pointer shadow">
                                        {photoUploading ? "Uploading…" : "Change"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5 text-sm">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Name
                                </label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                    disabled={!isEditing}
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Email
                                </label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 bg-gray-100"
                                    disabled
                                    value={form.email}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Company
                                </label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                    disabled={!isEditing}
                                    value={form.company}
                                    onChange={(e) =>
                                        handleChange("company", e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Phone
                                </label>
                                <input
                                    className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#A259FF]/40"
                                    disabled={!isEditing}
                                    value={form.phone}
                                    onChange={(e) =>
                                        handleChange("phone", e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="mt-8 sm:mt-10 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            if (profile) setForm(profile);
                                            setIsEditing(false);
                                        }}
                                        className="px-4 py-2 border rounded-xl text-sm"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving || photoUploading}
                                        className="px-5 py-2 bg-[#A259FF] text-white rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {saving ? "Saving…" : "Save Changes"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-5 py-2 bg-[#A259FF] text-white rounded-xl text-sm"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
