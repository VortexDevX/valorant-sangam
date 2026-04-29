"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BracketAuditTrail } from "@/components/bracket-audit-trail";
import { BracketBoard } from "@/components/bracket-board";
import { BracketContinuationPanel } from "@/components/bracket-continuation-panel";
import { BracketSetupPanel } from "@/components/bracket-setup-panel";
import { BracketTeamEntry } from "@/components/bracket-team-entry";
import { useAdminSession } from "@/components/admin-session";
import { StatusToasts } from "@/components/status-toasts";
import {
  buildSeedOrder,
  computeBracketView,
  normalizeBracketTeams,
} from "@/lib/brackets";
import { adminFetch } from "@/lib/admin-fetch";
import { buildPairKey } from "@/lib/series";
import type { BracketRecord } from "@/types/bracket";
import type { SeriesRecord } from "@/types/series";
import type { SeriesFormat } from "@/types/veto";

interface AdminBracketWorkspaceProps {
  bracketId: string;
}

interface BracketPayload {
  bracket: BracketRecord;
}

interface SeriesPayload {
  series: SeriesRecord[];
}

export function AdminBracketWorkspace({ bracketId }: AdminBracketWorkspaceProps) {
  const { token, logout } = useAdminSession();
  const [bracket, setBracket] = useState<BracketRecord | null>(null);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<SeriesFormat>("bo3");
  const [teams, setTeams] = useState<string[]>([]);
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [continuationSelections, setContinuationSelections] = useState<
    Record<string, string>
  >({});
  const [continuationNotes, setContinuationNotes] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyBracket(next: BracketRecord) {
    setBracket(next);
    setTitle(next.title);
    setFormat(next.format);
    setTeams(next.teams.map((entry) => entry.name));
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [bracketRes, seriesRes] = await Promise.all([
          fetch(`/api/brackets/${bracketId}`, { cache: "no-store" }),
          fetch("/api/series", { cache: "no-store" }),
        ]);
        const [bracketPayload, seriesPayload] = await Promise.all([
          bracketRes.json() as Promise<BracketPayload & { error?: string }>,
          seriesRes.json() as Promise<SeriesPayload & { error?: string }>,
        ]);

        if (!bracketRes.ok) {
          throw new Error(bracketPayload.error ?? "Failed to load bracket.");
        }

        if (!seriesRes.ok) {
          throw new Error(seriesPayload.error ?? "Failed to load series.");
        }

        applyBracket(bracketPayload.bracket);
        setSeries(seriesPayload.series);
        setContinuationSelections(
          Object.fromEntries(
            (bracketPayload.bracket.manualResolutions ?? []).map(
              (entry) => [`${entry.round}-${entry.match}`, entry.seriesId],
            ),
          ),
        );
        setContinuationNotes(
          Object.fromEntries(
            (bracketPayload.bracket.manualResolutions ?? []).map(
              (entry) => [`${entry.round}-${entry.match}`, entry.note ?? ""],
            ),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load bracket.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [bracketId]);

  const hasTeamChanges = useMemo(
    () =>
      !!bracket &&
      teams.some((entry, index) => entry !== bracket.teams[index]?.name),
    [bracket, teams],
  );

  const previewBracket = useMemo((): BracketRecord | null => {
    if (!bracket) return null;

    const normalizedTeams = normalizeBracketTeams(teams);

    if (!hasTeamChanges) {
      return { ...bracket, title, format, teams: normalizedTeams };
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
    };
  }, [bracket, format, hasTeamChanges, teams, title]);

  const hasUnsavedChanges = useMemo(
    () =>
      !!bracket &&
      (title !== bracket.title ||
        format !== bracket.format ||
        teams.some((entry, index) => entry !== bracket.teams[index]?.name)),
    [bracket, format, teams, title],
  );

  const setupComplete = useMemo(
    () =>
      previewBracket !== null &&
      teams.filter((entry) => entry.trim().length > 0).length ===
        previewBracket.teamCount,
    [previewBracket, teams],
  );

  const firstRoundMatchups = useMemo(() => {
    if (!previewBracket) return [];

    const slotSeeds = buildSeedOrder(previewBracket.bracketSize);
    const pairs: Array<
      Array<{ seed: number | null; value: string; isBye: boolean }>
    > = [];

    for (let i = 0; i < slotSeeds.length; i += 2) {
      const topSeed = slotSeeds[i];
      const bottomSeed = slotSeeds[i + 1];

      pairs.push([
        {
          seed: topSeed <= previewBracket.teamCount ? topSeed : null,
          value:
            topSeed <= previewBracket.teamCount
              ? (teams[topSeed - 1] ?? "")
              : "BYE",
          isBye: topSeed > previewBracket.teamCount,
        },
        {
          seed: bottomSeed <= previewBracket.teamCount ? bottomSeed : null,
          value:
            bottomSeed <= previewBracket.teamCount
              ? (teams[bottomSeed - 1] ?? "")
              : "BYE",
          isBye: bottomSeed > previewBracket.teamCount,
        },
      ]);
    }

    return pairs;
  }, [previewBracket, teams]);

  const continuationEntries = useMemo(() => {
    if (!previewBracket) return [];

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
            (entry) =>
              entry.round === match.round && entry.match === match.match,
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
          (entry.activeResolution !== null ||
            entry.compatibleSeries.length > 0),
      );
  }, [previewBracket, series]);

  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await adminFetch<BracketPayload>(
      `/api/brackets/${bracketId}`,
      {
        token,
        onUnauthorized: logout,
        method: "PATCH",
        body: JSON.stringify({ title, format, teams }),
      },
    );

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    applyBracket(result.data!.bracket);
    setMessage("Bracket setup saved.");
  }

  async function pickWinner(
    round: number,
    match: number,
    winnerSeed: number | null,
  ) {
    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await adminFetch<BracketPayload>(
      `/api/brackets/${bracketId}/matches/${round}/${match}`,
      {
        token,
        onUnauthorized: logout,
        method: "PATCH",
        body: JSON.stringify({ winnerSeed }),
      },
    );

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    applyBracket(result.data!.bracket);
    setMessage("Bracket updated.");
  }

  async function resolveFromContinuation(
    round: number,
    match: number,
    continuationSeriesId: string | null,
  ) {
    const key = `${round}-${match}`;

    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await adminFetch<BracketPayload>(
      `/api/brackets/${bracketId}/matches/${round}/${match}`,
      {
        token,
        onUnauthorized: logout,
        method: "PATCH",
        body: JSON.stringify({
          continuationSeriesId,
          note: continuationNotes[key] ?? "",
        }),
      },
    );

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const updatedBracket = result.data!.bracket;
    applyBracket(updatedBracket);
    setContinuationSelections((current) => ({
      ...current,
      [key]: continuationSeriesId ?? "",
    }));
    setContinuationNotes((current) => ({
      ...current,
      [key]:
        updatedBracket.manualResolutions.find(
          (entry) => entry.round === round && entry.match === match,
        )?.note ??
        current[key] ??
        "",
    }));
    setMessage(
      continuationSeriesId
        ? "Bracket match resolved from continuation."
        : "Continuation cleared.",
    );
  }

  async function setBracketLock(locked: boolean) {
    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await adminFetch<BracketPayload>(
      `/api/brackets/${bracketId}`,
      {
        token,
        onUnauthorized: logout,
        method: "PATCH",
        body: JSON.stringify({ locked }),
      },
    );

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    applyBracket(result.data!.bracket);
    setMessage(locked ? "Bracket frozen." : "Bracket unfrozen.");
  }

  async function copyPublicLink() {
    if (!previewBracket) return;

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/brackets/${previewBracket._id}`,
      );
      setMessage("Public link copied.");
    } catch {
      setError("Failed to copy link.");
    }
  }

  if (loading) {
    return <div className="status-info">Loading bracket workspace...</div>;
  }

  if (!previewBracket) {
    return <div className="status-error">Bracket not found.</div>;
  }

  const canInteract = !hasUnsavedChanges && setupComplete;

  return (
    <div className="space-y-8">
      <StatusToasts
        error={error}
        success={message}
        onErrorDismiss={() => setError(null)}
        onSuccessDismiss={() => setMessage(null)}
      />

      <section className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          href="/admin/brackets"
        >
          <span aria-hidden="true">←</span> All Brackets
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title">{previewBracket.title}</h1>
            <p className="page-subtitle mt-4">
              Fill teams in round-one order. BYE slots are automatic.
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
        <BracketSetupPanel
          bracketId={bracketId}
          busy={busy}
          format={format}
          hasUnsavedChanges={hasUnsavedChanges}
          locked={previewBracket.locked}
          setupComplete={setupComplete}
          title={title}
          onCopyLink={() => void copyPublicLink()}
          onFormatChange={setFormat}
          onLockToggle={() => void setBracketLock(!previewBracket.locked)}
          onTitleChange={setTitle}
        />

        <BracketTeamEntry
          busy={busy}
          matchups={firstRoundMatchups}
          totalMatches={previewBracket.rounds[0]?.matches.length ?? 0}
          onTeamChange={(seed, value) =>
            setTeams((current) =>
              current.map((entry, index) =>
                index === seed - 1 ? value : entry,
              ),
            )
          }
        />

        <BracketBoard
          bracket={previewBracket}
          busy={busy}
          editable={canInteract}
          onPickWinner={canInteract ? pickWinner : undefined}
        />

        {canInteract ? (
          <BracketContinuationPanel
            busy={busy}
            entries={continuationEntries}
            notes={continuationNotes}
            selections={continuationSelections}
            onApply={(round, match, seriesId) =>
              void resolveFromContinuation(round, match, seriesId)
            }
            onNoteChange={(key, value) =>
              setContinuationNotes((current) => ({
                ...current,
                [key]: value,
              }))
            }
            onSelectionChange={(key, value) =>
              setContinuationSelections((current) => ({
                ...current,
                [key]: value,
              }))
            }
          />
        ) : null}
      </form>

      <BracketAuditTrail resolutions={previewBracket.manualResolutions} />
    </div>
  );
}
