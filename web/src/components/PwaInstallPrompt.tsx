"use client";

import { useEffect, useState } from "react";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only runs in browser
    const handler = (e: Event) => {
      const evt = e as BeforeInstallPromptEvent;
      // Stop default mini-infobar
      evt.preventDefault();
      setDeferredPrompt(evt);
      setVisible(true); // show our custom banner
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // If no prompt available, don't show anything
  if (!visible || !deferredPrompt) return null;

  const onInstallClick = async () => {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log("PWA install choice:", choice.outcome);
    } catch (err) {
      console.error("PWA install failed:", err);
    } finally {
      // Hide banner (you can re-show later if you want)
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const onClose = () => {
    setVisible(false);
  };

  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        max-w-sm w-[90%]
        z-[9999]
        bg-white/95 backdrop-blur-lg
        border border-purple-100
        shadow-xl rounded-2xl
        px-4 py-3
        flex items-center gap-3
      "
    >
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#A259FF]">
          Install Vimarsha
        </p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          Get app-like experience: full-screen, quick access, no browser bar.
        </p>
      </div>

      <div className="flex flex-col gap-1 items-end">
        <button
          onClick={onInstallClick}
          className="
            text-[11px] font-semibold
            px-3 py-1.5 rounded-full
            bg-[#A259FF] text-white
            hover:bg-[#8F3FE3]
            transition
          "
        >
          Install
        </button>
        <button
          onClick={onClose}
          className="text-[10px] text-gray-400 hover:text-gray-600"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
