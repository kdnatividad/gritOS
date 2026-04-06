"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard", icon: "▣" },
  { href: "/workouts", label: "Workouts", icon: "◈" },
  { href: "/analytics", label: "Analytics", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "200px",
        minWidth: "200px",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 20px 32px" }}>
        <h1 style={{ fontSize: "28px", color: "var(--accent)", lineHeight: 1 }}>
          grit<span style={{ color: "var(--text-primary)" }}>OS</span>
        </h1>
        <p
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.15em",
            marginTop: "2px",
          }}
        >
          BUILT BY GRIT
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "rgba(200,255,0,0.05)" : "transparent",
                borderLeft: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                textDecoration: "none",
                fontFamily: "Barlow Condensed, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: "13px",
                textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "16px" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "20px", borderTop: "1px solid var(--border)" }}>
        <p
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
          }}
        >
          v0.1.0 — ALPHA
        </p>
      </div>
    </aside>
  );
}
