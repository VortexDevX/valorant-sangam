"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface StatusToastsProps {
  error?: string | null;
  success?: string | null;
  onErrorDismiss?: () => void;
  onSuccessDismiss?: () => void;
}

export function StatusToasts({
  error,
  success,
  onErrorDismiss,
  onSuccessDismiss,
}: StatusToastsProps) {
  useEffect(() => {
    if (!error || !onErrorDismiss) {
      return;
    }

    const timeout = window.setTimeout(onErrorDismiss, 5200);
    return () => window.clearTimeout(timeout);
  }, [error, onErrorDismiss]);

  useEffect(() => {
    if (!success || !onSuccessDismiss) {
      return;
    }

    const timeout = window.setTimeout(onSuccessDismiss, 3200);
    return () => window.clearTimeout(timeout);
  }, [success, onSuccessDismiss]);

  if (!error && !success) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[200] flex flex-col gap-3 md:inset-x-auto md:right-4 md:bottom-4 md:w-[min(28rem,calc(100vw-2rem))]">
      {error ? (
        <div
          aria-live="assertive"
          className="pointer-events-auto overflow-hidden border border-[rgba(255,70,85,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_2rem),linear-gradient(135deg,rgba(255,70,85,0.2),transparent_38%),rgba(10,16,23,0.94)] shadow-[0_20px_34px_rgba(0,0,0,0.34)] backdrop-blur-[10px]"
          role="alert"
          style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
        >
          <div className="h-[2px] bg-[linear-gradient(90deg,#ff4655,rgba(255,180,171,0.4))]" />
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rotate-45 bg-[var(--bg-accent)]" />
                <div className="font-display text-[0.9rem] font-bold uppercase tracking-[0.18em] text-[#ffd0cb]">
                  Protocol Error
                </div>
              </div>
              <div className="text-[0.98rem] font-medium leading-7 text-[#fff4f1]">{error}</div>
            </div>
            <button
              className="self-start shrink-0 border border-[rgba(255,70,85,0.24)] bg-[rgba(8,12,18,0.92)] px-3 py-2 font-display text-[0.82rem] font-bold uppercase tracking-[0.14em] text-[#ffe4df] transition hover:border-[rgba(255,70,85,0.42)] hover:text-white"
              onClick={onErrorDismiss}
              type="button"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {success ? (
        <div
          aria-live="polite"
          className="pointer-events-auto overflow-hidden border border-[rgba(104,210,174,0.32)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_2rem),linear-gradient(135deg,rgba(104,210,174,0.18),transparent_38%),rgba(10,16,23,0.94)] shadow-[0_20px_34px_rgba(0,0,0,0.32)] backdrop-blur-[10px]"
          role="status"
          style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
        >
          <div className="h-[2px] bg-[linear-gradient(90deg,#60dcb0,rgba(217,243,232,0.35))]" />
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rotate-45 bg-[var(--success)]" />
                <div className="font-display text-[0.9rem] font-bold uppercase tracking-[0.18em] text-[#9ff0d3]">
                  Update Saved
                </div>
              </div>
              <div className="text-[0.98rem] font-medium leading-7 text-[#f3fff9]">{success}</div>
            </div>
            <button
              className="self-start shrink-0 border border-[rgba(104,210,174,0.24)] bg-[rgba(8,12,18,0.92)] px-3 py-2 font-display text-[0.82rem] font-bold uppercase tracking-[0.14em] text-[#dcfff2] transition hover:border-[rgba(96,220,176,0.42)] hover:text-white"
              onClick={onSuccessDismiss}
              type="button"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
