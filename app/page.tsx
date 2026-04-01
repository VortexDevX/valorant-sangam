"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PublicBracketCard } from "@/components/public-bracket-card";
import { PublicUpcomingMatchCard } from "@/components/public-upcoming-match-card";
import { getNextSeriesMap } from "@/lib/series";
import type { BracketRecord } from "@/types/bracket";
import { PublicSeriesCard } from "@/components/public-series-card";
import type { SeriesRecord } from "@/types/series";

export default function Home() {
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [brackets, setBrackets] = useState<BracketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHome = async () => {
      try {
        setLoading(true);
        setError(null);

        const [seriesResponse, bracketsResponse] = await Promise.all([
          fetch("/api/series", { cache: "no-store" }),
          fetch("/api/brackets", { cache: "no-store" }),
        ]);
        const [seriesPayload, bracketsPayload] = await Promise.all([
          seriesResponse.json(),
          bracketsResponse.json(),
        ]);

        if (!seriesResponse.ok) {
          throw new Error(seriesPayload.error ?? "Failed to load series.");
        }

        if (!bracketsResponse.ok) {
          throw new Error(bracketsPayload.error ?? "Failed to load brackets.");
        }

        setSeries(seriesPayload.series);
        setBrackets(bracketsPayload.brackets);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load home page.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHome();
  }, []);

  const upcoming = series.filter((entry) => entry.status !== "completed");
  const upcomingMatches = upcoming
    .map((entry) => ({ series: entry, mapSlot: getNextSeriesMap(entry) }))
    .filter(
      (entry): entry is { series: SeriesRecord; mapSlot: NonNullable<ReturnType<typeof getNextSeriesMap>> } =>
        entry.mapSlot !== null,
    );

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
              <span className="font-display text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Match Hub
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[var(--bg-panel-lowest)]">
        <div className="absolute inset-0 opacity-35">
          <Image
            alt="Valorant promotional art"
            className="h-full w-full object-cover"
            fill
            priority
            quality={60}
            sizes="100vw"
            src="/valorant.png"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)] via-[rgba(10,20,30,0.5)] to-transparent" />

        <div className="page-wrap relative z-10 flex min-h-[340px] items-end py-12 md:min-h-[400px]">
          <div className="max-w-4xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="tactical-accent" />
              <span className="eyebrow">Tournament Overview</span>
            </div>
            <h1 className="page-title">Valorant Sangam</h1>
            <p className="mt-4 max-w-3xl border-l-2 border-[var(--bg-accent)] pl-4 text-sm leading-7 text-[var(--text-secondary)] md:text-lg">
              Follow upcoming matches, completed series, and team pages from one place.
              <span className="mono mt-2 block text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Public schedule and results
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
                Tournament Board
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Upcoming matches and the full series list, with links to every team page.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="tactical-chip text-[var(--success)]">
                {series.length} Series
              </span>
            </div>
          </div>

          {error ? <div className="status-error">{error}</div> : null}
          {loading ? (
            <div className="status-info">Loading series...</div>
          ) : (
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                    Upcoming Matches
                  </h3>
                  <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {upcomingMatches.length} ready
                  </span>
                </div>
                {upcomingMatches.length === 0 ? (
                  <div className="empty-state">No upcoming matches are ready yet.</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((entry) => (
                      <PublicUpcomingMatchCard
                        key={`${entry.series._id}-${entry.mapSlot.order}`}
                        mapSlot={entry.mapSlot}
                        series={entry.series}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                    Brackets
                  </h3>
                  <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {brackets.length} total
                  </span>
                </div>
                {brackets.length === 0 ? (
                  <div className="empty-state">No brackets added yet.</div>
                ) : (
                  <div className="space-y-4">
                    {brackets.map((bracket) => (
                      <PublicBracketCard key={bracket._id} bracket={bracket} />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                    Series
                  </h3>
                  <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {series.length} total
                  </span>
                </div>
                {series.length === 0 ? (
                  <div className="empty-state">No series added yet.</div>
                ) : (
                  <div className="space-y-4">
                    {series.map((entry) => (
                      <PublicSeriesCard key={entry._id} series={entry} />
                    ))}
                  </div>
                )}
              </section>
            </div>
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
              <div className="mt-2 font-display text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Public tournament page
              </div>
            </div>

            <div className="font-display text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Built for schedules, vetoes, and results
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
