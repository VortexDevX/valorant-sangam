"use client";

import { AdminAccessGate } from "@/components/admin-access-gate";
import { MapSelectManager } from "@/components/map-select-manager";

export default function MapSelectPage() {
  return (
    <AdminAccessGate
      description="Run the live Valorant veto flow for BO1, BO3, and BO5 without exposing this route from the public page."
      title="Map Select"
    >
      {(token) => <MapSelectManager authToken={token} />}
    </AdminAccessGate>
  );
}
