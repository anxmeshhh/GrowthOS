import type { ReactNode } from "react";

/* ── Layout ─────────────────────────────────────────────────────────────── */

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {children}
      </div>
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
        {kicker && (
          <div className="text-[10px] uppercase tracking-[0.22em] font-mono text-[#3fb950] mb-1.5">
            {kicker}
          </div>
        )}
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] text-[#dde6ef]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#6b7785] mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = "",
  glass = false,
}: {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}) {
  if (glass) {
    return (
      <div
        className={`glass-card rounded-xl ${className}`}
        style={{ borderRadius: "12px" }}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        background: "#0c1319",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}

/* ── GlassPanel — primary surface for bento/workspace cards ─────────────── */

export function GlassPanel({
  children,
  className = "",
  accent,
  style,
}: {
  children: ReactNode;
  className?: string;
  accent?: "green" | "purple" | "amber" | "blue";
  style?: React.CSSProperties;
}) {
  const accentBorder: Record<string, string> = {
    green:  "rgba(63,185,80,0.25)",
    purple: "rgba(188,140,255,0.20)",
    amber:  "rgba(227,167,38,0.22)",
    blue:   "rgba(77,157,224,0.22)",
  };
  const accentGlow: Record<string, string> = {
    green:  "0 0 0 1px rgba(63,185,80,0.12), 0 8px 32px rgba(63,185,80,0.08)",
    purple: "0 0 0 1px rgba(188,140,255,0.10), 0 8px 32px rgba(188,140,255,0.08)",
    amber:  "0 0 0 1px rgba(227,167,38,0.10), 0 8px 32px rgba(227,167,38,0.08)",
    blue:   "0 0 0 1px rgba(77,157,224,0.10), 0 8px 32px rgba(77,157,224,0.08)",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        background: "rgba(12,19,25,0.80)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        border: `1px solid ${accent ? accentBorder[accent] : "rgba(255,255,255,0.07)"}`,
        boxShadow: accent
          ? accentGlow[accent]
          : "0 2px 16px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {/* Subtle top shine line */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background: accent
            ? `linear-gradient(90deg, transparent, ${accentBorder[accent]}, transparent)`
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
      {children}
    </div>
  );
}

/* ── MetricDisplay — large stat number with label and glow ──────────────── */

export function MetricDisplay({
  label,
  value,
  sub,
  accent = "purple",
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "green" | "purple" | "amber" | "blue";
  className?: string;
}) {
  const colors: Record<string, string> = {
    green:  "#3fb950",
    purple: "#bc8cff",
    amber:  "#e3a726",
    blue:   "#4d9de0",
  };
  const glows: Record<string, string> = {
    green:  "rgba(63,185,80,0.06)",
    purple: "rgba(188,140,255,0.06)",
    amber:  "rgba(227,167,38,0.06)",
    blue:   "rgba(77,157,224,0.06)",
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <span
        className="text-[10px] uppercase tracking-[0.22em] font-mono"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {label}
      </span>
      <div
        className="mt-2 text-[42px] font-mono font-semibold leading-none tracking-[-0.02em]"
        style={{
          color: "#dde6ef",
          textShadow: `0 0 28px ${glows[accent]}`,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-1.5 text-[11px] font-mono uppercase tracking-[0.18em]"
          style={{ color: colors[accent] }}
        >
          {sub}
        </div>
      )}
      {/* Ambient corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-20 h-20 rounded-full blur-2xl"
        style={{ background: colors[accent], opacity: 0.07 }}
      />
    </div>
  );
}

/* ── StatCard (kept for backwards compat) ────────────────────────────────── */

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
      <div
        className="text-[10px] uppercase tracking-[0.22em] font-mono"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          accent ? "text-[#3fb950]" : "text-[#dde6ef]"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-[#6b7785]">{sub}</div>}
    </Card>
  );
}

/* ── Progress ────────────────────────────────────────────────────────────── */

export function Progress({
  value,
  color,
  shimmer = false,
  height = 4,
}: {
  value: number;
  color?: string;
  shimmer?: boolean;
  height?: number;
}) {
  const w = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{
        height,
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${shimmer ? "shimmer-bar-green" : ""}`}
        style={{
          width: w,
          ...(shimmer
            ? {}
            : {
                background: color || "#3fb950",
                boxShadow: value > 0 ? `0 0 10px ${color || "#3fb950"}60` : "none",
              }),
        }}
      />
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────────── */

export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "green" | "amber" | "red" | "blue" | "purple";
  className?: string;
}) {
  const map: Record<string, React.CSSProperties> = {
    muted: {
      background: "rgba(255,255,255,0.05)",
      color: "#9ba8b4",
      border: "1px solid rgba(255,255,255,0.09)",
    },
    green: {
      background: "rgba(63,185,80,0.12)",
      color: "#3fb950",
      border: "1px solid rgba(63,185,80,0.25)",
    },
    amber: {
      background: "rgba(227,167,38,0.12)",
      color: "#e3a726",
      border: "1px solid rgba(227,167,38,0.25)",
    },
    red: {
      background: "rgba(248,81,73,0.12)",
      color: "#f85149",
      border: "1px solid rgba(248,81,73,0.25)",
    },
    blue: {
      background: "rgba(77,157,224,0.12)",
      color: "#4d9de0",
      border: "1px solid rgba(77,157,224,0.25)",
    },
    purple: {
      background: "rgba(188,140,255,0.12)",
      color: "#bc8cff",
      border: "1px solid rgba(188,140,255,0.25)",
    },
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono tracking-wide ${className}`}
      style={map[tone]}
    >
      {children}
    </span>
  );
}

/* ── Btn ─────────────────────────────────────────────────────────────────── */

export function Btn({
  children,
  variant = "solid",
  tone = "green",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "outline";
  tone?: "green" | "neutral" | "red" | "purple";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-11 px-6 text-sm gap-2",
  };

  const getStyle = (): React.CSSProperties => {
    if (variant === "solid") {
      if (tone === "green") return {
        background: "#3fb950",
        color: "#051209",
        fontWeight: 600,
        boxShadow: "0 0 0 0 rgba(63,185,80,0)",
        transition: "box-shadow 0.18s ease, background 0.18s ease",
      };
      if (tone === "purple") return {
        background: "rgba(188,140,255,0.15)",
        color: "#bc8cff",
        border: "1px solid rgba(188,140,255,0.3)",
      };
      if (tone === "red") return {
        background: "#f85149",
        color: "#fff",
      };
      return {
        background: "rgba(255,255,255,0.07)",
        color: "#dde6ef",
        border: "1px solid rgba(255,255,255,0.1)",
      };
    }
    if (variant === "outline") return {
      background: "transparent",
      color: "#9ba8b4",
      border: "1px solid rgba(255,255,255,0.1)",
    };
    return {
      background: "transparent",
      color: "#9ba8b4",
    };
  };

  return (
    <button
      {...props}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        hover:brightness-110 active:scale-[0.97]
        ${sizeClasses[size]}
        ${className}
      `}
      style={getStyle()}
      onMouseEnter={(e) => {
        if (tone === "green" && variant === "solid") {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(63,185,80,0.4)";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (tone === "green" && variant === "solid") {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(63,185,80,0)";
        }
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}

/* ── StepDot ─────────────────────────────────────────────────────────────── */

export function StepDot({ done }: { done: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full transition-all duration-300"
      style={{
        background: done ? "#3fb950" : "rgba(255,255,255,0.1)",
        boxShadow: done ? "0 0 6px rgba(63,185,80,0.6)" : "none",
      }}
    />
  );
}

/* ── SectionLabel ────────────────────────────────────────────────────────── */

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-mono ${className}`}
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {children}
    </p>
  );
}
