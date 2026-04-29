import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSeriesCard } from "@/components/public-series-card";
import { PublicTopbar } from "@/components/public-topbar";
import { getTeamPage } from "@/lib/data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamPage(slug);

  if (!team) {
    return { title: "Team Not Found — Valorant Circuit" };
  }

  return {
    title: `${team.name} — Valorant Circuit`,
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = await getTeamPage(slug);

  if (!team) {
    notFound();
  }

  const upcoming = team.series.filter((entry) => entry.status !== "completed");
  const completed = team.series.filter((entry) => entry.status === "completed");

  return (
    <main className="app-shell">
      <PublicTopbar statusLabel="Team Profile" />
      <div className="page-wrap space-y-10">
        <section className="space-y-4">
          <Link
            className="inline-flex items-center gap-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            href="/"
          >
            <span aria-hidden="true">←</span> Home
          </Link>
          <h1 className="page-title">{team.name}</h1>
          <p className="page-subtitle">
            All series for this team — upcoming matchups, completed vetoes, and
            entered map results.
          </p>
        </section>

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
              <div className="empty-state">
                No upcoming series for this team.
              </div>
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
              <div className="empty-state">
                No completed series for this team.
              </div>
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
      </div>
    </main>
  );
}
