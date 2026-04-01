"use client";

import { useState } from "react";
import { MAPS, type MapId } from "@/lib/map-pool";
import type { SeriesFormat } from "@/types/veto";

interface VetoSetupValue {
  teamA: string;
  teamB: string;
  format: SeriesFormat;
  mapPool: MapId[];
}

interface VetoSetupFormProps {
  disabled: boolean;
  onSubmit: (value: VetoSetupValue) => Promise<void>;
}

export function VetoSetupForm({ disabled, onSubmit }: VetoSetupFormProps) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [format, setFormat] = useState<SeriesFormat>("bo1");
  const [selectedMaps, setSelectedMaps] = useState<MapId[]>([
    "bind",
    "haven",
    "fracture",
    "lotus",
    "split",
    "pearl",
    "breeze",
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ teamA, teamB, format, mapPool: selectedMaps });
  }

  function toggleMap(mapId: MapId) {
    setSelectedMaps((currentValue) => {
      const exists = currentValue.includes(mapId);

      if (exists) {
        return currentValue.filter((value) => value !== mapId);
      }

      if (currentValue.length >= 7) {
        return currentValue;
      }

      return [...currentValue, mapId];
    });
  }

  return (
    <form className="panel space-y-5 px-5 py-5" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Series Setup</p>
        <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em]">
          Start Veto
        </h2>
      </div>

      <div>
        <label className="label" htmlFor="veto-team-a">
          Team A
        </label>
        <input
          id="veto-team-a"
          className="field"
          value={teamA}
          onChange={(event) => setTeamA(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="veto-team-b">
          Team B
        </label>
        <input
          id="veto-team-b"
          className="field"
          value={teamB}
          onChange={(event) => setTeamB(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="format">
          Format
        </label>
        <select
          id="format"
          className="select"
          value={format}
          onChange={(event) => setFormat(event.target.value as SeriesFormat)}
        >
          <option value="bo1">BO1</option>
          <option value="bo3">BO3</option>
          <option value="bo5">BO5</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label className="label !mb-0">Map Pool</label>
          <span className="mono text-sm text-[var(--text-secondary)]">
            {selectedMaps.length}/7 selected
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {MAPS.map((mapMeta) => {
            const selected = selectedMaps.includes(mapMeta.id);
            const disableUnselected = !selected && selectedMaps.length >= 7;

            return (
              <button
                key={mapMeta.id}
                className={`border px-3 py-3 text-left text-sm font-semibold uppercase tracking-[0.08em] ${
                  selected
                    ? "border-[var(--bg-accent)] bg-[rgba(255,70,85,0.14)] text-[var(--text-primary)]"
                    : "border-[var(--border-strong)] bg-[#0f1419] text-[var(--text-secondary)]"
                } ${disableUnselected ? "opacity-45" : ""}`}
                disabled={disabled || disableUnselected}
                onClick={() => toggleMap(mapMeta.id)}
                type="button"
              >
                {mapMeta.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose exactly 7 maps. The veto flow will run only on this selected pool.
        </p>
      </div>

      <button
        className="button-primary w-full"
        disabled={disabled || selectedMaps.length !== 7}
        type="submit"
      >
        {disabled ? "Starting..." : "Start Veto"}
      </button>
    </form>
  );
}
