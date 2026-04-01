"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";

interface AdminSessionContextValue {
  token: string;
  logout: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession() {
  const value = useContext(AdminSessionContext);

  if (!value) {
    throw new Error("useAdminSession must be used inside AdminSessionLayout.");
  }

  return value;
}

export function AdminSessionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();

  const contextValue = useMemo<AdminSessionContextValue | null>(
    () =>
      token
        ? {
            token,
            logout: () => setToken(null),
          }
        : null,
    [token],
  );

  if (!contextValue) {
    return (
      <main className="app-shell">
        <header className="tactical-topbar">
          <div className="page-wrap !py-0">
            <div className="flex min-h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="tactical-accent" />
                <div className="tactical-brand text-xl text-[var(--bg-accent)]">
                  Admin Control
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrap space-y-8">
          <section className="grid gap-6 border-l-4 border-[var(--bg-accent)] pl-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow">Tactical Route</p>
              <h1 className="page-title">Admin Network</h1>
              <p className="page-subtitle mt-4">
                Authenticate once per browser session. Route changes inside
                `/admin` keep access. Refresh clears it.
              </p>
            </div>
          </section>

          <section className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="panel px-6 py-6 md:px-8 md:py-8">
              <div className="space-y-4">
                <p className="eyebrow">Access Protocol</p>
                <h2 className="font-display text-3xl font-black uppercase tracking-[-0.06em]">
                  Authenticate Operator
                </h2>
                <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                  This route controls series creation, veto flow, and match
                  result entry. Access is kept only in memory and disappears on
                  refresh.
                </p>
              </div>
            </div>

            <section className="panel bg-[var(--bg-panel-lowest)] px-6 py-6 md:px-8">
              <AdminLoginForm onAuthenticated={setToken} />
            </section>
          </section>
        </div>
      </main>
    );
  }

  return (
    <AdminSessionContext.Provider value={contextValue}>
      <main className="app-shell">
        <header className="tactical-topbar">
          <div className="page-wrap !py-0">
            <div className="flex min-h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="tactical-accent" />
                <Link
                  className="tactical-brand text-xl text-[var(--bg-accent)]"
                  href="/admin"
                >
                  Admin Control
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  className={`font-display text-[0.66rem] uppercase tracking-[0.18em] ${
                    pathname === "/admin"
                      ? "text-[var(--text-accent)]"
                      : "text-[var(--text-muted)]"
                  }`}
                  href="/admin"
                >
                  Series Hub
                </Link>
                <button
                  className="button-secondary"
                  onClick={contextValue.logout}
                  type="button"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrap">{children}</div>
      </main>
    </AdminSessionContext.Provider>
  );
}
