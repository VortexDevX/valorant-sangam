"use client";

import { useParams } from "next/navigation";
import { AdminSeriesWorkspace } from "@/components/admin-series-workspace";

export default function AdminSeriesPage() {
  const params = useParams<{ id: string }>();
  return <AdminSeriesWorkspace seriesId={params.id} />;
}
