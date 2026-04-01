"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicSeriesCard } from "@/components/public-series-card";
import { StatusToasts } from "@/components/status-toasts";
import type { TeamPageRecord } from "@/types/series";

export default function TeamPage() {
  const params = useParams<{ slug: string }>();
  const [team, setTeam] = useState<TeamPageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/team/${params.slug}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load team page.");
        }

        setTeam(payload.team);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load team page.");
      } finally {
        setLoading(false);
      }
    };

    void loadTeam();
  }, [params.slug]);

  const upcoming = team?.series.filter((entry) => entry.status !== "completed") ?? [];
  const completed = team?.series.filter((entry) => entry.status === "completed") ?? [];

  return (
    <main className="app-shell">
      <StatusToasts error={error} onErrorDismiss={() => setError(null)} />
      <div className="page-wrap space-y-10">
        <section className="space-y-4">
          <Link className="eyebrow" href="/">
            Back To Home
          </Link>
          <h1 className="page-title">{team?.name ?? "Team Profile"}</h1>
          <p className="page-subtitle">
            All series for this team, including upcoming matchups, completed vetoes,
            and entered map results.
          </p>
        </section>

        {loading ? (
          <div className="status-info">Loading team page...</div>
        ) : !team ? (
          <div className="empty-state">Team not found.</div>
        ) : (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                  Upcoming Series
                </h2>
                <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {upcoming.length} open
                </span>
              </div>
              {upcoming.length === 0 ? (
                <div className="empty-state">No upcoming series for this team.</div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((entry) => (
                    <PublicSeriesCard
                      key={entry._id}
                      compact
                      focusTeamSlug={team.slug}
                      series={entry}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                  Completed Series
                </h2>
                <span className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {completed.length} finished
                </span>
              </div>
              {completed.length === 0 ? (
                <div className="empty-state">No completed series for this team.</div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {completed.map((entry) => (
                    <PublicSeriesCard
                      key={entry._id}
                      compact
                      focusTeamSlug={team.slug}
                      series={entry}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
