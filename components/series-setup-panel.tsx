"use client";

import type { SeriesFormat, TeamSlot } from "@/types/veto";

interface SeriesSetupPanelProps {
  teamA: string;
  teamB: string;
  format: SeriesFormat;
  vetoStarter: TeamSlot;
  busy: boolean;
  onFormatChange: (format: SeriesFormat) => void;
  onVetoStarterChange: (starter: TeamSlot) => void;
}

export function SeriesSetupPanel({
  teamA,
  teamB,
  format,
  vetoStarter,
  busy,
  onFormatChange,
  onVetoStarterChange,
}: SeriesSetupPanelProps) {
  return (
    <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
      <div>
        <p className="eyebrow">Series Setup</p>
        <h2 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
          Format And Veto Order
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          Configure before veto starts. Set the series length and which team
          opens the veto.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel-soft space-y-4 px-5 py-5">
          <div className="eyebrow">Series Format</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["bo1", "bo3", "bo5"] as const).map((option) => {
              const active = format === option;

              return (
                <button
                  key={option}
                  className={`text-left px-4 py-4 transition ${
                    active
                      ? "bg-[var(--bg-accent)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "bg-[var(--bg-panel)] text-[var(--text-primary)] hover:-translate-y-0.5"
                  }`}
                  disabled={busy}
                  onClick={() => onFormatChange(option)}
                  type="button"
                >
                  <div className="font-display text-[0.68rem] font-black uppercase tracking-[0.18em]">
                    {option}
                  </div>
                  <div
                    className={`mt-3 text-sm leading-6 ${
                      active ? "text-white/80" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {option === "bo1"
                      ? "Single-map decider."
                      : option === "bo3"
                        ? "Standard playoff series."
                        : "Extended title-match length."}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-soft space-y-4 px-5 py-5">
          <div className="eyebrow">First Ban Team</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { slot: "teamA" as const, name: teamA },
                { slot: "teamB" as const, name: teamB },
              ]
            ).map((option) => {
              const active = vetoStarter === option.slot;

              return (
                <button
                  key={option.slot}
                  className={`text-left px-4 py-4 transition ${
                    active
                      ? "bg-[rgba(255,70,85,0.16)] shadow-[0_0_0_1px_rgba(255,70,85,0.35)]"
                      : "bg-[var(--bg-panel)] hover:-translate-y-0.5"
                  }`}
                  disabled={busy}
                  onClick={() => onVetoStarterChange(option.slot)}
                  type="button"
                >
                  <div className="font-display text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--text-accent)]">
                    Starts Veto
                  </div>
                  <div className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                    {option.name}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
