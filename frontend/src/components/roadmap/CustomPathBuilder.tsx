import React, { useState, useCallback } from 'react';
import {
  Plus, X, Sparkles, Loader2, GripVertical, ChevronDown,
  AlertCircle, CheckCircle2, Flag, BookOpen, Lightbulb, ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { apiClient } from '../../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeKind = 'milestone' | 'topic' | 'optional';

interface TopicDraft {
  _id: string; // local only, not sent to server
  title: string;
  summary: string;
  node_kind: NodeKind;
  order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIND_META: Record<NodeKind, {
  label: string;
  desc: string;
  icon: React.ElementType;
  border: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  milestone: {
    label: 'Milestone',
    desc: 'Section header',
    icon: Flag,
    border: '#3b5bdb',
    bg: '#0a0f1e',
    text: '#60a5fa',
    dot: '#3b5bdb',
  },
  topic: {
    label: 'Topic',
    desc: 'Core concept',
    icon: BookOpen,
    border: '#2a3a1e',
    bg: '#0f120a',
    text: '#a8c078',
    dot: '#4a6a2a',
  },
  optional: {
    label: 'Optional',
    desc: 'Bonus / extra',
    icon: Lightbulb,
    border: '#2a3a40',
    bg: '#0d0d0d',
    text: '#4a6a70',
    dot: '#2a3a40',
  },
};

let _uid = 0;
const uid = () => `t${++_uid}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function DarkInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-md text-sm font-mono outline-none transition-colors ${className}`}
      style={{ background: '#0a0a0a', border: '1px solid #1e2e1e', color: '#c4c4c4' }}
      onFocus={e => { (e.target as HTMLElement).style.borderColor = '#22c55e'; }}
      onBlur={e => { (e.target as HTMLElement).style.borderColor = '#1e2e1e'; }}
    />
  );
}

function DarkTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-md text-xs font-mono outline-none transition-colors resize-none"
      style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#6a6a6a' }}
      onFocus={e => { (e.target as HTMLElement).style.borderColor = '#2a3a2a'; }}
      onBlur={e => { (e.target as HTMLElement).style.borderColor = '#1a1a1a'; }}
    />
  );
}

function KindPicker({
  value,
  onChange,
}: {
  value: NodeKind;
  onChange: (k: NodeKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = KIND_META[value];
  const Icon = meta.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors"
        style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text }}
      >
        <Icon size={10} />
        {meta.label}
        <ChevronDown size={9} className="opacity-50" />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-36 rounded-md overflow-hidden shadow-xl"
          style={{ background: '#0d0d0d', border: '1px solid #1e2e1e' }}
        >
          {(Object.entries(KIND_META) as [NodeKind, typeof KIND_META[NodeKind]][]).map(([k, m]) => {
            const KIcon = m.icon;
            return (
              <button
                key={k}
                onClick={() => { onChange(k); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors"
                style={{ background: k === value ? m.bg : 'transparent', color: m.text }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = m.bg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = k === value ? m.bg : 'transparent'; }}
              >
                <KIcon size={11} />
                <div>
                  <div className="text-[10px] font-mono">{m.label}</div>
                  <div className="text-[9px] opacity-50">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopicRow({
  topic,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  topic: TopicDraft;
  index: number;
  total: number;
  onChange: (updates: Partial<TopicDraft>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const meta = KIND_META[topic.node_kind];

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: `1px solid ${meta.border}`, background: meta.bg }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Drag handle / index */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="disabled:opacity-20 text-[#333] hover:text-[#666] transition-colors"
          >
            <GripVertical size={12} />
          </button>
        </div>

        <span className="text-[10px] font-mono w-5 text-center shrink-0" style={{ color: meta.dot }}>
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <input
            value={topic.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="Topic title…"
            className="w-full bg-transparent text-sm font-mono outline-none"
            style={{ color: meta.text }}
          />
        </div>

        <KindPicker value={topic.node_kind} onChange={k => onChange({ node_kind: k })} />

        <button
          onClick={onRemove}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: '#3a1a1a' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a1a1a'; }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Summary (collapsed by default for milestones) */}
      {topic.node_kind !== 'milestone' && (
        <div className="px-3 pb-2">
          <textarea
            value={topic.summary}
            onChange={e => onChange({ summary: e.target.value })}
            placeholder="Brief summary (used for quiz & flashcard generation)…"
            rows={1}
            className="w-full bg-transparent text-[11px] font-mono outline-none resize-none"
            style={{ color: '#3a5a3a' }}
            onFocus={e => { e.currentTarget.rows = 2; }}
            onBlur={e => { if (!e.currentTarget.value) e.currentTarget.rows = 1; }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomPathBuilder({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  // Path meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState(8);

  // Topics
  const [topics, setTopics] = useState<TopicDraft[]>([]);

  // AI prompt
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const addTopic = useCallback((kind: NodeKind = 'topic') => {
    setTopics(prev => [
      ...prev,
      { _id: uid(), title: '', summary: '', node_kind: kind, order: prev.length },
    ]);
  }, []);

  const updateTopic = useCallback((id: string, updates: Partial<TopicDraft>) => {
    setTopics(prev => prev.map(t => t._id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTopic = useCallback((id: string) => {
    setTopics(prev => prev.filter(t => t._id !== id).map((t, i) => ({ ...t, order: i })));
  }, []);

  const moveTopic = useCallback((index: number, dir: -1 | 1) => {
    setTopics(prev => {
      const arr = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= arr.length) return prev;
      [arr[index], arr[swap]] = [arr[swap], arr[index]];
      return arr.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  const reset = () => {
    setTitle(''); setDescription(''); setWeeks(8);
    setTopics([]); setAiPrompt(''); setError(''); setSuccess(false);
  };

  // ── AI generation ────────────────────────────────────────────────────────────
  // Calls GeneratePathView (/api/generate-path/) which already exists in views.py
  // Returns { title, topics: [{title, subtopics:[]}] }
  // We flatten: parent becomes milestone, each subtopic becomes a topic

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/api/generate-path/', { prompt: aiPrompt });
      const data = res.data;

      if (data.title && !title) setTitle(data.title);

      const newTopics: TopicDraft[] = [];
      let order = 0;

      if (Array.isArray(data.topics)) {
        data.topics.forEach((section: { title: string; subtopics?: string[] }) => {
          // Section header → milestone
          newTopics.push({
            _id: uid(),
            title: section.title,
            summary: '',
            node_kind: 'milestone',
            order: order++,
          });
          // Subtopics → topic
          (section.subtopics || []).forEach((sub: string) => {
            newTopics.push({
              _id: uid(),
              title: sub,
              summary: '',
              node_kind: 'topic',
              order: order++,
            });
          });
        });
      }

      setTopics(newTopics);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  // Sends to CustomPathView (/api/custom-path/) which accepts:
  //   { title, topics: [{title, summary, node_kind, order, dependencies:[]}] }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Path title is required'); return; }
    const validTopics = topics.filter(t => t.title.trim());
    if (validTopics.length === 0) { setError('Add at least one topic'); return; }

    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/api/custom-path/', {
        title: title.trim(),
        description,
        estimated_weeks: weeks,
        topics: validTopics.map((t, i) => ({
          title: t.title.trim(),
          summary: t.summary,
          node_kind: t.node_kind,
          order: i,
          dependencies: [],
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        reset();
        onCreated?.();
      }, 1200);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.response?.data?.error || 'Failed to create path');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim() && topics.filter(t => t.title.trim()).length > 0 && !submitting;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono transition-colors"
          style={{ background: '#0f1a0f', border: '1px solid #22c55e', color: '#22c55e' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#162a16'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0f1a0f'; }}
        >
          <Plus size={13} />
          New path
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1e2e1e', borderRadius: '12px' }}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid #111' }}>
          <DialogTitle className="font-mono text-sm" style={{ color: '#d4d4d4' }}>
            Build a learning path
          </DialogTitle>
          <p className="text-[11px] mt-0.5" style={{ color: '#3a5a3a' }}>
            Structure it like a real roadmap — milestones group topics into sections.
          </p>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e3a1e #080c08' }}>

          {/* Error / success */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: '#1a0707', border: '1px solid #3f0f0f' }}>
              <AlertCircle size={12} style={{ color: '#ef4444' }} />
              <span className="text-[11px] font-mono" style={{ color: '#f87171' }}>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: '#071a0f', border: '1px solid #22c55e' }}>
              <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
              <span className="text-[11px] font-mono" style={{ color: '#22c55e' }}>Path created!</span>
            </div>
          )}

          {/* ── AI generator ── */}
          <div className="rounded-md p-3 space-y-2" style={{ background: '#0a0f1e', border: '1px solid #1e3a5f' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} style={{ color: '#60a5fa' }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#3b5bdb' }}>
                Generate with AI
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAiGenerate(); }}
                placeholder="e.g. Django REST API development for beginners…"
                className="flex-1 px-3 py-2 rounded-md text-xs font-mono outline-none"
                style={{ background: '#060912', border: '1px solid #1e3a5f', color: '#93c5fd' }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = '#3b5bdb'; }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = '#1e3a5f'; }}
              />
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono transition-colors disabled:opacity-40"
                style={{ background: '#0a0f1e', border: '1px solid #3b5bdb', color: '#60a5fa' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0d1428'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0a0f1e'; }}
              >
                {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
                {aiLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>
            {topics.length > 0 && (
              <p className="text-[9px] font-mono" style={{ color: '#1e3a5f' }}>
                ↑ Re-generate will replace current topics
              </p>
            )}
          </div>

          {/* ── Path meta ── */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono uppercase tracking-wider" style={{ color: '#3a5a3a' }}>
              Path title <span style={{ color: '#22c55e' }}>*</span>
            </label>
            <DarkInput value={title} onChange={setTitle} placeholder="e.g. Backend Engineering" />

            <label className="block text-[10px] font-mono uppercase tracking-wider" style={{ color: '#3a5a3a' }}>
              Description
            </label>
            <DarkTextarea value={description} onChange={setDescription} placeholder="What will learners achieve?" rows={2} />

            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono uppercase tracking-wider shrink-0" style={{ color: '#3a5a3a' }}>
                Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={e => setWeeks(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 rounded text-xs font-mono text-center outline-none"
                  style={{ background: '#0a0a0a', border: '1px solid #1e2e1e', color: '#4a6a4a' }}
                />
                <span className="text-[10px] font-mono" style={{ color: '#2a3a2a' }}>weeks</span>
              </div>
            </div>
          </div>

          {/* ── Topics ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#3a5a3a' }}>
                Topics
                {topics.length > 0 && (
                  <span className="ml-2 font-mono" style={{ color: '#2a3a2a' }}>({topics.filter(t => t.title.trim()).length} valid)</span>
                )}
              </span>
              <div className="flex gap-1.5">
                {(['milestone', 'topic', 'optional'] as NodeKind[]).map(k => {
                  const m = KIND_META[k];
                  const Icon = m.icon;
                  return (
                    <button
                      key={k}
                      onClick={() => addTopic(k)}
                      title={`Add ${m.label}`}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-colors"
                      style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.text }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                      <Icon size={9} />
                      + {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {topics.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 rounded-md"
                style={{ border: '1px dashed #1e2e1e', background: '#0a0a0a' }}
              >
                <p className="text-xs font-mono" style={{ color: '#2a3a2a' }}>No topics yet</p>
                <p className="text-[10px] mt-1" style={{ color: '#1a2a1a' }}>
                  Generate with AI or add manually above
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {topics.map((t, i) => (
                  <TopicRow
                    key={t._id}
                    topic={t}
                    index={i}
                    total={topics.length}
                    onChange={updates => updateTopic(t._id, updates)}
                    onRemove={() => removeTopic(t._id)}
                    onMoveUp={() => moveTopic(i, -1)}
                    onMoveDown={() => moveTopic(i, 1)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Kind legend */}
          {topics.length > 0 && (
            <div className="flex items-center gap-4 pt-1">
              {(Object.entries(KIND_META) as [NodeKind, typeof KIND_META[NodeKind]][]).map(([k, m]) => {
                const Icon = m.icon;
                return (
                  <div key={k} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm flex items-center justify-center" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                      <Icon size={7} style={{ color: m.text }} />
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: '#2a3a2a' }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid #111' }}
        >
          <span className="text-[10px] font-mono" style={{ color: '#2a3a2a' }}>
            {topics.filter(t => t.title.trim()).length} topics · {weeks}w
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); reset(); }}
              className="px-3 py-1.5 rounded-md text-xs font-mono"
              style={{ background: '#111', border: '1px solid #222', color: '#555' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#888'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-md text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#0f1a0f', border: '1px solid #22c55e', color: '#22c55e' }}
              onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.background = '#162a16'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0f1a0f'; }}
            >
              {submitting ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {submitting ? 'Creating…' : 'Create path'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
