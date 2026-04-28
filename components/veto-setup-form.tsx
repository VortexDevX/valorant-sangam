"use client";

import Image from "next/image";
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="bg-[var(--bg-panel-lowest)] px-5 py-5 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-[var(--text-accent)]">
            Series_Setup
          </h2>
          <span className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Select 7 maps first
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="tactical-input-wrap">
              <input
                id="veto-team-a"
                className="field font-display text-sm uppercase tracking-[0.1em]"
                placeholder="TEAM A"
                value={teamA}
                onChange={(event) => setTeamA(event.target.value)}
              />
            </div>
            <div className="tactical-input-wrap">
              <input
                id="veto-team-b"
                className="field font-display text-sm uppercase tracking-[0.1em]"
                placeholder="TEAM B"
                value={teamB}
                onChange={(event) => setTeamB(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 bg-[var(--bg-panel)]">
            {(["bo1", "bo3", "bo5"] as SeriesFormat[]).map((option) => {
              const active = format === option;
              return (
                <button
                  key={option}
                  className={`py-3 font-display text-[0.72rem] font-bold uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "bg-[var(--bg-accent)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-panel-high)]"
                  }`}
                  onClick={() => setFormat(option)}
                  type="button"
                >
                  {option.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Map Pool Selection</p>
            <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em]">
              Choose Exactly 7
            </h3>
          </div>
          <span className="tactical-chip text-[var(--text-primary)]">
            {selectedMaps.length}/7
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MAPS.map((mapMeta) => {
            const selected = selectedMaps.includes(mapMeta.id);
            const disableUnselected = !selected && selectedMaps.length >= 7;

            return (
              <button
                key={mapMeta.id}
                className={`group relative overflow-hidden text-left ${
                  disableUnselected ? "opacity-40" : ""
                }`}
                disabled={disabled || disableUnselected}
                onClick={() => toggleMap(mapMeta.id)}
                type="button"
              >
                <div className="relative h-36">
                  <Image
                    alt={mapMeta.label}
                    className={`h-full w-full object-cover transition duration-300 ${
                      selected ? "grayscale-0" : "grayscale-[0.7] group-hover:grayscale-0"
                    }`}
                    fill
                    quality={56}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    src={mapMeta.imagePath}
                  />
                  <div
                    className={`absolute inset-0 ${
                      selected
                        ? "bg-gradient-to-t from-[rgba(18,164,125,0.45)] to-transparent"
                        : "bg-gradient-to-t from-black/80 to-transparent"
                    }`}
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-xs font-black uppercase tracking-[0.16em] text-white">
                        {mapMeta.label}
                      </span>
                      <span
                        className={`font-display text-[0.62rem] font-black uppercase tracking-[0.18em] ${
                          selected ? "text-[var(--success)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {selected ? "Selected" : "Available"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            The veto flow will run only on the selected 7-map pool.
          </p>

          <button
            className="button-primary w-full md:w-auto md:min-w-72"
            disabled={disabled || selectedMaps.length !== 7}
            type="submit"
          >
            {disabled ? "Starting..." : "Start Veto Operation"}
          </button>
        </div>
      </section>
    </form>
  );
}
