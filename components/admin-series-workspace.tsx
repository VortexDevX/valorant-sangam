"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SeriesResultEntry } from "@/components/series-result-entry";
import { SeriesSetupPanel } from "@/components/series-setup-panel";
import { SeriesMapPool } from "@/components/series-map-pool";
import { StatusToasts } from "@/components/status-toasts";
import { useAdminSession } from "@/components/admin-session";
import { VetoBoard } from "@/components/veto-board";
import { adminFetch } from "@/lib/admin-fetch";
import { downloadSeriesResultCard } from "@/lib/export-cards";
import { canEditSeriesSetup, createBracketSeriesSummary } from "@/lib/series";
import { deriveVetoState } from "@/lib/veto-engine";
import type { MapId } from "@/lib/map-pool";
import type { SeriesRecord } from "@/types/series";
import type { SeriesFormat, StartingSide, TeamSlot, VetoSessionRecord } from "@/types/veto";

interface AdminSeriesWorkspaceProps {
  seriesId: string;
}

interface SeriesPayload {
  series: SeriesRecord;
}

const DEFAULT_MAP_POOL: MapId[] = [
  "bind", "haven", "fracture", "lotus", "split", "pearl", "breeze",
];

export function AdminSeriesWorkspace({ seriesId }: AdminSeriesWorkspaceProps) {
  const { token, logout } = useAdminSession();
  const [series, setSeries] = useState<SeriesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaps, setSelectedMaps] = useState<MapId[]>(DEFAULT_MAP_POOL);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/series/${seriesId}`, {
          cache: "no-store",
        });
        const payload = await response.json() as SeriesPayload & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load series.");
        }

        setSeries(payload.series);

        if (payload.series.veto?.mapPool?.length === 7) {
          setSelectedMaps(payload.series.veto.mapPool);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load series.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [seriesId]);

  const vetoSession = useMemo((): VetoSessionRecord | null => {
    if (!series?.veto) return null;

    return {
      _id: series._id,
      teamA: series.teamA,
      teamB: series.teamB,
      format: series.format,
      vetoStarter: series.vetoStarter,
      status: series.veto.status === "completed" ? "completed" : "in_progress",
      mapPool: series.veto.mapPool,
      actions: series.veto.actions,
      result: series.veto.result,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    };
  }, [series]);

  const vetoDerived = useMemo(() => {
    if (!series?.veto) return null;

    return deriveVetoState({
      format: series.format,
      vetoStarter: series.vetoStarter,
      mapPool: series.veto.mapPool,
      actions: series.veto.actions,
    });
  }, [series]);

  async function callApi<T>(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<T | null> {
    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await adminFetch<T>(url, {
      token,
      onUnauthorized: logout,
      method,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return null;
    }

    return result.data;
  }

  async function startVeto() {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}/veto`,
      "POST",
      { mapPool: selectedMaps },
    );

    if (data) {
      setSeries(data.series);
      setMessage("Veto initialised.");
    }
  }

  async function updateSeriesSetup(patch: {
    format?: SeriesFormat;
    vetoStarter?: TeamSlot;
  }) {
    if (!series) return;

    const format = patch.format ?? series.format;
    const vetoStarter = patch.vetoStarter ?? series.vetoStarter;

    if (format === series.format && vetoStarter === series.vetoStarter) return;

    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}`,
      "PATCH",
      { action: "update_setup", format, vetoStarter },
    );

    if (data) {
      setSeries(data.series);
      setMessage("Series setup updated.");
    }
  }

  async function applyVetoAction(action: {
    map?: MapId;
    side?: StartingSide;
    undo?: boolean;
  }) {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}/veto`,
      "PATCH",
      action,
    );

    if (data) {
      setSeries(data.series);
      setMessage(
        data.series.veto?.status === "completed"
          ? "Veto complete."
          : "Veto step saved.",
      );
    }
  }

  async function setSeriesLock(locked: boolean) {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}`,
      "PATCH",
      { action: "set_lock", locked },
    );

    if (data) {
      setSeries(data.series);
      setMessage(locked ? "Series locked." : "Series unlocked.");
    }
  }

  async function addResult(score: string, note: string) {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}/results`,
      "POST",
      { score, note },
    );

    if (data) {
      setSeries(data.series);
      setMessage("Map result added.");
    }
  }

  async function editResult(order: number, score: string, note: string) {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}/results/${order}`,
      "PATCH",
      { score, note },
    );

    if (data) {
      setSeries(data.series);
      setMessage("Result updated.");
    }
  }

  async function deleteResult(order: number) {
    const data = await callApi<SeriesPayload>(
      `/api/series/${seriesId}/results/${order}`,
      "DELETE",
    );

    if (data) {
      setSeries(data.series);
      setMessage("Result deleted.");
    }
  }

  if (loading) {
    return <div className="status-info">Loading series workspace...</div>;
  }

  if (!series) {
    return <div className="status-error">Series not found.</div>;
  }

  const canEditSetup = canEditSeriesSetup(series);

  return (
    <div className="space-y-8">
      <StatusToasts
        error={error}
        success={message}
        onErrorDismiss={() => setError(null)}
        onSuccessDismiss={() => setMessage(null)}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            className="inline-flex items-center gap-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            href="/admin"
          >
            <span aria-hidden="true">←</span> Series Hub
          </Link>
          {series.bracket ? (
            <Link
              className="inline-flex items-center gap-2 font-display text-[0.76rem] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              href={`/admin/brackets/${series.bracket.id}`}
            >
              ↗ Linked Bracket
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <h1 className="page-title">
              {series.teamA} vs {series.teamB}
            </h1>
            <p className="page-subtitle max-w-3xl">
              Map pool selection, veto flow, and ordered match results — one
              workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="tactical-chip text-[var(--text-accent)]">
              {series.status.replaceAll("_", " ")}
            </span>
            <span className="tactical-chip text-[var(--text-secondary)]">
              {series.format}
            </span>
            <span className="tactical-chip text-[var(--success)]">
              {series.overallScore.teamA}–{series.overallScore.teamB}
            </span>
            {series.locked ? (
              <span className="tactical-chip text-[var(--danger)]">
                locked
              </span>
            ) : null}
            {series.bracket ? (
              <span className="tactical-chip text-[var(--text-secondary)]">
                {createBracketSeriesSummary(series)}
              </span>
            ) : null}
            <button
              className="button-secondary"
              disabled={busy}
              onClick={() => void setSeriesLock(!series.locked)}
              type="button"
            >
              {series.locked ? "Unlock" : "Lock"}
            </button>
            {series.status === "completed" ? (
              <button
                className="button-secondary"
                onClick={() => downloadSeriesResultCard(series)}
                type="button"
              >
                Export Card
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {canEditSetup ? (
        <SeriesSetupPanel
          busy={busy}
          format={series.format}
          teamA={series.teamA}
          teamB={series.teamB}
          vetoStarter={series.vetoStarter}
          onFormatChange={(format) => void updateSeriesSetup({ format })}
          onVetoStarterChange={(vetoStarter) =>
            void updateSeriesSetup({ vetoStarter })
          }
        />
      ) : null}

      {!series.veto ? (
        <SeriesMapPool
          busy={busy}
          selected={selectedMaps}
          onStart={() => void startVeto()}
          onToggle={(mapId) =>
            setSelectedMaps((current) =>
              current.includes(mapId)
                ? current.filter((m) => m !== mapId)
                : current.length >= 7
                  ? current
                  : [...current, mapId],
            )
          }
        />
      ) : null}

      {vetoSession && vetoDerived ? (
        <section className="space-y-6">
          <div>
            <p className="eyebrow">Phase 2</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Map Veto
            </h2>
          </div>
          <VetoBoard
            busy={busy}
            derived={vetoDerived}
            session={vetoSession}
            onApply={applyVetoAction}
          />
        </section>
      ) : null}

      <SeriesResultEntry
        busy={busy}
        series={series}
        onAdd={addResult}
        onDelete={deleteResult}
        onEdit={editResult}
      />
    </div>
  );
}
