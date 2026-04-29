"use client";

import Image from "next/image";
import { MAPS } from "@/lib/map-pool";
import type { MapId } from "@/lib/map-pool";

interface SeriesMapPoolProps {
  selected: MapId[];
  busy: boolean;
  onToggle: (mapId: MapId) => void;
  onStart: () => void;
}

export function SeriesMapPool({
  selected,
  busy,
  onToggle,
  onStart,
}: SeriesMapPoolProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="eyebrow">Phase 1</p>
        <h2 className="font-display text-3xl font-black uppercase tracking-[-0.05em]">
          Select 7 Maps
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          Build the tournament pool. Only these seven maps move into the veto
          flow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MAPS.map((mapMeta) => {
          const isSelected = selected.includes(mapMeta.id);
          const isDisabled = !isSelected && selected.length >= 7;

          return (
            <button
              key={mapMeta.id}
              className={`group relative overflow-hidden border border-white/6 text-left transition duration-200 ${
                isSelected
                  ? "shadow-[0_0_0_1px_rgba(96,220,176,0.45)]"
                  : ""
              } ${isDisabled ? "opacity-45" : "hover:-translate-y-0.5"}`}
              disabled={busy || isDisabled}
              onClick={() => onToggle(mapMeta.id)}
              type="button"
            >
              <div className="relative h-44">
                <Image
                  alt={mapMeta.label}
                  className={`h-full w-full object-cover transition duration-300 ${
                    isSelected
                      ? "scale-[1.02] grayscale-0"
                      : "grayscale-[0.4] group-hover:grayscale-0"
                  }`}
                  fill
                  quality={56}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={mapMeta.imagePath}
                />
                <div
                  className={`absolute inset-0 ${
                    isSelected
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
                      isSelected
                        ? "text-[var(--success)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {isSelected ? "Selected" : "Available"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="font-display text-2xl font-black uppercase leading-none tracking-[-0.05em] text-white">
                    {mapMeta.label}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <span className="tactical-chip text-[var(--text-primary)]">
            {selected.length}/7 selected
          </span>
          <p className="text-sm text-[var(--text-secondary)]">
            Pick exactly seven maps to unlock the veto board.
          </p>
        </div>
        <button
          className="button-primary"
          disabled={busy || selected.length !== 7}
          onClick={onStart}
          type="button"
        >
          {busy ? "Starting..." : "Start Veto"}
        </button>
      </div>
    </section>
  );
}
