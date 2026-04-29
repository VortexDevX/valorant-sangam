"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { MAP_LOOKUP } from "@/lib/map-pool";
import type { SeriesRecord, SeriesResultRecord } from "@/types/series";
import type { VetoResultMap } from "@/types/veto";

interface SeriesResultEntryProps {
  series: SeriesRecord;
  busy: boolean;
  onAdd: (score: string, note: string) => Promise<void>;
  onEdit: (order: number, score: string, note: string) => Promise<void>;
  onDelete: (order: number) => Promise<void>;
}

function MapResultRow({
  mapSlot,
  result,
  series,
  busy,
  onEdit,
  onDelete,
}: {
  mapSlot: VetoResultMap;
  result: SeriesResultRecord | undefined;
  series: SeriesRecord;
  busy: boolean;
  onEdit: (order: number, score: string, note: string) => void;
  onDelete: (order: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editScore, setEditScore] = useState(result?.score ?? "");
  const [editNote, setEditNote] = useState(result?.note ?? "");

  return (
    <article className="panel px-6 py-6">
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
              : `Picked by ${
                  mapSlot.pickedBy === "teamA" ? series.teamA : series.teamB
                }`}
            {mapSlot.startingSide && mapSlot.sideChosenBy
              ? ` · ${
                  mapSlot.sideChosenBy === "teamA"
                    ? series.teamA
                    : series.teamB
                } on ${mapSlot.startingSide.toUpperCase()}`
              : ""}
          </p>
        </div>

        {result && !editing ? (
          <div className="flex flex-wrap gap-3">
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setEditScore(result.score);
                setEditNote(result.note ?? "");
                setEditing(true);
              }}
            >
              Edit
            </button>
            <ConfirmButton
              disabled={busy}
              label="Delete"
              labelPending="Deleting..."
              onConfirm={() => onDelete(mapSlot.order)}
            />
          </div>
        ) : null}
      </div>

      {result ? (
        editing ? (
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="tactical-input-wrap">
              <input
                className="field"
                placeholder="13-11"
                value={editScore}
                onChange={(e) => setEditScore(e.target.value)}
              />
            </div>
            <div className="tactical-input-wrap">
              <input
                className="field"
                placeholder="Optional note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="button-primary"
                disabled={busy}
                type="button"
                onClick={() => {
                  void onEdit(mapSlot.order, editScore, editNote);
                  setEditing(false);
                }}
              >
                Save
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => setEditing(false)}
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
              {result.winner === "teamA" ? series.teamA : series.teamB}
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
            ? "Not played — series was decided before this map."
            : "Waiting for result entry."}
        </div>
      )}
    </article>
  );
}

export function SeriesResultEntry({
  series,
  busy,
  onAdd,
  onEdit,
  onDelete,
}: SeriesResultEntryProps) {
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");

  if (!series.veto || series.veto.status !== "completed") {
    return (
      <section className="space-y-4">
        <div>
          <p className="eyebrow">Phase 3</p>
          <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
            Map Results
          </h2>
        </div>
        <div className="status-info">
          Complete the veto first. Result entry unlocks after map order is
          finalised.
        </div>
      </section>
    );
  }

  const filledOrders = new Set(series.results.map((r) => r.order));
  const nextMap = series.veto.result.maps.find(
    (m) => !filledOrders.has(m.order),
  );
  const pendingMaps = series.veto.result.maps.filter(
    (m) => !filledOrders.has(m.order),
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="eyebrow">Phase 3</p>
        <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
          Map Results
        </h2>
      </div>

      {nextMap ? (
        <form
          className="panel space-y-5 px-6 py-6"
          onSubmit={async (e) => {
            e.preventDefault();
            await onAdd(score, note);
            setScore("");
            setNote("");
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Next Result</p>
              <h3 className="font-display text-2xl font-black uppercase tracking-[-0.05em]">
                Map {nextMap.order}: {MAP_LOOKUP[nextMap.map].label}
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
                  onChange={(e) => setScore(e.target.value)}
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
                  placeholder="Optional"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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
          Series winner locked at {series.overallScore.teamA}-
          {series.overallScore.teamB}. The remaining{" "}
          {pendingMaps.length} map
          {pendingMaps.length > 1 ? "s were" : " was"} not played.
        </div>
      ) : (
        <div className="status-success">
          Series complete — all results entered.
        </div>
      )}

      <div className="space-y-4">
        {series.veto.result.maps.map((mapSlot) => (
          <MapResultRow
            key={mapSlot.order}
            busy={busy}
            mapSlot={mapSlot}
            result={series.results.find((r) => r.order === mapSlot.order)}
            series={series}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}
