import type { Metadata } from "next";
import { Barlow, Geist_Mono, Teko } from "next/font/google";
import "./globals.css";

const bodyFont = Barlow({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const displayFont = Teko({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Valorant Sangam",
  description: "Valorant tournament control panel and match history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg-app)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
