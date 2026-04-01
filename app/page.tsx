"use client";

import { useEffect, useState } from "react";
import { MatchHistoryList } from "@/components/match-history-list";
import type { MatchRecord } from "@/types/match";

export default function Home() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/matches", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load matches.");
        }

        setMatches(payload.matches);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load matches.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMatches();
  }, []);

  return (
    <main className="app-shell">
      <div className="page-wrap space-y-8">
        <section className="panel px-6 py-8 md:px-10 md:py-10">
          <p className="eyebrow">Valorant Sangam</p>
          <h1 className="page-title">Match History</h1>
          <p className="page-subtitle mt-4">
            Completed series, locked scores, and played maps for the current
            tournament run. Latest result stays on top.
          </p>
        </section>

        <section className="space-y-4">
          {error ? <div className="status-error">{error}</div> : null}
          {loading ? (
            <div className="status-info">Loading match history...</div>
          ) : (
            <MatchHistoryList matches={matches} />
          )}
        </section>
      </div>
    </main>
  );
}
