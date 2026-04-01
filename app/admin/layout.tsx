"use client";

import { AdminSessionLayout } from "@/components/admin-session";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminSessionLayout>{children}</AdminSessionLayout>;
}
