import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RazorAgent FX — Autonomous Cross-Border Payment Router",
  description: "AI-powered FX optimization, smart gateway routing & automated FIRC compliance for Razorpay. Built for Open Track Internship.",
  openGraph: { title: "RazorAgent FX", description: "Autonomous Cross-Border AI Payment Router & Compliance Engine", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <Navbar />
        {children}
        <footer className="border-t mt-12 py-8 text-center text-sm text-muted-foreground">
          <div className="max-w-7xl mx-auto px-6">
            <div>Built for <span className="font-semibold text-foreground">Razorpay Open Track Internship</span> • RazorAgent FX v2.1 • Sandbox Mode • Bengaluru, India</div>
            <div className="text-xs mt-1">Deterministic fallback enables zero-config demo. Add OPENAI_API_KEY + RAZORPAY_KEY_ID for live AI & payments.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
