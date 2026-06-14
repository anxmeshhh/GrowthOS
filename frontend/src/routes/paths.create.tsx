import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { PageShell, PageHeader, Card, Btn } from '@/components/growth-ui';
import { Plus, Trash2, ArrowRight, ArrowUp, ArrowDown, Sparkles, Settings2, Loader2, AlignLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { InteractiveRoadmap } from '@/components/roadmap/InteractiveRoadmap';

export const Route = createFileRoute('/paths/create')({
  component: CustomPathBuilder,
});

type TopicDraft = {
  id: number; // temp id for UI
  title: string;
  summary: string;
  dependencies: number[]; // array of temp ids
  bgColor?: string;
};

type SubtopicDraft = {
  id: number;
  title: string;
};

type ModuleDraft = {
  id: number;
  title: string;
  subtopics: SubtopicDraft[];
  dependencies: number[];
};

function CustomPathBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [modules, setModules] = useState<ModuleDraft[]>([
    { id: 0, title: 'Introduction', subtopics: [], dependencies: [] }
  ]);
  const [nextId, setNextId] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  
  const [isTextMode, setIsTextMode] = useState(false);
  const [textOutline, setTextOutline] = useState('Backend Basics\n- Node.js\n- Python\nDatabases\n- SQL\n- MongoDB');

  // Parse Text Outline to Topics
  useEffect(() => {
    if (!isTextMode) return;
    
    const lines = textOutline.split('\n').filter(l => l.trim().length > 0);
    const newModules: ModuleDraft[] = [];
    
    lines.forEach((line, index) => {
      const isSubtopic = line.trim().startsWith('-') || line.trim().startsWith('*');
      let cleanLine = line.trim().replace(/^[-*]\s*/, '');
      
      const parts = cleanLine.split(':');
      const topicTitle = parts[0].trim();
      const tId = nextId + index;

      if (isSubtopic) {
        if (newModules.length > 0) {
          newModules[newModules.length - 1].subtopics.push({ id: tId, title: topicTitle });
        }
      } else {
        newModules.push({
          id: tId,
          title: topicTitle,
          subtopics: [],
          dependencies: []
        });
      }
    });
    
    setModules(newModules.length > 0 ? newModules : [{ id: 0, title: 'Introduction', subtopics: [], dependencies: [] }]);
  }, [textOutline, isTextMode]);

  // Flatten modules to topics for Preview and API
  const flattenedTopics = useMemo(() => {
    const flat: TopicDraft[] = [];
    let previousMainId: number | null = null;
    let previousMainLeaves: number[] = [];

    modules.forEach((mod) => {
      let deps = mod.dependencies.length > 0 
        ? mod.dependencies 
        : (previousMainId !== null 
            ? (previousMainLeaves.length > 0 ? [...previousMainLeaves] : [previousMainId])
            : []);
      
      const subtopicsText = mod.subtopics.map(s => `- ${s.title}`).join('\n');

      flat.push({
        id: mod.id,
        title: mod.title,
        summary: subtopicsText,
        dependencies: deps,
        bgColor: '#ffee55' // Main Topics look like yellow milestones
      });
      
      const leaves: number[] = [];
      mod.subtopics.forEach(sub => {
        flat.push({
          id: sub.id,
          title: sub.title,
          summary: `Subtopic of ${mod.title}. Explore ${sub.title} in detail.`,
          dependencies: [mod.id],
          bgColor: undefined // Subtopics look like normal green topics
        });
        leaves.push(sub.id);
      });
      
      previousMainId = mod.id;
      previousMainLeaves = leaves;
    });
    
    return flat;
  }, [modules]);

  const addModule = () => {
    setModules([...modules, { id: nextId, title: '', subtopics: [], dependencies: [] }]);
    setNextId(nextId + 1);
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;
    
    const newModules = [...modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setModules(newModules);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch('/paths/generate/', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      
      setTitle(data.title || prompt);
      if (data.topics && Array.isArray(data.topics)) {
        const newModules = data.topics.map((t: any, idx: number) => {
          const tId = nextId + idx * 10;
          let subtopics: SubtopicDraft[] = [];
          
          if (typeof t === 'object') {
            if (Array.isArray(t.subtopics)) {
               subtopics = t.subtopics.map((sTitle: string, sIdx: number) => ({ id: tId + 1 + sIdx, title: sTitle }));
            }
          }
          
          return {
            id: tId,
            title: typeof t === 'string' ? t : (t.title || ''),
            subtopics,
            dependencies: []
          };
        });
        setModules(newModules);
        setNextId(nextId + data.topics.length * 10);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateModule = (id: number, value: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, title: value } : m));
  };

  const removeModule = (id: number) => {
    setModules(modules.filter(m => m.id !== id).map(m => ({
      ...m,
      dependencies: m.dependencies.filter(dep => dep !== id)
    })));
  };

  const addSubtopic = (moduleId: number) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, subtopics: [...m.subtopics, { id: nextId, title: '' }] } : m));
    setNextId(nextId + 1);
  };

  const updateSubtopic = (moduleId: number, subId: number, value: string) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m,
      subtopics: m.subtopics.map(s => s.id === subId ? { ...s, title: value } : s)
    } : m));
  };

  const removeSubtopic = (moduleId: number, subId: number) => {
    setModules(modules.map(m => m.id === moduleId ? {
      ...m,
      subtopics: m.subtopics.filter(s => s.id !== subId)
    } : m));
  };

  const toggleDependency = (moduleId: number, depId: number) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        const newDeps = m.dependencies.includes(depId) 
          ? m.dependencies.filter(d => d !== depId)
          : [...m.dependencies, depId];
        return { ...m, dependencies: newDeps };
      }
      return m;
    }));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Map temp IDs to index positions for the backend
      const payloadTopics = flattenedTopics.map((t) => {
        const depIndexes = t.dependencies.map(depId => 
          flattenedTopics.findIndex(top => top.id === depId)
        ).filter(idx => idx !== -1);
        return { title: t.title, summary: t.summary, dependencies: depIndexes };
      });

      const res = await apiFetch('/paths/custom/', {
        method: 'POST',
        body: JSON.stringify({ title, topics: payloadTopics }),
      });
      if (!res.ok) throw new Error('Failed to create path');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paths'] });
      navigate({ to: '/roadmap', search: { pathId: data.id } });
    }
  });

  // Prepare topics for the InteractiveRoadmap preview
  const previewTopics = flattenedTopics.map(t => ({
    id: t.id,
    title: t.title || 'Untitled',
    dependencies: t.dependencies,
    bgColor: t.bgColor,
    user_progress: 'available'
  }));

  const isValid = title.trim().length > 0 && modules.every(m => m.title.trim().length > 0) && modules.length > 0;

  return (
    <PageShell>
      <PageHeader 
        kicker="Builder" 
        title="Create Custom Roadmap" 
        subtitle="Define topics and their dependencies to automatically generate a flowchart." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
        {/* Left: Form */}
        <div className="flex flex-col h-full bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
          
          {/* AI Generator Block */}
          <div className="p-4 border-b border-[#222] bg-[#0d140d]">
            <label className="block text-[10px] uppercase tracking-wider text-[#22c55e] font-mono mb-2 flex items-center gap-2">
              <Sparkles size={12} /> Auto-Generate with AI
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                placeholder="e.g. Learn Rust for Web Development"
                className="flex-1 bg-black/50 border border-[#22c55e]/30 rounded px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e]"
                onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
              />
              <Btn 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="shrink-0"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
              </Btn>
            </div>
          </div>

          <div className="p-4 border-b border-[#222] bg-[#111] flex justify-between items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-wider text-[#666] font-mono mb-1">Path Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Fullstack Developer 2026"
                className="w-full bg-transparent border border-[#333] rounded px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e]"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsTextMode(!isTextMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono transition-colors border ${isTextMode ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]' : 'bg-transparent border-[#333] text-[#666] hover:text-[#f0f0f0]'}`}
              >
                <AlignLeft size={14} /> {isTextMode ? 'Text Mode: ON' : 'Text Mode'}
              </button>
              <button 
                onClick={() => setIsAdvanced(!isAdvanced)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono transition-colors border ${isAdvanced ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' : 'bg-transparent border-[#333] text-[#666] hover:text-[#f0f0f0]'}`}
              >
                <Settings2 size={14} /> {isAdvanced ? 'Advanced: ON' : 'Advanced'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isTextMode ? (
              <div className="h-full flex flex-col">
                <p className="text-xs text-[#999] mb-3 leading-relaxed">
                  Type your roadmap hierarchy. Use <code className="text-[#22c55e]">Main Topic: Summary</code> and start subtopics with a dash <code className="text-[#22c55e]">- Subtopic: Summary</code>.
                </p>
                <textarea
                  value={textOutline}
                  onChange={(e) => setTextOutline(e.target.value)}
                  className="flex-1 w-full bg-[#111] border border-[#333] rounded-lg p-4 font-mono text-sm text-[#f0f0f0] focus:outline-none focus:border-[#3b82f6] resize-none"
                  placeholder="Backend Basics&#10;- Node.js&#10;- Python&#10;Databases&#10;- SQL&#10;- MongoDB"
                />
              </div>
            ) : (
              <>
                {modules.map((mod, index) => (
                  <Card key={mod.id} className="p-4 bg-[#111] border-[#333]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1 mt-5 mr-3">
                        <button onClick={() => moveModule(index, 'up')} disabled={index === 0} className="text-[#666] hover:text-[#f0f0f0] disabled:opacity-30 disabled:cursor-not-allowed">
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => moveModule(index, 'down')} disabled={index === modules.length - 1} className="text-[#666] hover:text-[#f0f0f0] disabled:opacity-30 disabled:cursor-not-allowed">
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="flex-1 mr-4">
                        <label className="block text-[10px] uppercase text-[#666] mb-1">Main Topic {index + 1}</label>
                        <input 
                          type="text"
                          value={mod.title}
                          onChange={e => updateModule(mod.id, e.target.value)}
                          placeholder="e.g. Backend Basics"
                          className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-1.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e] mb-2"
                        />
                        
                        <div className="space-y-2 pl-4 border-l border-[#333] mt-3">
                          <label className="block text-[10px] uppercase text-[#666] mb-1">Subtopics</label>
                          {mod.subtopics.map((sub, sIdx) => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <span className="text-[#444] font-mono text-xs">-</span>
                              <input 
                                type="text"
                                value={sub.title}
                                onChange={e => updateSubtopic(mod.id, sub.id, e.target.value)}
                                placeholder="e.g. Node.js"
                                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-1 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e]"
                              />
                              <button onClick={() => removeSubtopic(mod.id, sub.id)} className="text-[#666] hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addSubtopic(mod.id)} className="text-xs text-[#999] hover:text-[#f0f0f0] flex items-center gap-1 mt-1 px-2 py-1 bg-[#1a1a1a] rounded">
                            <Plus size={12} /> Add Subtopic
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeModule(mod.id)} className="text-[#666] hover:text-red-500 mt-5">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Dependencies Selection (Advanced Mode Only) */}
                    {isAdvanced && modules.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-[#222]">
                        <label className="block text-[10px] uppercase text-[#666] mb-2">Depends on (Requires)</label>
                        <div className="flex flex-wrap gap-2">
                          {modules.filter(m => m.id !== mod.id).map(possibleDep => {
                            const isDep = mod.dependencies.includes(possibleDep.id);
                            return (
                              <button
                                key={possibleDep.id}
                                onClick={() => toggleDependency(mod.id, possibleDep.id)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                  isDep ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]' : 'bg-[#0a0a0a] border-[#333] text-[#999] hover:border-[#666]'
                                }`}
                              >
                                {possibleDep.title || `Topic ${modules.findIndex(m => m.id === possibleDep.id) + 1}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                
                <Btn variant="outline" onClick={addModule} className="w-full justify-center border-dashed border-[#444] text-[#999] hover:text-[#f0f0f0] hover:border-[#666]">
                  <Plus size={16} className="mr-2" /> Add Main Topic
                </Btn>
              </>
            )}
          </div>

          <div className="p-4 border-t border-[#222] bg-[#111]">
            <Btn 
              className="w-full justify-center" 
              onClick={() => createMutation.mutate()} 
              disabled={!isValid || createMutation.isPending}
            >
              {createMutation.isPending ? 'Generating Flowchart...' : 'Save & Build Roadmap'} <ArrowRight size={16} className="ml-2" />
            </Btn>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="h-full bg-[#111] border border-[#333] rounded-xl overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-[#000]/80 backdrop-blur border border-[#333] px-3 py-1.5 rounded-full text-xs font-mono text-[#f0f0f0] flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] inline-block animate-pulse"></span>
            Live Auto-Layout Preview
          </div>
          {flattenedTopics.length > 0 ? (
            <InteractiveRoadmap topics={previewTopics} />
          ) : (
            <div className="flex items-center justify-center h-full text-[#666] font-mono text-sm">Add topics to see preview</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
