"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BracketBoard } from "@/components/bracket-board";
import { useAdminSession } from "@/components/admin-session";
import { StatusToasts } from "@/components/status-toasts";
import { buildSeedOrder, computeBracketView, normalizeBracketTeams } from "@/lib/brackets";
import type { BracketRecord } from "@/types/bracket";
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
        const response = await fetch(`/api/brackets/${bracketId}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load bracket.");
        }

        setBracket(payload.bracket);
        setTitle(payload.bracket.title);
        setFormat(payload.bracket.format);
        setTeams(payload.bracket.teams.map((entry: { name: string }) => entry.name));
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

              <Link className="button-secondary sm:min-w-56" href="/admin">
                Open Series Hub
              </Link>

              <Link className="button-secondary sm:min-w-56" href={`/brackets/${previewBracket._id}`}>
                Open Public Bracket
              </Link>
            </div>
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
      </form>
    </div>
  );
}
