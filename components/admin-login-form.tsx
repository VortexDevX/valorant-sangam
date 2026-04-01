"use client";

import { useState } from "react";

interface AdminLoginFormProps {
  onAuthenticated: (token: string) => void;
}

export function AdminLoginForm({ onAuthenticated }: AdminLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed.");
      }

      setUsername("");
      setPassword("");
      onAuthenticated(payload.token);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <div className="tactical-input-wrap">
          <input
            id="username"
            className="field"
            autoComplete="off"
            placeholder="ADMIN HANDLE"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="tactical-input-wrap">
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="off"
            placeholder="ACCESS KEY"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      {error ? <div className="status-error">{error}</div> : null}

      <button className="button-primary w-full" disabled={submitting} type="submit">
        {submitting ? "Logging in..." : "Admin Login"}
      </button>
    </form>
  );
}
