"use client";

import Link from "next/link";
import type { BracketMatchRecord, BracketContinuationResolution } from "@/types/bracket";
import type { SeriesRecord } from "@/types/series";

interface ContinuationEntry {
  key: string;
  match: BracketMatchRecord;
  linkedMatchSeries: SeriesRecord | undefined;
  compatibleSeries: SeriesRecord[];
  activeResolution: BracketContinuationResolution | null;
}

interface BracketContinuationPanelProps {
  entries: ContinuationEntry[];
  selections: Record<string, string>;
  notes: Record<string, string>;
  busy: boolean;
  onSelectionChange: (key: string, value: string) => void;
  onNoteChange: (key: string, value: string) => void;
  onApply: (round: number, match: number, seriesId: string | null) => void;
}

export function BracketContinuationPanel({
  entries,
  selections,
  notes,
  busy,
  onSelectionChange,
  onNoteChange,
  onApply,
}: BracketContinuationPanelProps) {
  return (
    <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Manual Continuation</p>
          <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            Resolve From External Series
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
            Use this only when a bracket match had to be finished in a separate
            manual series. The linked bracket series stays as the scheduled
            shell, and the external completed series decides who advances.
          </p>
        </div>
        <span className="tactical-chip text-[var(--text-secondary)]">
          {entries.length} eligible
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="status-info">
          No bracket matches currently need manual continuation.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map(
            ({
              key,
              match,
              linkedMatchSeries,
              compatibleSeries,
              activeResolution,
            }) => (
              <article
                key={key}
                className="panel-soft space-y-4 px-5 py-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tactical-chip text-[var(--text-accent)]">
                    Round {match.round}
                  </span>
                  <span className="tactical-chip text-[var(--text-secondary)]">
                    Match {match.match}
                  </span>
                  {match.winnerSource === "continuation" ? (
                    <span className="tactical-chip text-[var(--success)]">
                      Applied
                    </span>
                  ) : null}
                </div>

                <div className="panel-soft grid items-center gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)]">
                  <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em] md:justify-self-end md:text-right">
                    {match.top?.name || "TBD"}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full border border-white/10 bg-[var(--bg-panel-high)] font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    VS
                  </div>
                  <div className="min-w-0 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                    {match.bottom?.name || "TBD"}
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                  <div>
                    Linked series:{" "}
                    <span className="text-[var(--text-primary)]">
                      {linkedMatchSeries?.teamA} vs {linkedMatchSeries?.teamB}
                    </span>
                  </div>
                  <div>
                    Status:{" "}
                    <span className="text-[var(--text-primary)]">
                      {linkedMatchSeries?.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  {activeResolution ? (
                    <div>
                      Current:{" "}
                      <span className="text-[var(--success)]">
                        {activeResolution.winnerName} (
                        {activeResolution.scoreline})
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      className="label"
                      htmlFor={`continuation-${key}`}
                    >
                      Completed Manual Series
                    </label>
                    <select
                      id={`continuation-${key}`}
                      className="select"
                      disabled={busy}
                      value={
                        selections[key] ??
                        activeResolution?.seriesId ??
                        ""
                      }
                      onChange={(event) =>
                        onSelectionChange(key, event.target.value)
                      }
                    >
                      <option value="">
                        Select a completed manual series
                      </option>
                      {compatibleSeries.map((entry) => (
                        <option key={entry._id} value={entry._id}>
                          {entry.teamA} vs {entry.teamB} |{" "}
                          {entry.overallScore.teamA}-
                          {entry.overallScore.teamB}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="label"
                      htmlFor={`continuation-note-${key}`}
                    >
                      Note
                    </label>
                    <div className="tactical-input-wrap">
                      <textarea
                        id={`continuation-note-${key}`}
                        className="textarea"
                        disabled={busy}
                        placeholder="Why this match needed a manual continuation."
                        value={
                          notes[key] ?? activeResolution?.note ?? ""
                        }
                        onChange={(event) =>
                          onNoteChange(key, event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="button-primary"
                      disabled={
                        busy ||
                        !(
                          selections[key] ??
                          activeResolution?.seriesId
                        )
                      }
                      onClick={() =>
                        onApply(
                          match.round,
                          match.match,
                          selections[key] ??
                            activeResolution?.seriesId ??
                            null,
                        )
                      }
                      type="button"
                    >
                      Apply
                    </button>
                    <button
                      className="button-secondary"
                      disabled={busy || !activeResolution}
                      onClick={() =>
                        onApply(match.round, match.match, null)
                      }
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}
