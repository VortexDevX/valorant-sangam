import Link from "next/link";
import { notFound } from "next/navigation";
import { BracketBoard } from "@/components/bracket-board";
import { PublicTopbar } from "@/components/public-topbar";
import { getBracketById } from "@/lib/data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bracket = await getBracketById(id);

  if (!bracket) {
    return { title: "Bracket Not Found — Valorant Circuit" };
  }

  return {
    title: `${bracket.title} — Valorant Circuit`,
  };
}

export default async function BracketPage({ params }: Props) {
  const { id } = await params;
  const bracket = await getBracketById(id);

  if (!bracket) {
    notFound();
  }

  return (
    <main className="app-shell">
      <PublicTopbar statusLabel="Bracket View" />
      <div className="page-wrap space-y-10">
        <section className="space-y-4">
          <Link
            className="inline-flex items-center gap-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            href="/#brackets"
          >
            <span aria-hidden="true">←</span> All Brackets
          </Link>
          <h1 className="page-title">{bracket.title}</h1>
          <p className="page-subtitle">
            Full single-elimination bracket for this tournament stage.
          </p>
        </section>

        <BracketBoard bracket={bracket} />
      </div>
    </main>
  );
}
