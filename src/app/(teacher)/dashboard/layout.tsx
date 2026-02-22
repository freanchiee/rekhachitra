import Link from "next/link";
import { LayoutDashboard, BookOpen, PlayCircle, LogOut } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/activities", icon: BookOpen, label: "Activities" },
  { href: "/dashboard/sessions", icon: PlayCircle, label: "Sessions" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r sticky top-0 h-screen"
        style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              R
            </div>
            <span
              className="text-base font-bold"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-heading)" }}
            >
              Rekhachitra
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--color-brand-teal)", fontFamily: "var(--font-heading)" }}
            >
              T
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--color-ink)" }}>
                Teacher
              </p>
              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                teacher@school.edu
              </p>
            </div>
            <Link href="/auth/login" title="Sign out">
              <LogOut size={15} style={{ color: "var(--color-muted)" }} />
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
