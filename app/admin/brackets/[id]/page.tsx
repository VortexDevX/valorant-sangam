"use client";

import { useParams } from "next/navigation";
import { AdminBracketWorkspace } from "@/components/admin-bracket-workspace";

export default function AdminBracketPage() {
  const params = useParams<{ id: string }>();

  return <AdminBracketWorkspace bracketId={params.id} />;
}
