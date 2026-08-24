import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CompareProvider } from "@/components/compare/compare-provider";
import { CompareDrawer } from "@/components/compare/compare-drawer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hardware Spec Dashboard",
    template: "%s · Hardware Spec Dashboard",
  },
  description:
    "An offline-first specification and comparison dashboard for PC hardware: processors, graphics cards, memory, storage and motherboards, with polarity-aware diffing and a quantitative visualisation suite.",
  applicationName: "Hardware Spec Dashboard",
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-0 text-ink antialiased">
        <NuqsAdapter>
          <CompareProvider>
            {/* Keyboard users reach content without tabbing the whole nav (US11). */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
              Skip to content
            </a>
            <SiteHeader />
            {/* Bottom padding leaves room for the sticky comparison tray. */}
            <main id="main" className="pb-40">
              {children}
            </main>
            <SiteFooter />
            <CompareDrawer />
          </CompareProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
