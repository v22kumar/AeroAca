import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { ProgressProvider } from "@/lib/progress/ProgressProvider";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { GlossaryProvider } from "@/components/glossary/GlossaryProvider";

export const metadata: Metadata = {
  title: { default: "AeroAca", template: "%s · AeroAca" },
  description: "A mobile-first engineering academy: short problem-led lessons, fault-isolation missions and interview practice for embedded and avionics electronics.",
  applicationName: "AeroAca",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AeroAca" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171116" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink">
        <ProgressProvider>
          <GlossaryProvider>
            <AppShell>{children}</AppShell>
          </GlossaryProvider>
          <ServiceWorkerRegistrar />
        </ProgressProvider>
      </body>
    </html>
  );
}
