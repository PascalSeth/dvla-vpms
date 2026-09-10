import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DVLA VPMS — DVLA HQ",
  description: "Driver & Vehicle Licensing Authority — DVLA HQ Vehicle Plate Management System",
  icons: {
    icon: [
      { url: "/dvla-bg.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/dvla-bg.png",
    apple: "/dvla-bg.png",
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
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/dvla-bg.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/dvla-bg.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
