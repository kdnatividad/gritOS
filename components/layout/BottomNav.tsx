"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/workouts",
    label: "Workouts",
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 8h1.5v-2h1.5v5H3.5V9.5H2V8zM12.5 8H14v1.5h-1.5V11H11V6h1.5v2zM5.5 5.5h5v5h-5z" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="9" width="3" height="6" rx="1" />
        <rect x="6" y="5" width="3" height="10" rx="1" />
        <rect x="11" y="1" width="3" height="14" rx="1" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8 10a2 2 0 100-4 2 2 0 000 4zm0-1a1 1 0 110-2 1 1 0 010 2z"
        />
        <path
          fillRule="evenodd"
          d="M6.5 1.5h3l.4 1.6a5 5 0 011 .58l1.6-.48 2.1 2.1-.48 1.6c.24.3.44.64.58 1l1.6.4v3l-1.6.4a5 5 0 01-.58 1l.48 1.6-2.1 2.1-1.6-.48c-.3.24-.64.44-1 .58l-.4 1.6h-3l-.4-1.6a5 5 0 01-1-.58l-1.6.48-2.1-2.1.48-1.6A5 5 0 011.9 9.5L.3 9.1v-3l1.6-.4c.14-.36.34-.7.58-1L2 3.1l2.1-2.1 1.6.48c.3-.24.64-.44 1-.58L6.5 1.5z"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "10px 4px",
              color: active ? "var(--accent)" : "var(--text-muted)",
              textDecoration: "none",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color 0.15s",
            }}
          >
            <span style={{ opacity: active ? 1 : 0.5 }}>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
