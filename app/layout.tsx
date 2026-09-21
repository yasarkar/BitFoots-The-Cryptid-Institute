import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Cryptid Institute presents: Bitfoots (Series 303)",
  description:
    "Official Autonomous Zero-Knowledge & Artifact Registry. 303 Cryptid Specimens preserved on Bitcoin Ordinals and shielded within Zcash.",
  keywords: [
    "The Cryptid Institute",
    "Bitfoots",
    "Specimen Series 303",
    "Zcash Shielded Pool",
    "ZK-SNARKs",
    "Bitcoin Ordinals",
    "Zero-Knowledge Cryptography",
    "Autonomous Artifact Registry",
    "Web3 Cryptids",
  ],
  authors: [{ name: "The Cryptid Institute Research Bureau" }],
  openGraph: {
    title: "The Cryptid Institute presents: Bitfoots // Series 303",
    description: "Official Autonomous Zero-Knowledge & Cryptid Artifact Registry. Real, but unseen.",
    siteName: "The Cryptid Institute",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@BITFOOTS_",
    creator: "@BITFOOTS_",
    title: "The Cryptid Institute presents: Bitfoots (@BITFOOTS_)",
    description: "Specimens are never captured, only observed. Preserved on Bitcoin, shielded by Zcash.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05080e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#14171c] text-[#aab6c9] font-sans selection:bg-[#eaba49] selection:text-[#14171c]">
        {children}
      </body>
    </html>
  );
}

