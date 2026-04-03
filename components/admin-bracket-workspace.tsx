"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BracketBoard } from "@/components/bracket-board";
import { useAdminSession } from "@/components/admin-session";
import { StatusToasts } from "@/components/status-toasts";
import { buildSeedOrder, computeBracketView, normalizeBracketTeams } from "@/lib/brackets";
import { buildPairKey } from "@/lib/series";
import type { BracketRecord } from "@/types/bracket";
import type { SeriesRecord } from "@/types/series";
import type { SeriesFormat } from "@/types/veto";

interface AdminBracketWorkspaceProps {
  bracketId: string;
}

export function AdminBracketWorkspace({ bracketId }: AdminBracketWorkspaceProps) {
  const { token } = useAdminSession();
  const [bracket, setBracket] = useState<BracketRecord | null>(null);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<SeriesFormat>("bo3");
  const [teams, setTeams] = useState<string[]>([]);
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [continuationSelection, setContinuationSelection] = useState<Record<string, string>>({});
  const [continuationNotes, setContinuationNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasTeamChanges =
    !!bracket && teams.some((entry, index) => entry !== bracket.teams[index]?.name);

  useEffect(() => {
    const loadBracket = async () => {
      try {
        setLoading(true);
        setError(null);
        const [bracketResponse, seriesResponse] = await Promise.all([
          fetch(`/api/brackets/${bracketId}`, { cache: "no-store" }),
          fetch("/api/series", { cache: "no-store" }),
        ]);
        const [bracketPayload, seriesPayload] = await Promise.all([
          bracketResponse.json(),
          seriesResponse.json(),
        ]);

        if (!bracketResponse.ok) {
          throw new Error(bracketPayload.error ?? "Failed to load bracket.");
        }

        if (!seriesResponse.ok) {
          throw new Error(seriesPayload.error ?? "Failed to load series.");
        }

        setBracket(bracketPayload.bracket);
        setTitle(bracketPayload.bracket.title);
        setFormat(bracketPayload.bracket.format);
        setTeams(bracketPayload.bracket.teams.map((entry: { name: string }) => entry.name));
        setSeries(seriesPayload.series);
        setContinuationSelection(
          Object.fromEntries(
            (bracketPayload.bracket.manualResolutions ?? []).map(
              (entry: { round: number; match: number; seriesId: string }) => [
                `${entry.round}-${entry.match}`,
                entry.seriesId,
              ],
            ),
          ),
        );
        setContinuationNotes(
          Object.fromEntries(
            (bracketPayload.bracket.manualResolutions ?? []).map(
              (entry: { round: number; match: number; note?: string }) => [
                `${entry.round}-${entry.match}`,
                entry.note ?? "",
              ],
            ),
          ),
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load bracket.");
      } finally {
        setLoading(false);
      }
    };

    void loadBracket();
  }, [bracketId]);

  const previewBracket = useMemo(() => {
    if (!bracket) {
      return null;
    }

    const normalizedTeams = normalizeBracketTeams(teams);

    if (!hasTeamChanges) {
      return {
        ...bracket,
        title,
        format,
        teams: normalizedTeams,
      } satisfies BracketRecord;
    }

    const computed = computeBracketView({
      teamCount: bracket.teamCount,
      bracketSize: bracket.bracketSize,
      teams: normalizedTeams,
      winners: bracket.winners,
      manualResolutions: bracket.manualResolutions,
    });

    return {
      ...bracket,
      title,
      format,
      teams: normalizedTeams,
      rounds: computed.rounds,
      status: computed.status,
      championSeed: computed.championSeed,
      championName: computed.championName,
    } satisfies BracketRecord;
  }, [bracket, format, hasTeamChanges, teams, title]);

  const hasUnsavedChanges =
    !!bracket &&
    (title !== bracket.title ||
      format !== bracket.format ||
      teams.some((entry, index) => entry !== bracket.teams[index]?.name));
  const setupComplete =
    previewBracket !== null &&
    teams.filter((entry) => entry.trim().length > 0).length === previewBracket.teamCount;
  const firstRoundMatchups = useMemo(() => {
    if (!previewBracket) {
      return [];
    }

    const slotSeeds = buildSeedOrder(previewBracket.bracketSize);
    const pairs: Array<
      Array<{ seed: number | null; value: string; isBye: boolean }>
    > = [];

    for (let index = 0; index < slotSeeds.length; index += 2) {
      const topSeed = slotSeeds[index];
      const bottomSeed = slotSeeds[index + 1];

      pairs.push([
        {
          seed: topSeed <= previewBracket.teamCount ? topSeed : null,
          value: topSeed <= previewBracket.teamCount ? teams[topSeed - 1] ?? "" : "BYE",
          isBye: topSeed > previewBracket.teamCount,
        },
        {
          seed: bottomSeed <= previewBracket.teamCount ? bottomSeed : null,
          value: bottomSeed <= previewBracket.teamCount ? teams[bottomSeed - 1] ?? "" : "BYE",
          isBye: bottomSeed > previewBracket.teamCount,
        },
      ]);
    }

    return pairs;
  }, [previewBracket, teams]);
  const continuationMatches = useMemo(() => {
    if (!previewBracket) {
      return [];
    }

    return previewBracket.rounds
      .flatMap((round) => round.matches)
      .map((match) => {
        const linkedMatchSeries = series.find(
          (entry) =>
            entry.bracket?.id === previewBracket._id &&
            entry.bracket.round === match.round &&
            entry.bracket.match === match.match,
        );
        const key = `${match.round}-${match.match}`;
        const pairKey =
          match.top?.slug && match.bottom?.slug
            ? buildPairKey(match.top.slug, match.bottom.slug)
            : null;
        const compatibleSeries =
          pairKey === null
            ? []
            : series.filter(
                (entry) =>
                  !entry.bracket &&
                  entry.status === "completed" &&
                  entry.pairKey === pairKey,
              );
        const activeResolution =
          previewBracket.manualResolutions.find(
            (entry) => entry.round === match.round && entry.match === match.match,
          ) ?? null;

        return {
          key,
          match,
          linkedMatchSeries,
          compatibleSeries,
          activeResolution,
        };
      })
      .filter(
        (entry) =>
          !!entry.linkedMatchSeries &&
          !entry.linkedMatchSeries.overallScore.completed &&
          entry.match.top &&
          entry.match.bottom &&
          !entry.match.autoAdvanced &&
          (entry.activeResolution !== null || entry.compatibleSeries.length > 0),
      );
  }, [previewBracket, series]);

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, format, teams }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save bracket.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setFormat(payload.bracket.format);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setMessage("Bracket setup saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save bracket.");
    } finally {
      setBusy(false);
    }
  }

  async function pickWinner(round: number, match: number, winnerSeed: number | null) {
    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}/matches/${round}/${match}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ winnerSeed }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update match winner.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setFormat(payload.bracket.format);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setMessage("Bracket updated.");
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "Failed to update bracket.");
    } finally {
      setBusy(false);
    }
  }

  function updateTeamName(seed: number, value: string) {
    setTeams((current) =>
      current.map((entry, index) => (index === seed - 1 ? value : entry)),
    );
  }

  async function resolveFromContinuation(round: number, match: number, continuationSeriesId: string | null) {
    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}/matches/${round}/${match}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          continuationSeriesId,
          note: continuationNotes[`${round}-${match}`] ?? "",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to resolve continuation.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setFormat(payload.bracket.format);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setContinuationSelection((current) => ({
        ...current,
        [`${round}-${match}`]: continuationSeriesId ?? "",
      }));
      setContinuationNotes((current) => ({
        ...current,
        [`${round}-${match}`]:
          payload.bracket.manualResolutions.find(
            (entry: { round: number; match: number; note?: string }) =>
              entry.round === round && entry.match === match,
          )?.note ?? current[`${round}-${match}`] ?? "",
      }));
      setSeries((current) =>
        current.map((entry) => {
          const existingContinuation = entry.manualContinuation;

          if (entry._id === continuationSeriesId && continuationSeriesId !== null) {
            return {
              ...entry,
              manualContinuation: {
                id: payload.bracket._id,
                title: payload.bracket.title,
                round,
                match,
              },
            };
          }

          if (
            existingContinuation &&
            existingContinuation.id === payload.bracket._id &&
            existingContinuation.round === round &&
            existingContinuation.match === match &&
            entry._id !== continuationSeriesId
          ) {
            return { ...entry, manualContinuation: null };
          }

          return entry;
        }),
      );
      setMessage(
        continuationSeriesId
          ? "Bracket match resolved from manual continuation."
          : "Manual continuation cleared.",
      );
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Failed to resolve continuation.");
    } finally {
      setBusy(false);
    }
  }

  async function setBracketLock(locked: boolean) {
    try {
      setBusy(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/brackets/${bracketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locked }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update bracket freeze.");
      }

      setBracket(payload.bracket);
      setTitle(payload.bracket.title);
      setFormat(payload.bracket.format);
      setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
      setMessage(locked ? "Bracket frozen." : "Bracket unfrozen.");
    } catch (lockError) {
      setError(lockError instanceof Error ? lockError.message : "Failed to update bracket freeze.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPublicBracketLink() {
    if (!previewBracket) {
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/brackets/${previewBracket._id}`);
      setMessage("Public bracket link copied.");
    } catch {
      setError("Failed to copy public bracket link.");
    }
  }

  if (loading) {
    return <div className="status-info">Loading bracket workspace...</div>;
  }

  if (!previewBracket) {
    return <div className="status-error">Bracket not found.</div>;
  }

  return (
    <div className="space-y-8">
      <StatusToasts
        error={error}
        success={message}
        onErrorDismiss={() => setError(null)}
        onSuccessDismiss={() => setMessage(null)}
      />
      <section className="space-y-4">
        <Link className="eyebrow" href="/admin/brackets">
          Back To Brackets
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title">{previewBracket.title}</h1>
            <p className="page-subtitle mt-4">
              Fill teams in the same order as the first-round bracket shown below. BYE slots stay automatic.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="tactical-chip text-[var(--text-accent)]">
              {previewBracket.status.replaceAll("_", " ")}
            </span>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {previewBracket.teamCount} teams
            </span>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {previewBracket.format}
            </span>
            {previewBracket.locked ? (
              <span className="tactical-chip text-[var(--danger)]">frozen</span>
            ) : null}
            {previewBracket.championName ? (
              <span className="tactical-chip text-[var(--success)]">
                {previewBracket.championName}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <form className="space-y-6" onSubmit={saveDetails}>
        <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Bracket Setup</p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                {previewBracket.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Team entry mirrors the real round-one bracket order. Save the seeded list first, then generated series will control normal bracket progression.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="button-primary sm:min-w-56" disabled={busy} type="submit">
                {busy ? "Saving..." : "Save Bracket"}
              </button>

              <button
                className="button-secondary sm:min-w-56"
                disabled={busy}
                onClick={() => void setBracketLock(!previewBracket.locked)}
                type="button"
              >
                {previewBracket.locked ? "Unfreeze Bracket" : "Freeze Bracket"}
              </button>

              <Link className="button-secondary sm:min-w-56" href="/admin">
                Open Series Hub
              </Link>

              <Link className="button-secondary sm:min-w-56" href={`/brackets/${previewBracket._id}`}>
                Open Public Bracket
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              onClick={() => void copyPublicBracketLink()}
              type="button"
            >
              Copy Public Link
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <label className="label" htmlFor="bracket-workspace-title">
                Bracket Title
              </label>
              <div className="tactical-input-wrap">
                <input
                  id="bracket-workspace-title"
                  className="field"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="bracket-workspace-format">
                Match Format
              </label>
              <select
                id="bracket-workspace-format"
                className="select"
                disabled={busy}
                value={format}
                onChange={(event) => setFormat(event.target.value as SeriesFormat)}
              >
                <option value="bo1">BO1</option>
                <option value="bo3">BO3</option>
                <option value="bo5">BO5</option>
              </select>
            </div>

            {!setupComplete ? (
              <div className="status-info lg:max-w-md">
                Add all {previewBracket.teamCount} team names before generating round 1 series.
              </div>
            ) : hasUnsavedChanges ? (
              <div className="status-info lg:max-w-md">
                Save the bracket to refresh the generated series list.
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Teams</p>
              <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Round 1 Matchups
              </h3>
            </div>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {previewBracket.rounds[0]?.matches.length ?? 0} matches
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {firstRoundMatchups.map((pair, matchIndex) => (
              <div key={`round-1-match-${matchIndex + 1}`} className="panel-soft space-y-3 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="eyebrow">Match {matchIndex + 1}</span>
                  <span className="tactical-chip text-[var(--text-muted)]">Round 1</span>
                </div>

                {pair.map((slot, slotIndex) =>
                  slot.isBye ? (
                    <div key={`match-${matchIndex + 1}-slot-${slotIndex + 1}`}>
                      <div className="label">Slot {slotIndex === 0 ? "A" : "B"}</div>
                      <div className="field border border-[rgba(255,179,178,0.1)] text-[var(--text-muted)]">
                        BYE
                      </div>
                    </div>
                  ) : (
                    <div key={`match-${matchIndex + 1}-seed-${slot.seed}`}>
                      <label className="label" htmlFor={`match-${matchIndex + 1}-seed-${slot.seed}`}>
                        Slot {slotIndex === 0 ? "A" : "B"} | Seed {slot.seed}
                      </label>
                      <div className="tactical-input-wrap">
                        <input
                          id={`match-${matchIndex + 1}-seed-${slot.seed}`}
                          className="field"
                          disabled={busy}
                          placeholder={`TEAM ${slot.seed}`}
                          value={slot.value}
                          onChange={(event) => updateTeamName(slot.seed!, event.target.value)}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        </section>

        <BracketBoard
          bracket={previewBracket}
          busy={busy}
          editable={!hasUnsavedChanges && setupComplete}
          onPickWinner={!hasUnsavedChanges && setupComplete ? pickWinner : undefined}
        />

        {!hasUnsavedChanges && setupComplete ? (
          <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Manual Continuation</p>
                <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                  Resolve Bracket From External Series
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                  Use this only when a bracket-linked match had to be finished in a separate manual series.
                  The linked bracket series stays as the scheduled shell, and the external completed series decides who advances.
                </p>
              </div>
              <span className="tactical-chip text-[var(--text-secondary)]">
                {continuationMatches.length} eligible
              </span>
            </div>

            {continuationMatches.length === 0 ? (
              <div className="status-info">
                No bracket matches currently need manual continuation resolution.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {continuationMatches.map(({ key, match, linkedMatchSeries, compatibleSeries, activeResolution }) => (
                  <article key={key} className="panel-soft space-y-4 px-5 py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tactical-chip text-[var(--text-accent)]">
                        Round {match.round}
                      </span>
                      <span className="tactical-chip text-[var(--text-secondary)]">
                        Match {match.match}
                      </span>
                      {match.winnerSource === "continuation" ? (
                        <span className="tactical-chip text-[var(--success)]">
                          Continuation applied
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

                    <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <div>
                        Linked series:
                        {" "}
                        <span className="text-[var(--text-primary)]">
                          {linkedMatchSeries?.teamA} vs {linkedMatchSeries?.teamB}
                        </span>
                      </div>
                      <div>
                        Status:
                        {" "}
                        <span className="text-[var(--text-primary)]">
                          {linkedMatchSeries?.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      {activeResolution ? (
                        <div>
                          Current continuation:
                          {" "}
                          <span className="text-[var(--success)]">
                            {activeResolution.winnerName} ({activeResolution.scoreline})
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                      <div>
                        <label className="label" htmlFor={`continuation-${key}`}>
                          Completed Manual Series
                        </label>
                        <select
                          id={`continuation-${key}`}
                          className="select"
                          disabled={busy}
                          value={continuationSelection[key] ?? activeResolution?.seriesId ?? ""}
                          onChange={(event) =>
                            setContinuationSelection((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select a completed manual series</option>
                          {compatibleSeries.map((entry) => (
                            <option key={entry._id} value={entry._id}>
                              {entry.teamA} vs {entry.teamB} | {entry.overallScore.teamA}-{entry.overallScore.teamB}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="label" htmlFor={`continuation-note-${key}`}>
                          Continuation Note
                        </label>
                        <div className="tactical-input-wrap">
                          <textarea
                            id={`continuation-note-${key}`}
                            className="textarea"
                            disabled={busy}
                            placeholder="Why this bracket match had to be continued outside the linked series."
                            value={continuationNotes[key] ?? activeResolution?.note ?? ""}
                            onChange={(event) =>
                              setContinuationNotes((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <button
                        className="button-primary"
                        disabled={busy || !(continuationSelection[key] ?? activeResolution?.seriesId)}
                        onClick={() =>
                          void resolveFromContinuation(
                            match.round,
                            match.match,
                            continuationSelection[key] ?? activeResolution?.seriesId ?? null,
                          )
                        }
                        type="button"
                      >
                        Apply
                      </button>

                      <button
                        className="button-secondary"
                        disabled={busy || !activeResolution}
                        onClick={() => void resolveFromContinuation(match.round, match.match, null)}
                        type="button"
                      >
                        Clear
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {previewBracket.manualResolutions.length > 0 ? (
          <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Audit Trail</p>
                <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
                  Continuation History
                </h3>
              </div>
              <span className="tactical-chip text-[var(--text-secondary)]">
                {previewBracket.manualResolutions.length} entries
              </span>
            </div>

            <div className="space-y-3">
              {[...previewBracket.manualResolutions]
                .sort((left, right) =>
                  (right.resolvedAt ?? "").localeCompare(left.resolvedAt ?? ""),
                )
                .map((entry) => (
                  <article key={`${entry.round}-${entry.match}-${entry.seriesId}`} className="panel-soft space-y-3 px-5 py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tactical-chip text-[var(--text-accent)]">
                        Round {entry.round}
                      </span>
                      <span className="tactical-chip text-[var(--text-secondary)]">
                        Match {entry.match}
                      </span>
                      <span className="tactical-chip text-[var(--success)]">
                        {entry.winnerName}
                      </span>
                      <span className="tactical-chip text-[var(--text-secondary)]">
                        {entry.scoreline}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                      <div>
                        Continued via manual series{" "}
                        <Link className="text-[var(--text-primary)] underline decoration-[rgba(255,255,255,0.18)] underline-offset-4" href={`/admin/series/${entry.seriesId}`}>
                          {entry.seriesId}
                        </Link>
                      </div>
                      {entry.note ? <div>{entry.note}</div> : null}
                      {entry.resolvedAt ? (
                        <div className="mono text-xs text-[var(--text-muted)]">
                          Resolved {new Date(entry.resolvedAt).toLocaleString("en-IN")}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ) : null}
      </form>
    </div>
  );
}
