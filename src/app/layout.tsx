import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import OfflineSync from "@/components/OfflineSync";

const brandFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "raksha — Kerala Flood & Landslide Reporting Platform",
  description: "Real-time crowd-sourced disaster reporting, AI image validation, and emergency alerts for Kerala monsoon seasons.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-512.png' }],
    shortcut: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${brandFont.variable} antialiased bg-[#0a0b10] text-[#f3f4f6] min-h-screen flex flex-col`}
      >
        <ServiceWorkerRegister />
        <OfflineSync />
        {children}
      </body>
    </html>
  );
}


