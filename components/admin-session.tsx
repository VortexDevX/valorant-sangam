"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";

interface AdminSessionContextValue {
  token: string;
  logout: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);
const SESSION_KEY = "valorant-admin-token";

export function useAdminSession() {
  const value = useContext(AdminSessionContext);

  if (!value) {
    throw new Error("useAdminSession must be used inside AdminSessionLayout.");
  }

  return value;
}

export function AdminSessionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setToken(stored);
      }
    } catch {
      // sessionStorage unavailable — proceed without restoring
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      if (token) {
        window.sessionStorage.setItem(SESSION_KEY, token);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage unavailable — session will not persist
    }
  }, [hydrated, token]);

  const logout = useCallback(() => setToken(null), []);

  const contextValue = useMemo<AdminSessionContextValue | null>(
    () => (token ? { token, logout } : null),
    [token, logout],
  );

  if (!hydrated) {
    return (
      <main className="app-shell">
        <AdminTopbar pathname={pathname} status="Loading Session" />
        <div className="page-wrap">
          <div className="status-info">Restoring session...</div>
        </div>
      </main>
    );
  }

  if (!contextValue) {
    return (
      <main className="app-shell">
        <AdminTopbar pathname={pathname} status="Access Gate" showHomeLink />
        <div className="page-wrap space-y-8">
          <section className="grid gap-6 border-l-4 border-[var(--bg-accent)] pl-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow">Tactical Route</p>
              <h1 className="page-title">Admin Network</h1>
              <p className="page-subtitle mt-4">
                Authenticate once per browser session. The session stays until
                this tab closes or you log out.
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
        <AdminTopbar
          pathname={pathname}
          status={
            pathname.startsWith("/admin/brackets")
              ? "Bracket Control"
              : pathname.startsWith("/admin/series")
                ? "Series Control"
                : "Admin Dashboard"
          }
          showHomeLink
          onLogout={contextValue.logout}
        />
        <div className="page-wrap">{children}</div>
      </main>
    </AdminSessionContext.Provider>
  );
}

// Extracted topbar to avoid tripling the JSX
function AdminTopbar({
  pathname,
  status,
  showHomeLink = false,
  onLogout,
}: {
  pathname: string;
  status: string;
  showHomeLink?: boolean;
  onLogout?: () => void;
}) {
  return (
    <header className="tactical-topbar">
      <div className="page-wrap !py-0">
        <div className="tactical-topbar-inner">
          <div className="tactical-topbar-side tactical-topbar-side--left">
            <span className="tactical-accent" />
            <Link
              className="tactical-brand tactical-topbar-brand-link"
              href="/"
            >
              Valorant Circuit
            </Link>
          </div>

          <div className="tactical-topbar-navshell">
            <nav aria-label="Admin" className="tactical-topbar-nav">
              {showHomeLink ? (
                <Link
                  className={`tactical-topbar-navlink ${pathname === "/" ? "is-active" : ""}`}
                  href="/"
                >
                  Public
                </Link>
              ) : (
                <span className="tactical-topbar-navlink is-active">Admin</span>
              )}
              {showHomeLink ? (
                <>
                  <Link
                    className={`tactical-topbar-navlink ${
                      pathname === "/admin" ||
                      pathname.startsWith("/admin/series")
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
                </>
              ) : null}
            </nav>
          </div>

          <div className="tactical-topbar-side tactical-topbar-side--right">
            <span className="tactical-topbar-status">{status}</span>
            {onLogout ? (
              <button
                className="button-secondary tactical-topbar-button"
                onClick={onLogout}
                type="button"
              >
                Log Out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
