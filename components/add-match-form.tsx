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
    <form className="panel space-y-5 px-5 py-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Match Entry</p>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-[-0.04em]">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="team-a">
            Team A
          </label>
          <input
            id="team-a"
            className="field"
            value={formValue.teamA}
            onChange={(event) => updateField("teamA", event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="team-b">
            Team B
          </label>
          <input
            id="team-b"
            className="field"
            value={formValue.teamB}
            onChange={(event) => updateField("teamB", event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="map">
            Map
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
            Score
          </label>
          <input
            id="score"
            className="field"
            placeholder="13-11"
            value={formValue.score}
            onChange={(event) => updateField("score", event.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note
        </label>
        <textarea
          id="note"
          className="textarea"
          value={formValue.note ?? ""}
          onChange={(event) => updateField("note", event.target.value)}
        />
      </div>

      <button className="button-primary" disabled={submitting} type="submit">
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
