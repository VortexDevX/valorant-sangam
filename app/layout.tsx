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
  title: "Valorant Circuit",
  description:
    "Run Valorant tournaments with live brackets, map vetoes, and match tracking — all in one clean dashboard.",
  metadataBase: new URL("https://valorant-circuit.vercel.app/"),
  openGraph: {
    title: "Valorant Circuit",
    description:
      "Run Valorant tournaments with live brackets, map vetoes, and match tracking — all in one clean dashboard.",
    url: "https://valorant-circuit.vercel.app/",
    siteName: "Valorant Circuit",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Valorant Circuit — Tournament Control",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Valorant Circuit",
    description:
      "Run Valorant tournaments with live brackets, map vetoes, and match tracking — all in one clean dashboard.",
    images: ["/og.png"],
  },
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
