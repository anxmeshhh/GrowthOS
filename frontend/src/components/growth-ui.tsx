import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">{children}</div>
    </main>
  );
}

export function PageHeader({ kicker, title, subtitle, actions }: { kicker?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        {kicker ? <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-1.5">{kicker}</div> : null}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f0f0f0]">{title}</h1>
        {subtitle ? <p className="text-sm text-[#999] mt-1">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111] border border-[#222] rounded-lg ${className}`}>{children}</div>
  );
}

export function StatCard({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${accent ? "text-[#22c55e]" : "text-[#f0f0f0]"}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-[#999]">{sub}</div> : null}
    </Card>
  );
}

export function Progress({ value, color = "#22c55e" }: { value: number; color?: string }) {
  return (
    <div className="h-1 w-full bg-[#222] rounded">
      <div className="h-1 rounded transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "green" | "amber" | "red" | "blue" }) {
  const map: Record<string, string> = {
    muted: "bg-[#161616] text-[#999] border-[#222]",
    green: "bg-[#0d1a0d] text-[#22c55e] border-[#22c55e]/30",
    amber: "bg-[#1a140a] text-[#f59e0b] border-[#f59e0b]/30",
    red: "bg-[#1a0a0a] text-[#ef4444] border-[#ef4444]/30",
    blue: "bg-[#0a121a] text-[#3b82f6] border-[#3b82f6]/30",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider font-mono ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Btn({
  children,
  variant = "solid",
  tone = "green",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline"; tone?: "green" | "neutral" | "red"; size?: "sm" | "md" }) {
  const sizes = size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm";
  let look = "";
  if (variant === "solid") {
    if (tone === "green") look = "bg-[#22c55e] text-black hover:bg-[#16a34a]";
    else if (tone === "red") look = "bg-[#ef4444] text-white hover:bg-[#dc2626]";
    else look = "bg-[#161616] text-[#f0f0f0] hover:bg-[#1f1f1f] border border-[#222]";
  } else if (variant === "outline") {
    look = "border border-[#222] text-[#f0f0f0] hover:bg-[#161616]";
  } else {
    look = "text-[#999] hover:text-[#f0f0f0] hover:bg-[#161616]";
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizes} ${look} ${className}`}
    >
      {children}
    </button>
  );
}

export function StepDot({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${done ? "bg-[#22c55e]" : "bg-[#333]"}`}
    />
  );
}