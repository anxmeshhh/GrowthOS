import { Handle, Position, type HandleType } from "@xyflow/react";

const HANDLE_IDS: { id: string; position: Position }[] = [
  { id: "w1", position: Position.Left },
  { id: "w2", position: Position.Left },
  { id: "x1", position: Position.Right },
  { id: "x2", position: Position.Right },
  { id: "y1", position: Position.Top },
  { id: "y2", position: Position.Top },
  { id: "z1", position: Position.Bottom },
  { id: "z2", position: Position.Bottom },
];

export function RoadmapHandles({ type = "source" }: { type?: HandleType }) {
  return (
    <>
      {HANDLE_IDS.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={type}
          position={handle.position}
          className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0 !border-0 !bg-transparent"
          style={{
            top: handle.id.endsWith("2") ? "75%" : "25%",
            left: handle.position === Position.Left ? 0 : undefined,
            right: handle.position === Position.Right ? 0 : undefined,
          }}
        />
      ))}
    </>
  );
}
