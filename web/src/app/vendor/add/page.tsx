"use client";

import { useState, ChangeEvent } from "react";
import { db, storage } from "@/shared/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
// @ts-ignore -- no type declarations for 'qrcode'
import QRCode from "qrcode";

export default function AddMaterialPage() {
  const [form, setForm] = useState({
    manufacturerId: "",
    drawingNumber: "",
    fittingType: "",
    materialSpecs: "",
    weight: "",
    gauge: "",
    mfgDate: "",
    expectedLife: "",
    batchNumber: "",
    purchaseOrder: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Auto Material ID Generator
  const generateMaterialId = () => {
    return (
      "MAT-" +
      form.manufacturerId +
      "-" +
      Date.now().toString().slice(-6)
    );
  };

  const updateField = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);

    // Basic validation
    if (!form.manufacturerId.trim()) {
      setMessage("Manufacturer ID is required to generate a Material ID.");
      setIsError(true);
      return;
    }

    if (!form.drawingNumber.trim() || !form.fittingType.trim()) {
      setMessage("Drawing Number and Fitting Type are required.");
      setIsError(true);
      return;
    }

    setSaving(true);
    try {
      const materialId = generateMaterialId();

      // Create JSON for QR
      const qrPayload = {
        materialId,
        ...form,
        timestamp: Date.now(),
      };

      const qrString = JSON.stringify(qrPayload);

      // Generate QR code as DataURL
      const qrImage = await QRCode.toDataURL(qrString);

      // Upload to Storage
      const storageRef = ref(storage, `qr/${materialId}.png`);
      await uploadString(storageRef, qrImage, "data_url");
      const qrUrl = await getDownloadURL(storageRef);

      // Save data to Firestore
      await addDoc(collection(db, "materials"), {
        materialId,
        ...form,
        qrUrl,
        status: "manufactured",
        createdAt: new Date(),
      });

      setMessage(`✅ Material ${materialId} added successfully!`);
      setIsError(false);

      // optional: reset form
      setForm({
        manufacturerId: "",
        drawingNumber: "",
        fittingType: "",
        materialSpecs: "",
        weight: "",
        gauge: "",
        mfgDate: "",
        expectedLife: "",
        batchNumber: "",
        purchaseOrder: "",
      });
    } catch (e) {
      console.error(e);
      setMessage("❌ Error saving material. Please try again.");
      setIsError(true);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7E8FF] via-[#FDFBFF] to-[#E4D4FF] flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#A259FF] mb-2 text-center md:text-left">
          Add Material (QR Enabled)
        </h1>
        <p className="text-[11px] md:text-sm text-gray-600 mb-6 text-center md:text-left">
          Enter manufacturing details to generate a unique Material ID and
          linked QR code.
        </p>

        {/* Message box */}
        {message && (
          <div
            className={`mb-4 rounded-2xl px-4 py-2 text-[12px] md:text-sm ${
              isError
                ? "bg-red-50 border border-red-200 text-red-600"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white/95 rounded-3xl shadow-xl border border-purple-100/70 p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm">
            {/* Manufacturer ID */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Manufacturer ID <span className="text-red-500">*</span>
              </label>
              <input
                name="manufacturerId"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.manufacturerId}
                onChange={updateField}
                placeholder="e.g., MFG1234"
              />
            </div>

            {/* Drawing Number */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Drawing Number <span className="text-red-500">*</span>
              </label>
              <input
                name="drawingNumber"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.drawingNumber}
                onChange={updateField}
                placeholder="e.g., DRG-5678"
              />
            </div>

            {/* Fitting Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Fitting Type <span className="text-red-500">*</span>
              </label>
              <input
                name="fittingType"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.fittingType}
                onChange={updateField}
                placeholder="e.g., ERC, Liner, Pad"
              />
            </div>

            {/* Material Specs */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Material Specification
              </label>
              <input
                name="materialSpecs"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.materialSpecs}
                onChange={updateField}
                placeholder="e.g., IRS-T-31"
              />
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Weight (kg)
              </label>
              <input
                name="weight"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.weight}
                onChange={updateField}
                placeholder="e.g., 1.25"
              />
            </div>

            {/* Gauge */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Gauge / Board Gauge
              </label>
              <input
                name="gauge"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.gauge}
                onChange={updateField}
                placeholder="e.g., 1676 mm"
              />
            </div>

            {/* Manufacturing Date */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Manufacturing Date
              </label>
              <input
                type="date"
                name="mfgDate"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.mfgDate}
                onChange={updateField}
              />
            </div>

            {/* Expected Life */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Expected Service Life (years)
              </label>
              <input
                name="expectedLife"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.expectedLife}
                onChange={updateField}
                placeholder="e.g., 15"
              />
            </div>

            {/* Batch Number */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Batch Number
              </label>
              <input
                name="batchNumber"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.batchNumber}
                onChange={updateField}
                placeholder="e.g., BATCH-23A"
              />
            </div>

            {/* Purchase Order */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#5A4B81] text-[11px]">
                Purchase Order Number
              </label>
              <input
                name="purchaseOrder"
                className="border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A259FF]/50"
                value={form.purchaseOrder}
                onChange={updateField}
                placeholder="e.g., PO/2025/0012"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full sm:w-auto bg-[#A259FF] hover:bg-[#8d41e6] text-white py-2.5 px-6 rounded-2xl shadow-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving…" : "Save Material & Generate QR"}
            </button>
            <p className="text-[10px] text-gray-500">
              A unique Material ID and QR code will be generated and stored with this record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
