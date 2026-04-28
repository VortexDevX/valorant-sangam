"use client";

import { useState } from "react";
import { VetoBoard } from "@/components/veto-board";
import { VetoSetupForm } from "@/components/veto-setup-form";
import type { MapId } from "@/lib/map-pool";
import type {
  DerivedVetoState,
  SeriesFormat,
  StartingSide,
  VetoSessionRecord,
} from "@/types/veto";

interface VetoResponsePayload {
  session: VetoSessionRecord;
  derived: DerivedVetoState;
}

interface MapSelectManagerProps {
  authToken: string;
}

export function MapSelectManager({ authToken }: MapSelectManagerProps) {
  const [payload, setPayload] = useState<VetoResponsePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function startVeto(value: {
    teamA: string;
    teamB: string;
    format: SeriesFormat;
    mapPool: MapId[];
  }) {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/veto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(value),
      });

      const nextPayload = (await response.json()) as VetoResponsePayload & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(nextPayload.error ?? "Failed to start veto.");
      }

      setPayload(nextPayload);
      setMessage("Veto session created.");
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Failed to start veto.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function applyAction(action: { map?: MapId; side?: StartingSide; undo?: boolean }) {
    if (!payload) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`/api/veto/${payload.session._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(action),
      });

      const nextPayload = (await response.json()) as VetoResponsePayload & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(nextPayload.error ?? "Failed to apply veto action.");
      }

      setPayload(nextPayload);
      setMessage(
        nextPayload.derived.isComplete
          ? "Veto complete."
          : "Veto step saved.",
      );
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : "Failed to apply veto action.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? <div className="status-success">{message}</div> : null}
      {error ? <div className="status-error">{error}</div> : null}

      {payload ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              className="button-secondary"
              onClick={() => {
                setPayload(null);
                setMessage(null);
                setError(null);
              }}
              type="button"
            >
              New Session
            </button>
          </div>
          <VetoBoard
            busy={busy}
            derived={payload.derived}
            onApply={applyAction}
            session={payload.session}
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <VetoSetupForm disabled={busy} onSubmit={startVeto} />
        </div>
      )}
    </div>
  );
}
