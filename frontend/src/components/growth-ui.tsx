import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">{children}</div>
    </main>
  );
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
      <div>
        {kicker ? (
          <div className="text-[12px] uppercase tracking-[0.15em] text-[#fff] mb-1">{kicker}</div>
        ) : null}
        <h1 className="text-2xl sm:text-[29px] font-semibold tracking-tight text-[#e8e8e8]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[14px] text-[#eee] mt-1.5 leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111] border border-[#1a1a1a] rounded-xl ${className}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-[0.15em] text-[#fff]">{label}</div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${accent ? "text-[#22c55e]" : "text-[#e0e0e0]"}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-lg text-[#eee]">{sub}</div> : null}
    </Card>
  );
}

export function Progress({ value, color = "#22c55e" }: { value: number; color?: string }) {
  return (
    <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
      <div
        className="h-1 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "green" | "amber" | "red" | "blue";
}) {
  const map: Record<string, string> = {
    muted: "bg-[#151515] text-[#eee] border-[#1a1a1a]",
    green: "bg-[#0d1a0d] text-[#22c55e] border-[#22c55e]/20",
    amber: "bg-[#1a140a] text-[#f59e0b] border-[#f59e0b]/20",
    red: "bg-[#1a0a0a] text-[#ef4444] border-[#ef4444]/20",
    blue: "bg-[#0a121a] text-[#3b82f6] border-[#3b82f6]/20",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] tracking-wide ${map[tone]}`}
    >
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "outline";
  tone?: "green" | "neutral" | "red";
  size?: "sm" | "md";
}) {
  const sizes = size === "sm" ? "h-7 px-2.5 text-lg" : "h-9 px-4 text-lg";
  let look = "";
  if (variant === "solid") {
    if (tone === "green") look = "bg-[#22c55e] text-[#0a0a0a] hover:bg-[#16a34a] font-medium";
    else if (tone === "red") look = "bg-[#ef4444] text-white hover:bg-[#dc2626]";
    else look = "bg-[#1a1a1a] text-[#e0e0e0] hover:bg-[#222] border border-[#222]";
  } else if (variant === "outline") {
    look = "border border-[#1a1a1a] text-[#eee] hover:bg-[#141414] hover:border-[#252525]";
  } else {
    look = "text-[#fff] hover:text-[#e0e0e0] hover:bg-[#141414]";
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${sizes} ${look} ${className}`}
    >
      {children}
    </button>
  );
}

export function StepDot({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${done ? "bg-[#22c55e]" : "bg-[#252525]"}`}
    />
  );
}
