import { CheckCircle2, Circle, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';

export type RoadmapNodeData = {
  label: string;
  topicId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  bgColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  
  // Tree expansion props
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (nodeId: string) => void;
  isTreeMode?: boolean;
  aiScore?: number;
};

export type NodeKind = 'topic' | 'milestone' | 'optional' | 'note' | 'callout';

export function getKind(bgColor?: string): NodeKind {
  if (!bgColor) return 'topic';
  const c = bgColor.toLowerCase();
  // roadmap.sh / roadmap.dev colors
  if (c === '#ffee55') return 'milestone';   // yellow section headers
  if (c === '#4147d3') return 'milestone';   // blue milestones
  if (c === '#343434') return 'callout';
  if (c === '#ffffff') return 'note';
  if (c === '#e0e0e0') return 'optional';
  return 'topic';  // #ffdfb3 (orange subtopics) and others
}

type S = {
  bg: string; bgHov: string;
  border: string; bdStyle: 'solid' | 'dashed';
  text: string; dot: string; opacity: string;
};

function resolveStyles(kind: NodeKind, status: string): S {
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const isInProgress = status === 'in_progress';
  if (isLocked) return {
    bg: '#0a0a0a', bgHov: '#0a0a0a', border: '#181818', bdStyle: 'solid',
    text: '#252525', dot: '#1e1e1e', opacity: '0.4',
  };
  if (kind === 'milestone') return {
    bg: isCompleted ? '#0a1a2e' : '#0a0f1e',
    bgHov: '#0d1428',
    border: isCompleted ? '#60a5fa' : '#3b5bdb',
    bdStyle: 'solid',
    text: isCompleted ? '#93c5fd' : '#60a5fa',
    dot: isCompleted ? '#60a5fa' : '#3b5bdb',
    opacity: '1',
  };
  if (kind === 'optional') return {
    bg: isCompleted ? '#0d1a1f' : '#0d0d0d',
    bgHov: '#101418',
    border: isCompleted ? '#22d3ee' : '#2a3a40',
    bdStyle: 'dashed',
    text: isCompleted ? '#67e8f9' : '#4a6a70',
    dot: isCompleted ? '#22d3ee' : '#2a3a40',
    opacity: '1',
  };
  // topic (yellow = recommended)
  if (isInProgress) return {
    bg: '#1a1305', bgHov: '#1f1708',
    border: '#f59e0b', bdStyle: 'solid',
    text: '#fbbf24', dot: '#f59e0b', opacity: '1',
  };
  return {
    bg: isCompleted ? '#0c1a07' : '#0f120a',
    bgHov: '#151f0e',
    border: isCompleted ? '#22c55e' : '#2a3a1e',
    bdStyle: 'solid',
    text: isCompleted ? '#4ade80' : '#a8c078',
    dot: isCompleted ? '#22c55e' : '#4a6a2a',
    opacity: '1',
  };
}

export function RoadmapNode({
  data,
  onClick,
}: {
  data: RoadmapNodeData;
  onClick?: () => void;
}) {
  const isCompleted = data.status === 'completed';
  const isLocked = data.status === 'locked';
  const isInProgress = data.status === 'in_progress';
  const kind = getKind(data.bgColor);

  if (kind === 'note' || kind === 'callout') return null;

  const s = resolveStyles(kind, data.status);

  return (
    <div className="relative" style={{ width: '100%', height: '100%' }}>
      {/* Target handle at the top */}
      {!data.isTreeMode && <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />}
      
      <button
        onClick={isLocked ? undefined : onClick}
        disabled={isLocked}
        style={{
          background: s.bg,
          border: `1px ${s.bdStyle} ${s.border}`,
          opacity: s.opacity,
          width: '100%',
          height: '100%',
        }}
        onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLElement).style.background = s.bgHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = s.bg; }}
        className="flex items-center gap-2 text-left px-3 py-[7px] rounded-[4px] transition-colors duration-100 select-none disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="shrink-0 w-[14px] flex items-center justify-center">
          {isCompleted
            ? <CheckCircle2 size={12} style={{ color: s.dot }} strokeWidth={2.5} />
            : isInProgress
              ? <span className="w-[10px] h-[10px] rounded-full animate-pulse" style={{ background: '#f59e0b' }} />
              : isLocked
                ? <Lock size={10} style={{ color: s.dot }} strokeWidth={2} />
                : <Circle size={11} style={{ color: s.dot }} strokeWidth={1.5} />
          }
        </span>
        <span
          className="flex-1 font-mono font-medium leading-snug"
          style={{ fontSize: '12px', color: s.text }}
        >
          {data.label}
        </span>
        {isCompleted && data.aiScore !== undefined && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-[#162a16] border border-[#22c55e]/30 text-[#4ade80] ml-2 shrink-0 flex items-center shadow-sm">
            ★ {data.aiScore}
          </span>
        )}
      </button>

      {/* Expand/Collapse Toggle Button */}
      {data.hasChildren && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#111] border border-[#333] hover:bg-[#222] hover:border-[#555] transition-colors shadow-md z-10"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onToggleExpand) {
              data.onToggleExpand(data.topicId);
            }
          }}
        >
          {data.isExpanded ? (
             <ChevronDown size={14} className="text-[#a0a0a0]" />
          ) : (
             <ChevronRight size={14} className="text-[#a0a0a0]" />
          )}
        </button>
      )}

      {/* Source handle at the bottom */}
      {!data.isTreeMode && <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />}
    </div>
  );
}