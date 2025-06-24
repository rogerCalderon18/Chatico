import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Chatico",
  description: "Panel administrativo de Chatico",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
