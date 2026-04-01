"use client";

import { useState } from "react";
import { MAPS } from "@/lib/map-pool";
import type { MatchInput, MatchRecord } from "@/types/match";

interface AddMatchFormProps {
  initialMatch?: MatchRecord | null;
  submitting: boolean;
  onSubmit: (value: MatchInput) => Promise<void>;
  onCancelEdit: () => void;
}

const defaultFormState: MatchInput = {
  teamA: "",
  teamB: "",
  map: "bind",
  score: "",
  note: "",
};

export function AddMatchForm({
  initialMatch,
  submitting,
  onSubmit,
  onCancelEdit,
}: AddMatchFormProps) {
  const [formValue, setFormValue] = useState<MatchInput>(
    initialMatch
      ? {
          teamA: initialMatch.teamA,
          teamB: initialMatch.teamB,
          map: initialMatch.map,
          score: initialMatch.score,
          note: initialMatch.note ?? "",
        }
      : defaultFormState,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(formValue);

    if (!initialMatch) {
      setFormValue(defaultFormState);
    }
  }

  function updateField<Key extends keyof MatchInput>(key: Key, value: MatchInput[Key]) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <form className="panel relative overflow-hidden px-6 py-6 md:px-8 md:py-8" onSubmit={handleSubmit}>
      <div className="absolute -right-8 -top-8 h-20 w-20 rotate-45 bg-[var(--bg-accent-soft)]" />
      <div className="absolute bottom-0 left-0 h-12 w-1 bg-[var(--bg-accent)]" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Match Entry</p>
          <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-[0.08em]">
            {initialMatch ? "Edit Match" : "Add Match"}
          </h2>
        </div>

        {initialMatch ? (
          <button
            className="button-secondary"
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="team-a">
            Team Alpha
          </label>
          <div className="tactical-input-wrap">
            <input
              id="team-a"
              className="field"
              placeholder="ENTER TEAM NAME"
              value={formValue.teamA}
              onChange={(event) => updateField("teamA", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="team-b">
            Team Bravo
          </label>
          <div className="tactical-input-wrap">
            <input
              id="team-b"
              className="field"
              placeholder="ENTER TEAM NAME"
              value={formValue.teamB}
              onChange={(event) => updateField("teamB", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="map">
            Battlefield Assignment
          </label>
          <select
            id="map"
            className="select"
            value={formValue.map}
            onChange={(event) => updateField("map", event.target.value as MatchInput["map"])}
          >
            {MAPS.map((mapMeta) => (
              <option key={mapMeta.id} value={mapMeta.id}>
                {mapMeta.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="score">
            Final Score (A - B)
          </label>
          <div className="tactical-input-wrap">
            <input
              id="score"
              className="field text-center font-display text-xl font-bold tracking-[0.08em]"
              placeholder="13 - 10"
              value={formValue.score}
              onChange={(event) => updateField("score", event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="label" htmlFor="note">
          Combat Intel / Command Notes
        </label>
        <textarea
          id="note"
          className="textarea"
          placeholder="ADDITIONAL MATCH DATA..."
          value={formValue.note ?? ""}
          onChange={(event) => updateField("note", event.target.value)}
        />
      </div>

      <button className="button-primary mt-8 w-full md:w-auto md:px-10" disabled={submitting} type="submit">
        {submitting
          ? initialMatch
            ? "Saving..."
            : "Adding..."
          : initialMatch
            ? "Save Changes"
            : "Add Match"}
      </button>
    </form>
  );
}
