import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Compass,
  Map,
  BookOpen,
  ClipboardCheck,
  Github,
  TrendingUp,
  Settings,
  Flame,
  Menu,
  X,
  User,
  ChevronRight,
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
    items: [{ to: "/projects", label: "Projects", icon: Github }],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
] as const;

// ─── NavList ─────────────────────────────────────────────────────────────────

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-5 px-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1.5">
          {/* Group label */}
          <div className="px-2 mb-2 flex items-center gap-3">
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.15em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {group.label}
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)" }} />
          </div>

          {/* Items */}
          <div className="flex flex-col gap-1">
            {group.items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ffffff" : "#999999",
                    background: active ? "linear-gradient(90deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)" : "transparent",
                    boxShadow: active ? "inset 1px 0 0 0 #22c55e, inset 0 0 0 1px rgba(255,255,255,0.03)" : "none",
                    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    textDecoration: "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className="nav-item group"
                  data-active={active ? "" : undefined}
                >
                  {/* Glowing left edge behind border */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: "4px",
                        background: "#22c55e",
                        filter: "blur(6px)",
                        opacity: 0.6,
                      }}
                    />
                  )}

                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className="nav-icon"
                    style={{
                      color: active ? "#22c55e" : "rgba(255,255,255,0.4)",
                      flexShrink: 0,
                      transition: "all 200ms ease",
                    }}
                  />
                  <span style={{ flex: 1, zIndex: 10, textShadow: active ? "0 2px 10px rgba(255,255,255,0.2)" : "none" }}>{label}</span>

                  {active && (
                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
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
          color: #f0f0f0 !important;
          background: rgba(255,255,255,0.04) !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02) !important;
        }
        .nav-item:not([data-active]):hover .nav-icon {
          color: #a3a3a3 !important;
          transform: scale(1.05);
        }
        .nav-item[data-active] .nav-icon {
          animation: icon-pulse 2s infinite ease-in-out;
        }
        @keyframes icon-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(34,197,94,0.4)); }
        }
        @keyframes flame-flicker {
          0% { transform: scale(1) rotate(-2deg); opacity: 0.9; }
          25% { transform: scale(1.1) rotate(2deg); opacity: 1; filter: drop-shadow(0 0 6px rgba(245,158,11,0.6)); }
          50% { transform: scale(0.95) rotate(-1deg); opacity: 0.8; }
          75% { transform: scale(1.05) rotate(1deg); opacity: 1; filter: drop-shadow(0 0 4px rgba(245,158,11,0.4)); }
          100% { transform: scale(1) rotate(-2deg); opacity: 0.9; }
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
        padding: "16px",
        marginTop: "auto",
        position: "relative",
      }}
    >
      {/* Top subtle border gradient */}
      <div style={{
        position: "absolute",
        top: 0, left: "10%", right: "10%", height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)"
      }} />

      {/* Streak bar — glowing premium card */}
      {streak > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            padding: "8px 12px",
            borderRadius: "10px",
            background: "linear-gradient(145deg, rgba(245,158,11,0.1), rgba(220,38,38,0.05))",
            border: "1px solid rgba(245,158,11,0.15)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Subtle animated background glow */}
          <div style={{
            position: "absolute", left: "-20%", top: 0, width: "140%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
            animation: "shimmer 3s infinite linear"
          }} />
          
          <Flame size={14} style={{ color: "#f59e0b", animation: "flame-flicker 2s infinite ease-in-out" }} />
          <span
            style={{
              fontSize: "12px",
              color: "#fcd34d",
              fontWeight: 600,
              letterSpacing: "0.02em",
              zIndex: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)"
            }}
          >
            {streak} Day Streak
          </span>
          {/* Mini heat bar */}
          <div
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: "rgba(0,0,0,0.4)",
              overflow: "hidden",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
              zIndex: 1
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (streak / 30) * 100)}%`,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                borderRadius: "2px",
                boxShadow: "0 0 6px rgba(245,158,11,0.8)"
              }}
            />
          </div>
        </div>
      )}

      {/* User row (Player Card) */}
      <div style={{ 
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        transition: "all 200ms ease",
        cursor: "pointer"
      }}
      className="hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]"
      >
        {/* Avatar */}
        <div
          style={{
            height: "36px",
            width: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.05) 100%)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "ui-monospace, monospace",
            fontSize: "11px",
            fontWeight: 700,
            color: "#4ade80",
            letterSpacing: "0.05em",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {initials}
        </div>

        {/* Name + title */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#f4f4f5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em"
            }}
          >
            {username}
          </div>
          <div
            style={{
              marginTop: "1px",
              fontSize: "10px",
              fontFamily: "ui-monospace, monospace",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4ade80",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
              opacity: 0.9
            }}
          >
            {title}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
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
          padding: "24px 20px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Logo container with neon glassmorphism */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.02) 100%)",
              border: "1px solid rgba(34,197,94,0.3)",
              boxShadow: "0 0 16px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
              flexShrink: 0,
            }}
          >
            <Logo size={18} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                lineHeight: 1.1,
                textShadow: "0 2px 10px rgba(0,0,0,0.3)"
              }}
            >
              GrowthOS
            </span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "ui-monospace, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.3)",
                fontWeight: 600,
                marginTop: "2px"
              }}
            >
              Command Center
            </span>
          </div>
        </div>
      </div>

      {/* Nav scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 0 14px",
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
        width: "260px",
        flexShrink: 0,
        margin: "16px 0 16px 16px",
        height: "calc(100vh - 32px)",
        background: "rgba(8, 8, 8, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        position: "sticky",
        top: "16px",
        overflow: "hidden"
      }}
      className="hidden lg:flex flex-col"
    >
      <SidebarInner />
    </aside>
  );
}

// ─── BottomNavBar (mobile) ─────────────────────────────────────────────────────

export function BottomNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Select the 5 most critical routes for mobile
  const mobileNavItems = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/discover", label: "Discover", icon: Compass },
    { to: "/roadmap", label: "Roadmap", icon: Map },
    { to: "/progress", label: "Progress", icon: TrendingUp },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 50,
      }}
      className="flex lg:hidden items-center justify-around"
    >
      {mobileNavItems.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              flex: 1,
              height: "100%",
              textDecoration: "none",
              color: active ? "#22c55e" : "rgba(255,255,255,0.4)",
              transition: "all 200ms ease",
              position: "relative",
            }}
          >
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  width: "30%",
                  height: "2px",
                  background: "#22c55e",
                  boxShadow: "0 2px 8px rgba(34,197,94,0.8)",
                  borderRadius: "0 0 2px 2px",
                }}
              />
            )}
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

