import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, ExternalLink, Video, FileText, ChevronLeft, ChevronRight, UploadCloud, Loader2, Plus } from "lucide-react";
import { PageShell, Card, Btn, Badge, StepDot } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/topic/$topicId")({
  head: () => ({ meta: [{ title: `Workspace — GrowthOS` }] }),
  component: TopicWorkspace,
});

type Tab = "notes" | "flash" | "quiz" | "build";

function TopicWorkspace() {
  const { topicId } = useParams({ from: "/topic/$topicId" });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/`);
      if (!res.ok) {
        // If topic doesn't exist in DB, return a stub based on the slug/id
        const titleFromSlug = topicId
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        return {
          topic: { id: topicId, title: titleFromSlug, slug: topicId, summary: '' },
          progress: { status: 'available' },
          materials: [],
          _stub: true,
        };
      }
      return res.json();
    }
  });

  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const [tab, setTab] = useState<Tab>("notes");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoRefs, setVideoRefs] = useState<string[]>([]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (isLoading) return <PageShell><div className="p-8 text-[#999]">Loading workspace...</div></PageShell>;
  if (!data) return <PageShell><div className="p-8 text-[#ef4444]">Error loading topic.</div></PageShell>;

  const { topic, progress, materials } = data;

  // YouTube embed URL logic
  function toEmbedUrl(url: string): string | null {
    try {
      const u = new URL(url);
      let vid = "";
      if (u.hostname.includes("youtu.be")) vid = u.pathname.slice(1);
      else if (u.hostname.includes("youtube.com")) vid = u.searchParams.get("v") || "";
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    } catch { return null; }
  }
  const customEmbed = youtubeUrl ? toEmbedUrl(youtubeUrl) : null;
  const videoQuery = encodeURIComponent(topic.title + " programming tutorial");
  const embedSrc = customEmbed || `https://www.youtube.com/embed?listType=search&list=${videoQuery}`;

  const addVideoRef = () => {
    if (youtubeUrl && !videoRefs.includes(youtubeUrl)) {
      setVideoRefs((prev) => [...prev, youtubeUrl]);
    }
  };

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full">
      {/* Top bar */}
      <div className="shrink-0 bg-[#0a0a0a] border-b border-[#222] px-4 sm:px-6 py-2.5 flex items-center gap-3 z-20">
        <Link to="/roadmap" className="text-[#666] hover:text-[#f0f0f0] p-1"><ArrowLeft size={16} /></Link>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#555]">Topic Workspace</div>
          <div className="text-sm font-semibold tracking-tight truncate text-[#f0f0f0]">{topic.title}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm text-[#22c55e] tabular-nums">{formatTime(seconds)}</div>
          <Btn variant="outline" size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? "Pause" : "Focus"}
          </Btn>
        </div>
      </div>

      {/* Split-screen body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* LEFT PANE — Video + saved videos */}
        <div className="lg:w-1/2 flex flex-col border-r border-[#1a1a1a] bg-[#070707] min-h-0">
          {/* Video embed */}
          <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
            <iframe src={embedSrc} title={topic.title} className="w-full h-full" allowFullScreen />
          </div>
          {/* URL input */}
          <div className="px-4 py-3 border-b border-[#1a1a1a] shrink-0">
            <div className="flex gap-2">
              <input
                type="text" value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="flex-1 bg-[#111] border border-[#222] rounded px-3 py-1.5 text-xs text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#444]"
              />
              <Btn size="sm" variant="outline" onClick={addVideoRef}><Plus size={12} /> Save</Btn>
            </div>
          </div>
          {/* Saved videos + summary */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {videoRefs.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mb-2">
                  <Video size={12} className="inline mr-1" /> Saved Videos ({videoRefs.length})
                </div>
                <ul className="space-y-1.5">
                  {videoRefs.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#999]">
                      <ExternalLink size={10} className="shrink-0 text-[#22c55e]" />
                      <a href={url} target="_blank" rel="noreferrer" className="truncate hover:text-[#f0f0f0] transition-colors">{url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {topic.summary && (
              <div className="border border-[#1a1a1a] rounded-lg p-3">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mb-1">Topic Summary</div>
                <div className="text-sm text-[#999] leading-relaxed">{topic.summary}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE — Tabs: Notes / Flashcards / Quiz / Build */}
        <div className="lg:w-1/2 flex flex-col min-h-0 bg-[#0a0a0a]">
          {/* Tab bar */}
          <div className="flex border-b border-[#222] shrink-0 overflow-x-auto">
            {([
              { id: "notes", label: "📝 Notes" },
              { id: "flash", label: "🃏 Flashcards" },
              { id: "quiz", label: "✅ Quiz" },
              { id: "build", label: "🔨 Build" },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors font-medium " +
                  (tab === t.id
                    ? "border-[#22c55e] text-[#f0f0f0] bg-[#111]"
                    : "border-transparent text-[#666] hover:text-[#f0f0f0] hover:bg-[#0d0d0d]")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {tab === "notes" && <StudyNotesTab topicId={topic.id} />}
            {tab === "flash" && <FlashcardsTab topicId={topic.id} />}
            {tab === "quiz" && <QuizTab topicId={topic.id} />}
            {tab === "build" && <BuildTab topic={topic} materials={materials} progress={progress} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// --- Tab Components ---

function StudyNotesTab({ topicId }: { topicId: number | string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteFile, setNoteFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/notes/`);
      if (!res.ok) return { content: '', documents: [] };
      const json = await res.json();
      setContent(json.content || '');
      return json;
    }
  });

  const { data: noteDocuments = [], refetch: refetchDocs } = useQuery({
    queryKey: ['note-documents', topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/note-documents/`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const saveNote = async (val: string) => {
    setSaving(true);
    await apiFetch(`/topics/${topicId}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ content: val }),
    });
    setSaving(false);
  };

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch(`/topics/${topicId}/note-documents/`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      setNoteFile(null);
      refetchDocs();
    }
  });

  if (isLoading) return <div className="text-[#666] text-sm text-center py-8">Loading notes...</div>;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Text notes editor */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">Markdown Supported</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">{saving ? 'Saving...' : 'Saved'}</div>
        </div>
        <textarea 
          className="flex-1 w-full bg-transparent border border-[#222] rounded-lg p-3 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#444] resize-none"
          placeholder="Type your study notes here..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
          onBlur={() => saveNote(content)}
        />
      </div>

      {/* Document upload zone */}
      <div className="border-t border-[#222] pt-4">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">
          <FileText size={12} className="inline mr-1" /> Upload Documents
        </div>
        <div 
          className="border-2 border-dashed border-[#333] rounded-lg p-4 text-center hover:bg-[#161616] transition-colors cursor-pointer"
          onClick={() => document.getElementById('noteFileUpload')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.length) setNoteFile(e.dataTransfer.files[0]);
          }}
        >
          <input 
            type="file" id="noteFileUpload" className="hidden" 
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => { if (e.target.files?.length) setNoteFile(e.target.files[0]); }}
          />
          <UploadCloud className="w-5 h-5 text-[#666] mx-auto mb-1" />
          <div className="text-xs text-[#999]">{noteFile ? noteFile.name : 'Click or drag files (PDF, DOCX, images)'}</div>
        </div>
        {noteFile && (
          <div className="flex justify-end mt-2">
            <Btn size="sm" onClick={() => uploadDocMutation.mutate(noteFile)} disabled={uploadDocMutation.isPending}>
              {uploadDocMutation.isPending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</> : "Upload Document"}
            </Btn>
          </div>
        )}
      </div>

      {/* Uploaded documents list */}
      {noteDocuments.length > 0 && (
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">
            Saved Documents ({noteDocuments.length})
          </div>
          <ul className="space-y-2">
            {noteDocuments.map((doc: any) => (
              <li key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111]">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="shrink-0 text-[#22c55e]" />
                  <span className="text-sm text-[#ccc] truncate">{doc.filename || doc.file?.split('/').pop() || `Document #${doc.id}`}</span>
                </div>
                <a 
                  href={doc.file_url || doc.file} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-[#22c55e] hover:text-[#4ade80] ml-2 shrink-0"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QuizTab({ topicId }: { topicId: number }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz', topicId, difficulty],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/quiz/?difficulty=${difficulty}&count=5`);
      if (!res.ok) throw new Error("Failed to generate quiz");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleDifficultyChange = (d: "easy" | "medium" | "hard") => {
    setDifficulty(d);
    setAnswers({});
    setSubmitted(false);
  };

  if (isLoading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#666] mb-4" /><div className="text-sm text-[#666] font-mono">AI is generating {difficulty} questions...</div></div>;
  if (isError) return <div className="text-center py-8 text-red-500 text-sm">Failed to generate quiz. <Btn onClick={() => refetch()} size="sm" className="mt-4">Retry</Btn></div>;

  const questions = data?.questions || [];
  let score = 0;
  if (submitted) {
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.answer) score++;
    });
  }

  return (
    <div className="space-y-6">
      {/* Difficulty selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#666] mr-2">Difficulty</span>
        {(["easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            onClick={() => handleDifficultyChange(d)}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider border transition-colors ${
              difficulty === d
                ? d === "easy" ? "border-[#22c55e]/50 bg-[#0d1a0d] text-[#22c55e]"
                : d === "medium" ? "border-[#f59e0b]/50 bg-[#1a1305] text-[#f59e0b]"
                : "border-[#ef4444]/50 bg-[#1a0d0d] text-[#ef4444]"
                : "border-[#222] text-[#666] hover:text-[#f0f0f0] hover:bg-[#161616]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {submitted && (
        <div className={`p-4 rounded-lg border text-center ${score === questions.length ? 'border-[#22c55e]/30 bg-[#0d1a0d]' : 'border-[#f59e0b]/30 bg-[#1a1305]'}`}>
          <div className="text-lg font-semibold text-[#f0f0f0] mb-1">You scored {score} / {questions.length}</div>
          {score === questions.length ? (
            <div className="text-sm text-[#22c55e]">Perfect! You're ready to build.</div>
          ) : (
            <div className="text-sm text-[#f59e0b]">Review your notes and try again.</div>
          )}
          <Btn onClick={() => { setSubmitted(false); setAnswers({}); }} size="sm" className="mt-3" variant="outline">Retake Quiz</Btn>
        </div>
      )}

      {questions.map((q: any, i: number) => (
        <Card key={i} className="p-4 border-[#222]">
          <div className="text-sm font-medium text-[#f0f0f0] mb-3">{i+1}. {q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt: string, j: number) => {
              const isSelected = answers[i] === opt;
              const isCorrect = submitted && opt === q.answer;
              const isWrong = submitted && isSelected && !isCorrect;
              
              let btnClass = "w-full text-left p-3 rounded border text-sm transition-colors ";
              if (isCorrect) btnClass += "border-[#22c55e] bg-[#0d1a0d] text-[#22c55e]";
              else if (isWrong) btnClass += "border-red-500 bg-red-500/10 text-red-500";
              else if (isSelected) btnClass += "border-[#666] bg-[#222] text-[#f0f0f0]";
              else btnClass += "border-[#222] hover:bg-[#161616] text-[#999]";

              return (
                <button 
                  key={j} 
                  className={btnClass}
                  onClick={() => !submitted && setAnswers({...answers, [i]: opt})}
                  disabled={submitted}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      {!submitted && questions.length > 0 && (
        <Btn onClick={() => setSubmitted(true)} className="w-full">Submit Quiz</Btn>
      )}
    </div>
  );
}

function FlashcardsTab({ topicId }: { topicId: number }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['flashcards', topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/flashcards/`);
      if (!res.ok) throw new Error("Failed to generate flashcards");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#666] mb-4" /><div className="text-sm text-[#666] font-mono">Groq AI is writing flashcards...</div></div>;
  if (isError) return <div className="text-center py-8 text-red-500 text-sm">Failed to generate flashcards. <Btn onClick={() => refetch()} size="sm" className="mt-4">Retry</Btn></div>;

  const flashcards = data?.flashcards || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {flashcards.map((f: any, i: number) => {
        const isFlipped = flipped[i];
        return (
          <div 
            key={i} 
            className="perspective-1000 h-48 cursor-pointer group"
            onClick={() => setFlipped({...flipped, [i]: !isFlipped})}
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <Card className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center p-6 border-[#333] hover:border-[#444] bg-[#0f0f0f]">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#666] mb-2">Term</div>
                  <div className="text-lg font-semibold text-[#f0f0f0]">{f.front}</div>
                </div>
              </Card>
              {/* Back */}
              <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 border-[#22c55e]/30 bg-[#0d1a0d]">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#22c55e] mb-2">Definition</div>
                  <div className="text-sm text-[#f0f0f0] leading-relaxed">{f.back}</div>
                </div>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuildTab({ topic, materials, progress }: { topic: any, materials: any[], progress: any }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [buildMode, setBuildMode] = useState<"choose" | "ai" | "own">("choose");
  const [repoUrl, setRepoUrl] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  // AI project ideas query
  const { data: projectIdeas, isLoading: ideasLoading, refetch: refetchIdeas } = useQuery({
    queryKey: ['project-ideas', topic.id],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topic.id}/project-ideas/`);
      if (!res.ok) throw new Error("Failed to generate ideas");
      return res.json();
    },
    enabled: buildMode === "ai",
    refetchOnWindowFocus: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await apiFetch(`/topics/${topic.id}/materials/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      verifyMutation.mutate(data.id);
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (materialId: number) => {
      const res = await apiFetch(`/materials/${materialId}/verify/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Verification failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', String(topic.id)] });
      queryClient.invalidateQueries({ queryKey: ['heatmap'] });
      queryClient.invalidateQueries({ queryKey: ['paths'] });
    }
  });

  const scanRepoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiFetch(`/topics/${topic.id}/scan-repo/`, {
        method: "POST",
        body: JSON.stringify({ repo_url: url }),
      });
      if (!res.ok) throw new Error("Scan failed");
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      if (data.passed) {
        queryClient.invalidateQueries({ queryKey: ['topic', String(topic.id)] });
        queryClient.invalidateQueries({ queryKey: ['paths'] });
      }
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) uploadMutation.mutate(file);
  };

  // Already completed
  if (progress?.status === 'completed') {
    return (
      <div className="border border-[#22c55e]/30 bg-[#0d1a0d] rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-[#22c55e]/20 text-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-3">✓</div>
        <h3 className="text-lg font-semibold text-[#f0f0f0]">Topic Verified</h3>
        <p className="text-sm text-[#22c55e] mt-1">Your proof of work has been accepted by the AI.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      {buildMode === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setBuildMode("ai")}
            className="p-6 rounded-xl border border-[#222] bg-[#0f0f0f] hover:border-[#22c55e]/40 hover:bg-[#0d1a0d] transition-colors text-left group"
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#22c55e] mb-2">Option 1</div>
            <div className="text-base font-semibold text-[#f0f0f0] mb-1">AI-Generated Projects</div>
            <div className="text-xs text-[#666]">Get project ideas tailored to this topic. Pick one and build it.</div>
          </button>
          <button
            onClick={() => setBuildMode("own")}
            className="p-6 rounded-xl border border-[#222] bg-[#0f0f0f] hover:border-[#f59e0b]/40 hover:bg-[#1a1305] transition-colors text-left group"
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#f59e0b] mb-2">Option 2</div>
            <div className="text-base font-semibold text-[#f0f0f0] mb-1">Your Own Project</div>
            <div className="text-xs text-[#666]">Paste your GitHub repo link. AI will scan and evaluate it.</div>
          </button>
        </div>
      )}

      {/* AI project ideas */}
      {buildMode === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setBuildMode("choose")} className="text-xs text-[#666] hover:text-[#f0f0f0]">← Back</button>
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#22c55e]">AI Project Ideas</div>
          </div>
          {ideasLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#666] mb-2" /><div className="text-xs text-[#666] font-mono">Generating ideas...</div></div>
          ) : (
            <div className="space-y-3">
              {(projectIdeas?.ideas || []).map((idea: any, i: number) => (
                <Card key={i} className="p-4 border-[#222] hover:border-[#333] transition-colors">
                  <div className="text-sm font-semibold text-[#f0f0f0] mb-1">{idea.title || `Project ${i+1}`}</div>
                  <div className="text-xs text-[#999] leading-relaxed">{idea.description || idea}</div>
                </Card>
              ))}
              <Btn variant="outline" size="sm" onClick={() => refetchIdeas()}>Regenerate Ideas</Btn>
            </div>
          )}
          
          {/* Upload proof for AI project */}
          <div className="border-t border-[#222] pt-4">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Upload your proof of work</div>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#333] rounded-xl p-6 text-center hover:bg-[#161616] transition-colors cursor-pointer"
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              <input type="file" id="fileUpload" className="hidden" accept=".pdf,.docx" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]); }} />
              <UploadCloud className="w-6 h-6 text-[#666] mx-auto mb-2" />
              <div className="text-sm text-[#f0f0f0]">{file ? file.name : 'Click or drag PDF here'}</div>
            </div>
            {file && (
              <div className="flex justify-end mt-3">
                <Btn onClick={handleUpload} disabled={uploadMutation.isPending || verifyMutation.isPending}>
                  {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 
                   verifyMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 
                   "Submit for AI Verification"}
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Own project - GitHub URL */}
      {buildMode === "own" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setBuildMode("choose")} className="text-xs text-[#666] hover:text-[#f0f0f0]">← Back</button>
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#f59e0b]">Your Project</div>
          </div>
          <Card className="p-4 bg-[#0f0f0f] border-[#222]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">GitHub Repository</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="flex-1 bg-[#111] border border-[#222] rounded px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:outline-none focus:border-[#444]"
              />
              <Btn 
                onClick={() => scanRepoMutation.mutate(repoUrl)} 
                disabled={!repoUrl || scanRepoMutation.isPending}
              >
                {scanRepoMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Scan Repo"}
              </Btn>
            </div>
          </Card>

          {scanResult && (
            <Card className={`p-4 border ${scanResult.passed ? 'border-[#22c55e]/30 bg-[#0d1a0d]' : 'border-[#ef4444]/30 bg-[#1a0d0d]'}`}>
              <div className="text-sm font-semibold mb-2 text-[#f0f0f0]">
                {scanResult.passed ? '✓ Project Approved' : '✗ Needs Improvement'}
              </div>
              <div className="text-xs text-[#999] whitespace-pre-wrap">{scanResult.feedback}</div>
            </Card>
          )}
        </div>
      )}

      {/* Previous submissions */}
      {materials && materials.length > 0 && (
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Previous Submissions</div>
          <ul className="space-y-3">
            {materials.slice().reverse().map((m: any) => (
              <li key={m.id} className="border border-[#222] rounded-lg p-4 bg-[#111]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-[#ccc] font-mono truncate mr-4">Submission #{m.id}</span>
                  <Badge tone={m.ai_status === 'verified' ? 'green' : m.ai_status === 'rejected' ? 'red' : 'amber'}>
                    {m.ai_status}
                  </Badge>
                </div>
                {m.ai_feedback && (
                  <div className="text-sm text-[#999] bg-[#0a0a0a] p-3 rounded border border-[#222] whitespace-pre-wrap">
                    {m.ai_feedback}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}