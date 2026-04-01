"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdminSession } from "@/components/admin-session";
import { VetoBoard } from "@/components/veto-board";
import { MAPS } from "@/lib/map-pool";
import { getNextSeriesMap } from "@/lib/series";
import { deriveVetoState } from "@/lib/veto-engine";
import type { MapId } from "@/lib/map-pool";
import type { SeriesRecord } from "@/types/series";
import type { StartingSide, VetoSessionRecord } from "@/types/veto";

interface AdminSeriesWorkspaceProps {
  seriesId: string;
}

export function AdminSeriesWorkspace({ seriesId }: AdminSeriesWorkspaceProps) {
  const { token } = useAdminSession();
  const [series, setSeries] = useState<SeriesRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaps, setSelectedMaps] = useState<MapId[]>([
    "bind",
    "haven",
    "fracture",
    "lotus",
    "split",
    "pearl",
    "breeze",
  ]);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [editingScore, setEditingScore] = useState("");
  const [editingNote, setEditingNote] = useState("");

  useEffect(() => {
    const loadSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/series/${seriesId}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load series.");
        }

        setSeries(payload.series);
        if (payload.series.veto?.mapPool?.length === 7) {
          setSelectedMaps(payload.series.veto.mapPool);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load series.");
      } finally {
        setLoading(false);
      }
    };

    void loadSeries();
  }, [seriesId]);

  const nextMap = useMemo(() => (series ? getNextSeriesMap(series) : null), [series]);
  const pendingMaps = useMemo(
    () =>
      series?.veto?.status === "completed"
        ? series.veto.result.maps.filter(
            (mapSlot) => !series.results.some((entry) => entry.order === mapSlot.order),
          )
        : [],
    [series],
  );

  function toggleMap(mapId: MapId) {
    setSelectedMaps((current) => {
      if (current.includes(mapId)) {
        return current.filter((entry) => entry !== mapId);
      }

      if (current.length >= 7) {
        return current;
      }

      return [...current, mapId];
    });
  }

  async function startVeto() {
    if (!series) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${series._id}/veto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mapPool: selectedMaps }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to start veto.");
      }

      setSeries(payload.series);
      setMessage("Veto initialized.");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Failed to start veto.");
    } finally {
      setBusy(false);
    }
  }

  async function applyVetoAction(action: { map?: MapId; side?: StartingSide; undo?: boolean }) {
    if (!series) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${series._id}/veto`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(action),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update veto.");
      }

      setSeries(payload.series);
      if (action.undo) {
        setMessage("Last veto action removed.");
      } else {
        setMessage(payload.series.veto?.status === "completed" ? "Veto complete." : "Veto step saved.");
      }
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Failed to update veto.");
    } finally {
      setBusy(false);
    }
  }

  async function addResult(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!series) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${series._id}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, note }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add result.");
      }

      setSeries(payload.series);
      setScore("");
      setNote("");
      setMessage("Map result added.");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add result.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(order: number) {
    if (!series) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${series._id}/results/${order}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: editingScore, note: editingNote }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update result.");
      }

      setSeries(payload.series);
      setEditingOrder(null);
      setMessage("Result updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update result.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteResult(order: number) {
    if (!series) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/series/${series._id}/results/${order}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete result.");
      }

      setSeries(payload.series);
      setEditingOrder(null);
      setMessage("Result deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete result.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="status-info">Loading series workspace...</div>;
  }

  if (!series) {
    return <div className="status-error">Series not found.</div>;
  }

  const vetoSession: VetoSessionRecord | null =
    series.veto === null
      ? null
      : {
          _id: series._id,
          teamA: series.teamA,
          teamB: series.teamB,
          format: series.format,
          status:
            series.veto.status === "completed" ? "completed" : "in_progress",
          mapPool: series.veto.mapPool,
          actions: series.veto.actions,
          result: series.veto.result,
          createdAt: series.createdAt,
          updatedAt: series.updatedAt,
        };
  const vetoDerived =
    series.veto === null
      ? null
      : deriveVetoState({
          format: series.format,
          mapPool: series.veto.mapPool,
          actions: series.veto.actions,
        });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Link className="eyebrow" href="/admin">
          Back To Series Hub
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="page-title">{series.teamA} vs {series.teamB}</h1>
            <p className="page-subtitle mt-4">
              One workspace for the matchup: map pool selection, veto flow, and
              ordered match results.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="tactical-chip text-[var(--text-accent)]">{series.status.replaceAll("_", " ")}</span>
            <span className="tactical-chip text-[var(--text-secondary)]">{series.format}</span>
            <span className="tactical-chip text-[var(--success)]">
              {series.overallScore.teamA}-{series.overallScore.teamB}
            </span>
          </div>
        </div>
      </section>

      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

      {!series.veto ? (
        <section className="space-y-6">
          <div>
            <p className="eyebrow">Phase 1</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Select 7 Maps
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Build the tournament pool first. Only these seven maps will move into
              the veto flow, and the rest of the series will stay locked to that pool.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MAPS.map((mapMeta) => {
              const selected = selectedMaps.includes(mapMeta.id);
              const disableUnselected = !selected && selectedMaps.length >= 7;

              return (
                <button
                  key={mapMeta.id}
                  className={`group relative overflow-hidden border border-white/6 text-left transition duration-200 ${
                    selected ? "shadow-[0_0_0_1px_rgba(96,220,176,0.45)]" : ""
                  } ${disableUnselected ? "opacity-45" : "hover:-translate-y-0.5"}`}
                  disabled={busy || disableUnselected}
                  onClick={() => toggleMap(mapMeta.id)}
                  type="button"
                >
                  <div className="relative h-44">
                    <Image
                      alt={mapMeta.label}
                      className={`h-full w-full object-cover transition duration-300 ${
                        selected ? "scale-[1.02] grayscale-0" : "grayscale-[0.4] group-hover:grayscale-0"
                      }`}
                      fill
                      quality={56}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      src={mapMeta.imagePath}
                    />
                    <div
                      className={`absolute inset-0 ${
                        selected
                          ? "bg-gradient-to-t from-[rgba(12,34,28,0.12)] via-[rgba(12,34,28,0.2)] to-transparent"
                          : "bg-gradient-to-t from-[rgba(4,11,18,0.96)] via-[rgba(4,11,18,0.28)] to-transparent"
                      }`}
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                      <span className="tactical-chip text-[var(--text-primary)]">
                        {mapMeta.id}
                      </span>
                      <span
                        className={`font-display text-[0.7rem] font-black uppercase tracking-[0.12em] ${
                          selected ? "text-[var(--success)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {selected ? "Selected" : "Available"}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="min-h-[2.5rem] font-display text-2xl font-black uppercase leading-none tracking-[-0.05em] text-white">
                        {mapMeta.label}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="tactical-chip text-[var(--text-primary)]">
                {selectedMaps.length}/7 selected
              </span>
              <p className="text-sm text-[var(--text-secondary)]">
                Pick exactly seven maps to unlock the veto board.
              </p>
            </div>
            <button
              className="button-primary"
              disabled={busy || selectedMaps.length !== 7}
              onClick={() => void startVeto()}
              type="button"
            >
              {busy ? "Starting..." : "Start Veto"}
            </button>
          </div>
        </section>
      ) : null}

      {vetoSession ? (
        <section className="space-y-6">
          <div>
            <p className="eyebrow">Phase 2</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Map Veto
            </h2>
          </div>

          <VetoBoard
            busy={busy}
            derived={vetoDerived!}
            onApply={applyVetoAction}
            session={vetoSession!}
          />
        </section>
      ) : null}

      <section className="space-y-6">
        <div>
          <p className="eyebrow">Phase 3</p>
          <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
            Map Results
          </h2>
        </div>

        {!series.veto || series.veto.status !== "completed" ? (
          <div className="status-info">
            Complete the veto first. Result entry unlocks after map order is finalized.
          </div>
        ) : (
          <div className="space-y-6">
            {nextMap ? (
              <form className="panel space-y-5 px-6 py-6" onSubmit={addResult}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Next Result</p>
                    <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                      Map {nextMap.order}: {nextMap.map}
                    </h3>
                  </div>
                  <span className="tactical-chip text-[var(--text-secondary)]">
                    Strict order
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="next-score">
                      Score
                    </label>
                    <div className="tactical-input-wrap">
                      <input
                        id="next-score"
                        className="field"
                        placeholder="13-11"
                        value={score}
                        onChange={(event) => setScore(event.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="next-note">
                      Note
                    </label>
                    <div className="tactical-input-wrap">
                      <input
                        id="next-note"
                        className="field"
                        placeholder="OPTIONAL NOTE"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button className="button-primary" disabled={busy} type="submit">
                  {busy ? "Saving..." : "Add Map Result"}
                </button>
              </form>
            ) : series.overallScore.completed && pendingMaps.length > 0 ? (
              <div className="status-info">
                Series winner is already locked at {series.overallScore.teamA}-{series.overallScore.teamB}.
                {" "}The remaining {pendingMaps.length} map{pendingMaps.length > 1 ? "s were" : " was"} not played.
              </div>
            ) : (
              <div className="status-success">
                No more maps can be added. This series is complete or fully entered.
              </div>
            )}

            <div className="space-y-4">
              {series.veto.result.maps.map((mapSlot) => {
                const result = series.results.find((entry) => entry.order === mapSlot.order);
                const editing = editingOrder === mapSlot.order;

                return (
                  <article key={mapSlot.order} className="panel px-6 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tactical-chip text-[var(--text-accent)]">
                            Map {mapSlot.order}
                          </span>
                          <span className="tactical-chip text-[var(--text-secondary)]">
                            {mapSlot.map}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                          {series.teamA} vs {series.teamB}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {mapSlot.isDecider
                            ? "Decider map"
                            : `Picked by ${mapSlot.pickedBy === "teamA" ? series.teamA : series.teamB}`}
                          {mapSlot.startingSide && mapSlot.sideChosenBy
                            ? ` | ${mapSlot.sideChosenBy === "teamA" ? series.teamA : series.teamB} chose ${mapSlot.startingSide.toUpperCase()}`
                            : ""}
                        </p>
                      </div>

                      {result ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            className="button-secondary"
                            onClick={() => {
                              setEditingOrder(mapSlot.order);
                              setEditingScore(result.score);
                              setEditingNote(result.note ?? "");
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="button-danger"
                            disabled={busy}
                            onClick={() => void deleteResult(mapSlot.order)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {result ? (
                      editing ? (
                        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            className="field"
                            value={editingScore}
                            onChange={(event) => setEditingScore(event.target.value)}
                          />
                          <input
                            className="field"
                            value={editingNote}
                            onChange={(event) => setEditingNote(event.target.value)}
                          />
                          <div className="flex gap-3">
                            <button
                              className="button-primary"
                              disabled={busy}
                              onClick={() => void saveEdit(mapSlot.order)}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className="button-secondary"
                              onClick={() => setEditingOrder(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <span className="font-display text-3xl font-black text-[var(--text-accent)]">
                            {result.score}
                          </span>
                          <span className="tactical-chip text-[var(--success)]">
                            Winner: {result.winner === "teamA" ? series.teamA : series.teamB}
                          </span>
                          {result.note ? (
                            <span className="text-sm text-[var(--text-secondary)]">
                              {result.note}
                            </span>
                          ) : null}
                        </div>
                      )
                    ) : (
                      <div className="status-info mt-5">
                        {series.overallScore.completed
                          ? "Not played. The series was decided before this map."
                          : "Waiting for result entry."}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
