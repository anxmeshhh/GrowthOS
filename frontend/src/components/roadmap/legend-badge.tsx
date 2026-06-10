import { Check } from "lucide-react";

export function LegendBadge({
  color,
  position = "right-center",
}: {
  color: string;
  position?: string;
}) {
  const isLeft = position.includes("left");

  return (
    <span
      className={`absolute top-1/2 z-10 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full border border-black/20 text-white shadow-sm ${isLeft ? "-left-2.5" : "-right-2.5"}`}
      style={{ backgroundColor: color }}
    >
      <Check className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}
