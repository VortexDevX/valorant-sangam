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
      <div className="page-wrap space-y-8">
        <section className="panel px-6 py-8 md:px-10 md:py-10">
          <p className="eyebrow">Admin Route</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle mt-4">{description}</p>
        </section>

        {token ? (
          <section className="space-y-4">
            <div className="panel-soft flex items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm text-[var(--text-secondary)]">
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
          <section className="panel mx-auto w-full max-w-md px-6 py-6">
            <AdminLoginForm onAuthenticated={setToken} />
          </section>
        )}
      </div>
    </main>
  );
}
