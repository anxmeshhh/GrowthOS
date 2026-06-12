import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Compass, Map, BookOpen, ClipboardCheck, Github, TrendingUp, Settings, Flame, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { PATHS } from "@/lib/growth-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/notes", label: "Notes", icon: BookOpen },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/projects", label: "Projects", icon: Github },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={
              "group flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2 " +
              (active
                ? "border-l-[#22c55e] bg-[#161616] text-white"
                : "border-l-transparent text-[#666] hover:text-[#f0f0f0] hover:bg-[#111]")
            }
          >
            <Icon size={16} strokeWidth={2} />
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
    <div className="border-t border-[#222] p-4 mt-auto">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-[#161616] border border-[#222] flex items-center justify-center text-xs font-mono text-[#999]">
          {state.settings.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-[#f0f0f0] truncate">{state.settings.displayName}</div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-[#666] truncate">
            {path?.name ?? "—"}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[#22c55e]">
        <Flame size={14} />
        <span>Day {streak}</span>
        <span className="text-[#444]">·</span>
        <span className="text-[#666]">streak</span>
      </div>
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-[#f0f0f0]">GrowthOS</div>
            <div className="text-[10px] uppercase tracking-wider font-mono text-[#666]">learning os</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavList onNavigate={onNavigate} />
      </div>
      <SidebarFooter />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-[#222] bg-[#0a0a0a] sticky top-0 h-screen">
      <SidebarInner />
    </aside>
  );
}

export function MobileTopBar({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden flex items-center justify-between border-b border-[#222] bg-[#0a0a0a] px-4 h-12 sticky top-0 z-30">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="text-[#999] hover:text-[#f0f0f0] p-1.5 -ml-1.5"
        >
          <Menu size={18} />
        </button>
        <div className="text-sm font-semibold tracking-tight">GrowthOS</div>
        <div className="w-7" />
      </div>
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] bg-[#0a0a0a] border-r border-[#222] flex flex-col">
            <div className="flex justify-end p-2">
              <button onClick={() => setOpen(false)} className="text-[#999] hover:text-[#f0f0f0] p-1.5">
                <X size={18} />
              </button>
            </div>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      ) : null}
      {children}
    </>
  );
}