import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Aegis Forensics | AI Media Safety Review",
  description: "Audit AI media before it goes live with forensic legal intelligence."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body className={`${inter.variable} bg-black font-sans text-neutral-400 antialiased`}>
        {children}
      </body>
    </html>
  );
}
