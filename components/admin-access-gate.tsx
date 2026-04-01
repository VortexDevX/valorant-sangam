"use client";

import { useState } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";

interface AdminAccessGateProps {
  title: string;
  description: string;
  children: (authToken: string) => React.ReactNode;
}

export function AdminAccessGate({
  title,
  description,
  children,
}: AdminAccessGateProps) {
  const [token, setToken] = useState<string | null>(null);

  return (
    <main className="app-shell">
      <header className="tactical-topbar">
        <div className="page-wrap !py-0">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="tactical-accent" />
              <div>
                <div className="tactical-brand text-xl text-[var(--bg-accent)]">
                  Admin Control
                </div>
                <div className="font-display text-[0.6rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Operator Route
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <span className="h-2 w-2 animate-pulse bg-[var(--bg-accent)]" />
              <span className="font-display text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                System Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrap space-y-8">
        <section className="grid gap-6 border-l-4 border-[var(--bg-accent)] pl-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">Tactical Route</p>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle mt-4">{description}</p>
          </div>

          <div className="space-y-1 text-left md:text-right">
            <div className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Auth Level: Override
            </div>
            <div className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Session: Memory Only
            </div>
          </div>
        </section>

        {token ? (
          <section className="space-y-4">
            <div className="panel-soft flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Access is stored in memory only. Refresh will require login
                again.
              </p>
              <button
                className="button-secondary"
                onClick={() => setToken(null)}
                type="button"
              >
                Log Out
              </button>
            </div>
            {children(token)}
          </section>
        ) : (
          <section className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="panel px-6 py-6 md:px-8 md:py-8">
              <div className="space-y-4">
                <p className="eyebrow">Access Protocol</p>
                <h2 className="font-display text-3xl font-black uppercase tracking-[-0.06em]">
                  Authenticate Operator
                </h2>
                <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                  This route controls live tournament records and veto
                  operations. Access is not persisted. Closing or refreshing the
                  page requires a fresh login.
                </p>
              </div>
            </div>

            <section className="panel bg-[var(--bg-panel-lowest)] px-6 py-6 md:px-8">
              <AdminLoginForm onAuthenticated={setToken} />
            </section>
          </section>
        )}
      </div>

      <footer className="px-6 py-8 text-center">
        <span className="font-display text-[0.62rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Valorant Sangam Admin Network
        </span>
      </footer>
    </main>
  );
}
