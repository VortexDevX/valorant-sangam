"use client";

import Link from "next/link";
import type { SeriesFormat } from "@/types/veto";

interface BracketSetupPanelProps {
  title: string;
  format: SeriesFormat;
  busy: boolean;
  locked: boolean;
  setupComplete: boolean;
  hasUnsavedChanges: boolean;
  bracketId: string;
  onTitleChange: (value: string) => void;
  onFormatChange: (value: SeriesFormat) => void;
  onLockToggle: () => void;
  onCopyLink: () => void;
}

export function BracketSetupPanel({
  title,
  format,
  busy,
  locked,
  setupComplete,
  hasUnsavedChanges,
  bracketId,
  onTitleChange,
  onFormatChange,
  onLockToggle,
  onCopyLink,
}: BracketSetupPanelProps) {
  return (
    <section className="panel space-y-5 px-6 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Bracket Setup</p>
          <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
            {title || "Untitled Bracket"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Team entry mirrors the real round-one bracket order. Save first,
            then generated series will control bracket progression.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="button-primary"
            disabled={busy}
            type="submit"
          >
            {busy ? "Saving..." : "Save Bracket"}
          </button>
          <button
            className="button-secondary"
            disabled={busy}
            onClick={onLockToggle}
            type="button"
          >
            {locked ? "Unfreeze Bracket" : "Freeze Bracket"}
          </button>
          <Link className="button-secondary" href="/admin">
            Series Hub
          </Link>
          <Link
            className="button-secondary"
            href={`/brackets/${bracketId}`}
            target="_blank"
            rel="noreferrer"
          >
            Public View
          </Link>
          <button
            className="button-secondary"
            onClick={onCopyLink}
            type="button"
          >
            Copy Link
          </button>
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
              disabled={busy}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
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
            onChange={(event) => onFormatChange(event.target.value as SeriesFormat)}
          >
            <option value="bo1">BO1</option>
            <option value="bo3">BO3</option>
            <option value="bo5">BO5</option>
          </select>
        </div>
      </div>

      {!setupComplete ? (
        <div className="status-info">
          Fill all team names before generating round 1 series.
        </div>
      ) : hasUnsavedChanges ? (
        <div className="status-info">
          Save the bracket to refresh the generated series list.
        </div>
      ) : null}
    </section>
  );
}
