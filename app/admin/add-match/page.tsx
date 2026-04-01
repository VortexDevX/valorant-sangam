"use client";

import { AddMatchManager } from "@/components/add-match-manager";
import { AdminAccessGate } from "@/components/admin-access-gate";

export default function AddMatchPage() {
  return (
    <AdminAccessGate
      description="Add, edit, and remove completed match results. Access is intentionally separate from the public route."
      title="Add Match"
    >
      {(token) => <AddMatchManager authToken={token} />}
    </AdminAccessGate>
  );
}
