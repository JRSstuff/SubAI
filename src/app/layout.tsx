import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { WaterFlowBackground } from "@/components/ui/WaterFlowBackground";

export const metadata: Metadata = {
  applicationName: "SubAI",
  title: "SubAI - Urban Drainage Triage & Circular Waste Recovery",
  description: "Coordinating photographic obstruction reports, AI material categorization, priority dispatch, and verified circular recovery for Cagayan de Oro City.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SubAI",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/logo512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/logo512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#30AFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#92EEFF] selection:text-[#0F172A] relative">
        <WaterFlowBackground />
        <div className="relative z-1 flex-1 flex flex-col">
          {children}
        </div>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
