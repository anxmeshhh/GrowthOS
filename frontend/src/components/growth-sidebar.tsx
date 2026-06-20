import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Compass, Map, BookOpen, ClipboardCheck,
  Github, TrendingUp, Settings, Flame, Menu, X, User, ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Logo } from "@/components/logo";

// ─── Nav definition ─────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/progress", label: "Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Learn",
    items: [
      { to: "/discover", label: "Discover", icon: Compass },
      { to: "/roadmap", label: "Roadmap", icon: Map },
      { to: "/custom-paths", label: "My Paths", icon: BookOpen },
      { to: "/notes", label: "Notes", icon: BookOpen },
      { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
    ],
  },
  {
    label: "Build",
    items: [
      { to: "/projects", label: "Projects", icon: Github },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

// ─── NavList ─────────────────────────────────────────────────────────────────

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-4 px-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {/* Group label */}
          <div className="px-3 mb-1 flex items-center gap-2">
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#777",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {group.label}
            </span>
            <div style={{ flex: 1, height: "1px", background: "#1a1a1a" }} />
          </div>

          {/* Items */}
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  id={`nav-${to.replace('/', '')}`}
                  onClick={onNavigate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ffffff" : "#888888",
                    background: active ? "#141414" : "transparent",
                    boxShadow: active
                      ? "inset 0 0 0 1px rgba(255,255,255,0.05)"
                      : "none",
                    transition: "color 120ms ease, background 120ms ease",
                    textDecoration: "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className="nav-item"
                  data-active={active ? "" : undefined}
                >
                  {/* Active left bar */}
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: "2px",
                        borderRadius: "0 2px 2px 0",
                        background: "#22c55e",
                        boxShadow: "0 0 6px rgba(34,197,94,0.5)",
                      }}
                    />
                  )}

                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    style={{
                      color: active ? "#22c55e" : "#666",
                      flexShrink: 0,
                      transition: "color 120ms ease",
                    }}
                  />
                  <span style={{ flex: 1 }}>{label}</span>

                  {active && (
                    <ChevronRight
                      size={11}
                      style={{ color: "#2a2a2a", flexShrink: 0 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Hover style via global injection */}
      <style>{`
        .nav-item:not([data-active]):hover {
          color: #e0e0e0 !important;
          background: #111111 !important;
        }
        .nav-item:not([data-active]):hover svg {
          color: #888 !important;
        }
      `}</style>
    </nav>
  );
}

// ─── SidebarFooter ───────────────────────────────────────────────────────────

function SidebarFooter() {
  const { data: profile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const r = await apiFetch("/profile/");
      if (!r.ok) throw 0;
      return r.json();
    },
  });

  const streak = profile?.streak ?? 0;
  const username = profile?.user?.username || "Hacker";
  const initials = username.slice(0, 2).toUpperCase();
  const title = profile?.selected_title || "Novice";

  return (
    <div
      style={{
        borderTop: "1px solid #141414",
        padding: "12px 14px",
        marginTop: "auto",
        background: "#0a0a0a",
      }}
    >
      {/* Streak bar — only when active */}
      {streak > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "10px",
            padding: "5px 8px",
            borderRadius: "6px",
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.12)",
          }}
        >
          <Flame size={12} style={{ color: "#f59e0b" }} />
          <span
            style={{
              fontSize: "11px",
              color: "#d97706",
              fontWeight: 500,
            }}
          >
            {streak} day streak
          </span>
          {/* Mini heat bar */}
          <div style={{ flex: 1, height: "2px", borderRadius: "1px", background: "#1a1a1a", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (streak / 30) * 100)}%`,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                borderRadius: "1px",
              }}
            />
          </div>
        </div>
      )}

      {/* User row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Avatar */}
        <div
          style={{
            height: "32px",
            width: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #161616 0%, #1a1a1a 100%)",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "ui-monospace, monospace",
            fontSize: "10px",
            fontWeight: 600,
            color: "#22c55e",
            letterSpacing: "0.05em",
            boxShadow: "0 0 0 1px rgba(34,197,94,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {initials}
        </div>

        {/* Name + title */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#ccc",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {username}
          </div>
          <div
            style={{
              marginTop: "2px",
              fontSize: "9px",
              fontFamily: "ui-monospace, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#22c55e",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SidebarInner ────────────────────────────────────────────────────────────

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid #121212",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Logo container with subtle glow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.12)",
              flexShrink: 0,
            }}
          >
            <Logo size={16} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#e0e0e0",
                lineHeight: 1,
              }}
            >
              GrowthOS
            </span>
            <span
              style={{
                fontSize: "9px",
                fontFamily: "ui-monospace, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#2a2a2a",
              }}
            >
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Nav scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 0",
          scrollbarWidth: "none",
        }}
      >
        <NavList onNavigate={onNavigate} />
      </div>

      <SidebarFooter />
    </div>
  );
}

// ─── Sidebar (desktop) ───────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        borderRight: "1px solid #111",
        background: "#0a0a0a",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
      }}
      className="hidden lg:flex"
    >
      <SidebarInner />
    </aside>
  );
}

// ─── MobileTopBar ────────────────────────────────────────────────────────────

export function MobileTopBar({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #111",
          background: "#0a0a0a",
          padding: "0 16px",
          height: "48px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
        className="lg:hidden"
      >
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          style={{
            color: "#555",
            padding: "6px",
            marginLeft: "-6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 100ms ease, background 100ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e0e0e0";
            (e.currentTarget as HTMLButtonElement).style.background = "#111";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <Menu size={17} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "5px",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logo size={12} />
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#e0e0e0",
            }}
          >
            GrowthOS
          </span>
        </div>

        <div style={{ width: "28px" }} />
      </div>

      {/* Drawer overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
          className="lg:hidden"
        >
          {/* Drawer panel */}
          <div
            style={{
              width: "248px",
              background: "#0a0a0a",
              borderRight: "1px solid #111",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0,0,0,0.6)",
            }}
          >
            {/* Close button row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "8px 10px 0",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  color: "#444",
                  padding: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 100ms ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#aaa")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
              >
                <X size={16} />
              </button>
            </div>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>

          {/* Backdrop */}
          <div
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      {children}
    </>
  );
}