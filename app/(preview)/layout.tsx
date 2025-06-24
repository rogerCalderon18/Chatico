import type { Metadata } from "next";
import "@/globals.css";

export const metadata: Metadata = {
  title: "Chatico - Preview",
  description: "Tu segundo cerebro con IA - Vista previa",
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
