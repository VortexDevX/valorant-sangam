"use client";

import Link from "next/link";
import { AdminSeriesHub } from "@/components/admin-series-hub";

export default function AdminPage() {
  return (
    <div className="space-y-12">
      <section className="panel flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="eyebrow">Bracket Control</p>
          <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            Manage Tournament Brackets
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Create brackets, assign first-round matchups manually, and advance winners from a dedicated workspace.
          </p>
        </div>
        <Link className="button-primary" href="/admin/brackets">
          Open Brackets
        </Link>
      </section>

      <AdminSeriesHub />
    </div>
  );
}
