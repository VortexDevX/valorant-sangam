"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PublicTopbarProps {
  statusLabel: string;
}

type ActiveSection = "home" | "series" | "brackets";

export function PublicTopbar({ statusLabel }: PublicTopbarProps) {
  const [active, setActive] = useState<ActiveSection>("home");

  useEffect(() => {
    const sections: { id: ActiveSection; el: HTMLElement | null }[] = [
      { id: "brackets", el: document.getElementById("brackets") },
      { id: "series", el: document.getElementById("series") },
      { id: "home", el: document.getElementById("home") },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first section that is intersecting
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as ActiveSection);
          }
        }
      },
      {
        // Trigger when section hits the top 30% of viewport
        rootMargin: "0px 0px -70% 0px",
        threshold: 0,
      },
    );

    sections.forEach(({ el }) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const linkClass = (section: ActiveSection) =>
    `tactical-topbar-navlink ${active === section ? "is-active" : ""}`;

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
            <nav aria-label="Primary" className="tactical-topbar-nav">
              <Link className={linkClass("home")} href="/#home">
                Home
              </Link>
              <Link className={linkClass("series")} href="/#series">
                Series
              </Link>
              <Link className={linkClass("brackets")} href="/#brackets">
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
