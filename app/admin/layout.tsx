import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "店舗管理",
  description: "店舗情報を管理するための管理画面",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="admin-app min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </div>
      <Toaster />
    </>
  );
}