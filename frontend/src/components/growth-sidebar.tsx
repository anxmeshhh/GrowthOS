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
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Crosshair,
  Zap,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Logo } from "@/components/logo";

// ─── Nav definition ─────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { to: "/command", label: "Command Center", icon: Crosshair },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Learn",
    items: [
      { to: "/discover", label: "Discover", icon: Compass },
      { to: "/roadmap", label: "Roadmap", icon: Map },
      { to: "/custom-paths", label: "My Paths", icon: BookOpen },
      { to: "/notes", label: "Notes", icon: BookOpen },
      { to: "/review", label: "Review", icon: Activity },
      { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
    ],
  },
  {
    label: "Build",
    items: [
      { to: "/projects", label: "Projects", icon: Github },
      { to: "/career", label: "Career Intel", icon: TrendingUp },
      { to: "/interview", label: "Mock Interview", icon: Zap },
    ],
  },
  {
    label: "You",
    items: [
      { to: "/profile", label: "Profile", icon: User },
      { to: "/progress", label: "Progress", icon: TrendingUp },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

// ─── NavList ─────────────────────────────────────────────────────────────────

function NavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: briefing } = useQuery({
    queryKey: ["today"],
    queryFn: async () => {
      const r = await apiFetch("/today/");
      if (!r.ok) return null;
      return r.json();
    },
  });

  return (
    <nav className={`flex flex-col gap-5 ${collapsed ? "px-2" : "px-4"}`}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1.5">
          {/* Group label (hidden when collapsed) */}
          {!collapsed && (
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
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
                }}
              />
            </div>
          )}

          {/* Items */}
          <div className="flex flex-col gap-1">
            {group.items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  id={`nav-${to.replace("/", "")}`}
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: collapsed ? "0" : "12px",
                    padding: collapsed ? "11px 0" : "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ffffff" : "#999999",
                    background: active
                      ? "linear-gradient(90deg, rgba(0,255,102,0.1) 0%, rgba(0,255,102,0.02) 100%)"
                      : "transparent",
                    boxShadow: active
                      ? "inset 1px 0 0 0 #00FF66, inset 0 0 0 1px rgba(255,255,255,0.03)"
                      : "none",
                    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    textDecoration: "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  className="nav-item group"
                  data-active={active ? "" : undefined}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className="nav-icon"
                    style={{
                      color: active ? "#00FF66" : "rgba(255,255,255,0.4)",
                      flexShrink: 0,
                      transition: "all 200ms ease",
                    }}
                  />
                  {!collapsed && (
                    <span style={{ flex: 1, zIndex: 10 }}>{label}</span>
                  )}

                  {!collapsed && to === "/review" && briefing?.due_cards > 0 && (
                    <span className="flex items-center justify-center bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px]">
                      {briefing.due_cards}
                    </span>
                  )}

                  {!collapsed && active && to !== "/review" && (
                    <ChevronRight
                      size={14}
                      style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}
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
          color: #f0f0f0 !important;
          background: rgba(255,255,255,0.04) !important;
        }
        .nav-item:not([data-active]):hover .nav-icon {
          color: #a3a3a3 !important;
        }
      `}</style>
    </nav>
  );
}

// ─── SidebarFooter ───────────────────────────────────────────────────────────

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
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
        padding: collapsed ? "12px 8px" : "16px",
        marginTop: "auto",
        position: "relative",
      }}
    >
      {/* Top subtle border gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        }}
      />

      {/* Streak bar — premium card */}
      {!collapsed && streak > 0 && (
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
            overflow: "hidden",
          }}
        >
          {/* Subtle animated background glow */}
          <div
            style={{
              position: "absolute",
              left: "-20%",
              top: 0,
              width: "140%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
              animation: "shimmer 3s infinite linear",
            }}
          />

          <Flame
            size={14}
            style={{ color: "#f59e0b", animation: "flame-flicker 2s infinite ease-in-out" }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "#fcd34d",
              fontWeight: 600,
              letterSpacing: "0.02em",
              zIndex: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
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
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (streak / 30) * 100)}%`,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                borderRadius: "2px",
                boxShadow: "0 0 6px rgba(245,158,11,0.8)",
              }}
            />
          </div>
        </div>
      )}

      {/* User row (Player Card) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? "0" : "12px",
          padding: collapsed ? "6px" : "10px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          transition: "all 200ms ease",
          cursor: "pointer",
        }}
        title={collapsed ? `${username} · ${title}` : undefined}
        className="hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)]"
      >
        {/* Avatar */}
        <div
          style={{
            height: "36px",
            width: "36px",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg, rgba(0,255,102,0.2) 0%, rgba(0,255,102,0.05) 100%)",
            border: "1px solid rgba(0,255,102,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "ui-monospace, monospace",
            fontSize: "11px",
            fontWeight: 700,
            color: "#00FF66",
            letterSpacing: "0.05em",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {initials}
        </div>

        {/* Name + title (hidden when collapsed) */}
        {!collapsed && (
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#f4f4f5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
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
              color: "#00FF66",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            {title}
          </div>
        </div>
        )}
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

function SidebarInner({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: collapsed ? "20px 8px 16px" : "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", background: "rgba(0,255,102,0.1)", border: "1px solid rgba(0,255,102,0.25)", flexShrink: 0 }}>
              <Logo size={18} />
            </div>
            {!collapsed && (
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.1 }}>GrowthOS</span>
                <span style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", fontWeight: 600, marginTop: "2px" }}>Command Center</span>
              </div>
            )}
          </div>
          {onToggle && !collapsed && (
            <button onClick={onToggle} aria-label="Collapse sidebar" className="sidebar-toggle" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", cursor: "pointer", flexShrink: 0, transition: "all 150ms ease" }}>
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        {onToggle && collapsed && (
          <button onClick={onToggle} aria-label="Expand sidebar" className="sidebar-toggle" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "30px", marginTop: "12px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 150ms ease" }}>
            <PanelLeftOpen size={16} />
          </button>
        )}
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
        <NavList onNavigate={onNavigate} collapsed={collapsed} />
      </div>

      <SidebarFooter collapsed={collapsed} />

      <style>{`
        .sidebar-toggle:hover {
          color: #ffffff !important;
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
      `}</style>
    </div>
  );
}

// ─── Sidebar (desktop) ───────────────────────────────────────────────────────

export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  return (
    <aside
      style={{
        width: collapsed ? "76px" : "260px",
        flexShrink: 0,
        margin: "16px 0 16px 16px",
        height: "calc(100vh - 32px)",
        background: "rgba(8, 8, 8, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        position: "sticky",
        top: "16px",
        overflow: "hidden",
        transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
      }}
      className="hidden lg:flex flex-col"
    >
      <SidebarInner collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}

// ─── MobileTopBar (hamburger + slide-in drawer) ────────────────────────────────

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Fixed top bar — mobile/tablet only */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          background: "rgba(3,3,3,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #1a1a1a",
          paddingTop: "env(safe-area-inset-top)",
          zIndex: 45,
        }}
        className="flex lg:hidden items-center justify-between px-4"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "30px",
              height: "30px",
              borderRadius: "9px",
              background: "rgba(0,255,102,0.1)",
              border: "1px solid rgba(0,255,102,0.25)",
            }}
          >
            <Logo size={17} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            GrowthOS
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "38px",
            height: "38px",
            borderRadius: "9px",
            background: "transparent",
            border: "1px solid #1a1a1a",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Overlay + drawer */}
      {open && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}
          />
          <aside
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              maxWidth: "84vw",
              background: "#050505",
              borderRight: "1px solid #1a1a1a",
              display: "flex",
              flexDirection: "column",
              animation: "drawer-in 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 8px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "rgba(0,255,102,0.1)",
                    border: "1px solid rgba(0,255,102,0.25)",
                  }}
                >
                  <Logo size={18} />
                </div>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                  GrowthOS
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 14px" }}>
              <NavList onNavigate={() => setOpen(false)} />
            </div>

            <SidebarFooter />
          </aside>

          <style>{`
            @keyframes drawer-in {
              from { transform: translateX(-100%); }
              to   { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

// ─── BottomNavBar (mobile) ─────────────────────────────────────────────────────

export function BottomNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Select the 5 most critical routes for mobile
  const mobileNavItems = [
    { to: "/command", label: "Mission", icon: Crosshair },
    { to: "/discover", label: "Discover", icon: Compass },
    { to: "/roadmap", label: "Roadmap", icon: Map },
    { to: "/review", label: "Review", icon: Activity },
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
              color: active ? "#00FF66" : "rgba(255,255,255,0.4)",
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
                  background: "#00FF66",
                  boxShadow: "0 2px 8px rgba(0,255,102,0.8)",
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
