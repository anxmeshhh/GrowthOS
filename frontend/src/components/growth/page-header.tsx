import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mission-label mb-2">{label}</div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
