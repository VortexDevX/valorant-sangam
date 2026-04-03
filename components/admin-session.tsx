"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";

interface AdminSessionContextValue {
  token: string;
  logout: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);
const ADMIN_SESSION_STORAGE_KEY = "valorant-sangam-admin-token";

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
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedToken = window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (token) {
      window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  }, [hydrated, token]);

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

  if (!hydrated) {
    return (
      <main className="app-shell">
        <header className="tactical-topbar">
          <div className="page-wrap !py-0">
            <div className="tactical-topbar-inner">
              <div className="tactical-topbar-side tactical-topbar-side--left">
                <span className="tactical-accent" />
                <Link className="tactical-brand tactical-topbar-brand-link" href="/">
                  Valorant Sangam
                </Link>
              </div>
              <div className="tactical-topbar-navshell">
                <nav className="tactical-topbar-nav" aria-label="Admin">
                  <span className="tactical-topbar-navlink is-active">Admin</span>
                </nav>
              </div>
              <div className="tactical-topbar-side tactical-topbar-side--right">
                <span className="tactical-topbar-status">Loading Session</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-wrap">
          <div className="status-info">Restoring admin session...</div>
        </div>
      </main>
    );
  }

  if (!contextValue) {
    return (
      <main className="app-shell">
        <header className="tactical-topbar">
          <div className="page-wrap !py-0">
            <div className="tactical-topbar-inner">
              <div className="tactical-topbar-side tactical-topbar-side--left">
                <span className="tactical-accent" />
                <Link className="tactical-brand tactical-topbar-brand-link" href="/">
                  Valorant Sangam
                </Link>
              </div>

              <div className="tactical-topbar-navshell">
                <nav className="tactical-topbar-nav" aria-label="Admin">
                  <Link className="tactical-topbar-navlink" href="/">
                    Home
                  </Link>
                  <span className="tactical-topbar-navlink is-active">Admin</span>
                </nav>
              </div>

              <div className="tactical-topbar-side tactical-topbar-side--right">
                <span className="tactical-topbar-status">Access Gate</span>
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
                `/admin` keep access. The session stays until this browser tab
                closes or you log out.
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
                  result entry. Access is stored for this browser tab only and
                  clears when the tab closes or you log out.
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
            <div className="tactical-topbar-inner">
              <div className="tactical-topbar-side tactical-topbar-side--left">
                <span className="tactical-accent" />
                <Link
                  className="tactical-brand tactical-topbar-brand-link"
                  href="/"
                >
                  Valorant Sangam
                </Link>
              </div>

              <div className="tactical-topbar-navshell">
                <nav className="tactical-topbar-nav" aria-label="Admin">
                  <Link
                    className={`tactical-topbar-navlink ${pathname === "/" ? "is-active" : ""}`}
                    href="/"
                  >
                    Public
                  </Link>
                  <Link
                    className={`tactical-topbar-navlink ${
                      pathname === "/admin" || pathname.startsWith("/admin/series")
                        ? "is-active"
                        : ""
                    }`}
                    href="/admin"
                  >
                    Series
                  </Link>
                  <Link
                    className={`tactical-topbar-navlink ${
                      pathname.startsWith("/admin/brackets") ? "is-active" : ""
                    }`}
                    href="/admin/brackets"
                  >
                    Brackets
                  </Link>
                </nav>
              </div>

              <div className="tactical-topbar-side tactical-topbar-side--right">
                <span className="tactical-topbar-status">
                  {pathname.startsWith("/admin/brackets")
                    ? "Bracket Control"
                    : pathname.startsWith("/admin/series")
                      ? "Series Control"
                      : "Admin Dashboard"}
                </span>
                <button
                  className="button-secondary tactical-topbar-button"
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
