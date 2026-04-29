"use client";

interface TeamSlot {
  seed: number | null;
  value: string;
  isBye: boolean;
}

interface BracketTeamEntryProps {
  matchups: TeamSlot[][];
  busy: boolean;
  totalMatches: number;
  onTeamChange: (seed: number, value: string) => void;
}

export function BracketTeamEntry({
  matchups,
  busy,
  totalMatches,
  onTeamChange,
}: BracketTeamEntryProps) {
  return (
    <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Teams</p>
          <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            Round 1 Matchups
          </h3>
        </div>
        <span className="tactical-chip text-[var(--text-secondary)]">
          {totalMatches} matches
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {matchups.map((pair, matchIndex) => (
          <div
            key={`round-1-match-${matchIndex + 1}`}
            className="panel-soft space-y-3 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Match {matchIndex + 1}</span>
              <span className="tactical-chip text-[var(--text-muted)]">
                Round 1
              </span>
            </div>

            {pair.map((slot, slotIndex) =>
              slot.isBye ? (
                <div key={`match-${matchIndex + 1}-slot-${slotIndex}`}>
                  <div className="label">
                    Slot {slotIndex === 0 ? "A" : "B"}
                  </div>
                  <div className="field border border-[rgba(255,179,178,0.1)] text-[var(--text-muted)]">
                    BYE
                  </div>
                </div>
              ) : (
                <div key={`match-${matchIndex + 1}-seed-${slot.seed}`}>
                  <label
                    className="label"
                    htmlFor={`match-${matchIndex + 1}-seed-${slot.seed}`}
                  >
                    Slot {slotIndex === 0 ? "A" : "B"} · Seed {slot.seed}
                  </label>
                  <div className="tactical-input-wrap">
                    <input
                      id={`match-${matchIndex + 1}-seed-${slot.seed}`}
                      className="field"
                      disabled={busy}
                      placeholder={`TEAM ${slot.seed}`}
                      value={slot.value}
                      onChange={(event) =>
                        onTeamChange(slot.seed!, event.target.value)
                      }
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
