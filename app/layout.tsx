import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";
import AuthProvider from "@/components/Auth/providers/auth-provider";
import { Toaster } from "sonner";
import { HeroUIProvider } from "@heroui/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Chatico",
  description: "Tu segundo cerebro con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <HeroUIProvider>
            {children}
          </HeroUIProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}