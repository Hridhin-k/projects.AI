import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerConfigError } from "@/lib/auth/server-config";
import ServerConfigError from "@/components/layout/ServerConfigError";
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
  title: "Projects.AI - Project Management",
  description: "Manage projects from planning through deployment with Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configError = getServerConfigError();

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {configError ? <ServerConfigError message={configError} /> : children}
      </body>
    </html>
  );
}
