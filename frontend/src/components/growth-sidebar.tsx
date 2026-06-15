import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Compass, Map, BookOpen, ClipboardCheck, Github, TrendingUp, Settings, Flame, Menu, X, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { PATHS } from "@/lib/growth-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/custom-paths", label: "My Paths", icon: BookOpen },
  { to: "/notes", label: "Notes", icon: BookOpen },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/projects", label: "Projects", icon: Github },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={
              "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 " +
              (active
                ? "bg-[#161616] text-[#e0e0e0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                : "text-[#555] hover:text-[#ccc] hover:bg-[#111]")
            }
          >
            <Icon size={15} strokeWidth={active ? 2 : 1.5} className={active ? "text-[#22c55e]" : ""} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { state } = useGrowth();
  const streak = computeStreak(state.activeDays);
  const path = PATHS.find((p) => p.id === state.settings.pathId);
  return (
    <div className="border-t border-[#1a1a1a] p-4 mt-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[#161616] border border-[#1a1a1a] flex items-center justify-center text-[10px] font-medium text-[#888]">
          {state.settings.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-[#ccc] truncate">{state.settings.displayName}</div>
          <div className="text-[10px] text-[#555] truncate">
            {path?.name ?? "No path selected"}
          </div>
        </div>
      </div>
      {streak > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#f59e0b]">
          <Flame size={13} />
          <span>{streak}d streak</span>
        </div>
      )}
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-5 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
          </div>
          <div className="text-[14px] font-semibold tracking-tight text-[#e0e0e0]">GrowthOS</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        <NavList onNavigate={onNavigate} />
      </div>
      <SidebarFooter />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 border-r border-[#1a1a1a] bg-[#0a0a0a] sticky top-0 h-screen">
      <SidebarInner />
    </aside>
  );
}

export function MobileTopBar({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden flex items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 h-12 sticky top-0 z-30">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="text-[#888] hover:text-[#e0e0e0] p-1.5 -ml-1.5"
        >
          <Menu size={18} />
        </button>
        <div className="text-[13px] font-semibold tracking-tight text-[#e0e0e0]">GrowthOS</div>
        <div className="w-7" />
      </div>
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[240px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
            <div className="flex justify-end p-2">
              <button onClick={() => setOpen(false)} className="text-[#888] hover:text-[#e0e0e0] p-1.5">
                <X size={18} />
              </button>
            </div>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      ) : null}
      {children}
    </>
  );
}