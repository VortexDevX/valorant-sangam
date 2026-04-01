"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BracketBoard } from "@/components/bracket-board";
import type { BracketRecord } from "@/types/bracket";

export default function BracketPage() {
  const params = useParams<{ id: string }>();
  const [bracket, setBracket] = useState<BracketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBracket = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/brackets/${params.id}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load bracket.");
        }

        setBracket(payload.bracket);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load bracket.");
      } finally {
        setLoading(false);
      }
    };

    void loadBracket();
  }, [params.id]);

  return (
    <main className="app-shell">
      <div className="page-wrap space-y-10">
        <section className="space-y-4">
          <Link className="eyebrow" href="/">
            Back To Home
          </Link>
          <h1 className="page-title">{bracket?.title ?? "Bracket"}</h1>
          <p className="page-subtitle">
            Full single-elimination bracket for this tournament stage.
          </p>
        </section>

        {error ? <div className="status-error">{error}</div> : null}
        {loading ? (
          <div className="status-info">Loading bracket...</div>
        ) : !bracket ? (
          <div className="empty-state">Bracket not found.</div>
        ) : (
          <BracketBoard bracket={bracket} />
        )}
      </div>
    </main>
  );
}
