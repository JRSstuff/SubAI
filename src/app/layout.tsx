import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubigLoop - Water Container & Recycling Management",
  description: "Coordinating information, assignments, and evidence for water maintenance and recycling partners.",
  icons: {
    icon: "/TubigLoopLogo150x150.png",
    apple: "/TubigLoopLogo150x150.png",
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
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#92EEFF] selection:text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
