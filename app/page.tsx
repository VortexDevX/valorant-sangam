"use client";

import Image from "next/image";
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
      <header className="tactical-topbar border-l-4 border-[var(--bg-accent)]">
        <div className="page-wrap !py-0">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="tactical-accent" />
              <span className="tactical-brand text-2xl tracking-[0.12em] text-[var(--bg-accent)]">
                Valorant Sangam
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse bg-[var(--bg-accent)]" />
              <span className="font-display text-[0.62rem] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                Public Match Feed
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[var(--bg-panel-lowest)]">
        <div className="absolute inset-0 opacity-35">
          <Image
            alt="Valorant map montage"
            className="h-full w-full object-cover"
            fill
            priority
            sizes="100vw"
            src="/maps/sunset.png"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] via-[rgba(10,20,30,0.5)] to-transparent" />

        <div className="page-wrap relative z-10 flex min-h-[340px] items-end py-12 md:min-h-[400px]">
          <div className="max-w-4xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="tactical-accent" />
              <span className="eyebrow">System Status: Operational</span>
            </div>
            <h1 className="page-title">Valorant Sangam</h1>
            <p className="mt-4 max-w-3xl border-l-2 border-[var(--bg-accent)] pl-4 text-sm leading-7 text-[var(--text-secondary)] md:text-lg">
              Tactical Intelligence Interface | Tournament Hub
              <span className="mono mt-2 block text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Data Stream: Public_Match_History_v2.04
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="page-wrap space-y-12">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.05em]">
                Match Archive
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Completed matches only. Latest result appears first.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="tactical-chip text-[var(--success)]">
                {matches.length} Records
              </span>
            </div>
          </div>

          {error ? <div className="status-error">{error}</div> : null}
          {loading ? (
            <div className="status-info">Loading match history...</div>
          ) : (
            <MatchHistoryList matches={matches} />
          )}
        </section>
      </div>

      <footer className="bg-[var(--bg-panel-lowest)] px-6 py-12">
        <div className="page-wrap !py-0">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-display text-xl font-black uppercase tracking-[0.3em] text-[var(--bg-accent)]">
                Valorant Sangam
              </div>
              <div className="mt-2 font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Unauthorized admin access is prohibited.
              </div>
            </div>

            <div className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Established 2026.01 | Server Region: India
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
