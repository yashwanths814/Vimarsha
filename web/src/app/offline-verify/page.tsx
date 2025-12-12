"use client";

import { useState } from "react";

type Detection = {
  class_name: string;
  component: string;
  condition: string;
  conf: number;
};

export default function OfflineVerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = "http://localhost:5000/analyze"; // Flask endpoint

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setSummary([]);
    setDetections([]);
    setError(null);

    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary([]);
    setDetections([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Server error");
      }

      const data = await res.json();
      setSummary(data.summary || []);
      setDetections(data.detections || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Offline AI Verification (Single Image)
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Upload a track image from disk and run the YOLO model locally.
          </p>
        </div>

        {/* Upload + Preview */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Upload */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold mb-2">1. Select image</p>
              <label className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition p-4 text-center text-xs text-gray-600">
                <span className="block mb-1 font-semibold">
                  Click to choose file
                </span>
                <span className="block text-[11px] text-gray-500">
                  JPG / PNG (no camera)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <p className="mt-2 text-[11px] text-gray-700 break-all">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold shadow-sm border
                ${
                  loading || !file
                    ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-black text-white border-black hover:bg-gray-800"
                }`}
            >
              {loading ? "Running AI check…" : "Run AI Check"}
            </button>
          </div>

          {/* Preview */}
          <div className="border border-gray-200 rounded-xl p-4 flex flex-col">
            <p className="text-sm font-semibold mb-2">2. Preview</p>
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 object-contain"
                />
              ) : (
                <span className="text-xs text-gray-500">
                  No image selected yet.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2">3. AI Summary</p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs min-h-[3rem]">
            {loading && (
              <span className="text-gray-500">Analyzing image…</span>
            )}
            {!loading && summary.length === 0 && (
              <span className="text-gray-400">
                No summary yet. Upload an image and run the AI check.
              </span>
            )}
            {!loading && summary.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {summary.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detailed detections */}
        <div>
          <p className="text-sm font-semibold mb-2">4. Detailed detections</p>
          {detections.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-400">
              No ERC/LINER/SLEEPER/CLIP/PAD/BOLT detections yet.
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-1 pr-2 font-semibold">Component</th>
                    <th className="py-1 pr-2 font-semibold">Condition</th>
                    <th className="py-1 pr-2 font-semibold">Class</th>
                    <th className="py-1 pr-2 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 pr-2 uppercase">{d.component}</td>
                      <td className="py-1 pr-2 capitalize">{d.condition}</td>
                      <td className="py-1 pr-2">{d.class_name}</td>
                      <td className="py-1 pr-2">
                        {(d.conf * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
