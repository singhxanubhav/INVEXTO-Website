import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/src/hooks/useAuth";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INVEXTO - Learn to invest",
  description:
    "Trade virtual stocks, replay historic market crashes, and compete in monthly tournaments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "oklch(0.17 0.025 160)",
                color: "oklch(0.95 0.01 160)",
                border: "1px solid oklch(0.3 0.02 160 / 50%)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
