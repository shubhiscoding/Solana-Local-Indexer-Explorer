import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Solana Local Explorer",
  description: "Self-hosted Solana blockchain explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-slate-200`}
      >
        <nav className="bg-slate-950 text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
            <Link href="/" className="text-lg font-bold tracking-tight text-emerald-400">
              Solana Local Explorer
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-slate-300 hover:text-white">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-slate-300 hover:text-white">
                Transactions
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
