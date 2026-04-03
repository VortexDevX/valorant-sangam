"use client";

import Link from "next/link";

interface PublicTopbarProps {
  active: "home" | "brackets";
  statusLabel: string;
}

export function PublicTopbar({ active, statusLabel }: PublicTopbarProps) {
  return (
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
            <nav className="tactical-topbar-nav" aria-label="Primary">
              <Link
                className={`tactical-topbar-navlink ${active === "home" ? "is-active" : ""}`}
                href="/"
              >
                Home
              </Link>
              <Link className="tactical-topbar-navlink" href="/#series">
                Series
              </Link>
              <Link
                className={`tactical-topbar-navlink ${active === "brackets" ? "is-active" : ""}`}
                href={active === "brackets" ? "#" : "/#brackets"}
              >
                Brackets
              </Link>
              <Link className="tactical-topbar-navlink" href="/admin">
                Admin
              </Link>
            </nav>
          </div>

          <div className="tactical-topbar-side tactical-topbar-side--right">
            <span className="tactical-topbar-status">{statusLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
