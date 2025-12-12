// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import PwaRegister from "@/components/PwaRegister";       // from earlier step
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export const metadata = {
  title: "Vimarsha",
  description: "Track Fittings Digital Ecosystem",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#A259FF" />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        {/* Registers /sw.js so browser sees it as PWA */}
        <PwaRegister />

        {/* Shows custom Install popup when the browser thinks app is installable */}
        <PwaInstallPrompt />

        {children}
      </body>
    </html>
  );
}
