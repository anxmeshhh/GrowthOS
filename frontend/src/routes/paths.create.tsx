import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { PageShell, PageHeader, Card, Btn } from '@/components/growth-ui';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { InteractiveRoadmap } from '@/components/roadmap/InteractiveRoadmap';

export const Route = createFileRoute('/paths/create')({
  component: CustomPathBuilder,
});

type TopicDraft = {
  id: number; // temp id for UI
  title: string;
  dependencies: number[]; // array of temp ids
};

function CustomPathBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState<TopicDraft[]>([
    { id: 0, title: 'Introduction', dependencies: [] }
  ]);
  const [nextId, setNextId] = useState(1);

  const addTopic = () => {
    setTopics([...topics, { id: nextId, title: '', dependencies: [] }]);
    setNextId(nextId + 1);
  };

  const updateTopic = (id: number, field: keyof TopicDraft, value: any) => {
    setTopics(topics.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTopic = (id: number) => {
    setTopics(topics.filter(t => t.id !== id).map(t => ({
      ...t,
      dependencies: t.dependencies.filter(dep => dep !== id)
    })));
  };

  const toggleDependency = (topicId: number, depId: number) => {
    setTopics(topics.map(t => {
      if (t.id === topicId) {
        const newDeps = t.dependencies.includes(depId) 
          ? t.dependencies.filter(d => d !== depId)
          : [...t.dependencies, depId];
        return { ...t, dependencies: newDeps };
      }
      return t;
    }));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Map temp IDs to index positions for the backend
      const payloadTopics = topics.map((t) => {
        const depIndexes = t.dependencies.map(depId => 
          topics.findIndex(top => top.id === depId)
        ).filter(idx => idx !== -1);
        return { title: t.title, dependencies: depIndexes };
      });

      const res = await apiFetch('/paths/custom/', {
        method: 'POST',
        body: JSON.stringify({ title, topics: payloadTopics }),
      });
      if (!res.ok) throw new Error('Failed to create path');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paths'] });
      navigate({ to: '/roadmap' });
    }
  });

  // Prepare topics for the InteractiveRoadmap preview
  const previewTopics = topics.map(t => ({
    id: t.id,
    title: t.title || 'Untitled',
    dependencies: t.dependencies,
    user_progress: 'available'
  }));

  const isValid = title.trim().length > 0 && topics.every(t => t.title.trim().length > 0) && topics.length > 0;

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
          <div className="p-4 border-b border-[#222] bg-[#111]">
            <label className="block text-xs uppercase tracking-wider text-[#666] font-mono mb-1">Path Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Fullstack Developer 2026"
              className="w-full bg-transparent border border-[#333] rounded px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e]"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {topics.map((topic, index) => (
              <Card key={topic.id} className="p-4 bg-[#111] border-[#333]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <label className="block text-[10px] uppercase text-[#666] mb-1">Topic {index + 1} Name</label>
                    <input 
                      type="text"
                      value={topic.title}
                      onChange={e => updateTopic(topic.id, 'title', e.target.value)}
                      placeholder="e.g. Learn HTML"
                      className="w-full bg-[#0a0a0a] border border-[#222] rounded px-3 py-1.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                  <button onClick={() => removeTopic(topic.id)} className="text-[#666] hover:text-red-500 mt-5">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Dependencies Selection */}
                {topics.length > 1 && (
                  <div>
                    <label className="block text-[10px] uppercase text-[#666] mb-2">Depends on (Requires)</label>
                    <div className="flex flex-wrap gap-2">
                      {topics.filter(t => t.id !== topic.id).map(possibleDep => {
                        const isDep = topic.dependencies.includes(possibleDep.id);
                        return (
                          <button
                            key={possibleDep.id}
                            onClick={() => toggleDependency(topic.id, possibleDep.id)}
                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                              isDep ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]' : 'bg-[#0a0a0a] border-[#333] text-[#999] hover:border-[#666]'
                            }`}
                          >
                            {possibleDep.title || `Topic ${topics.findIndex(t => t.id === possibleDep.id) + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
            
            <Btn variant="outline" onClick={addTopic} className="w-full justify-center border-dashed border-[#444] text-[#999] hover:text-[#f0f0f0] hover:border-[#666]">
              <Plus size={16} className="mr-2" /> Add Topic
            </Btn>
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
          {topics.length > 0 ? (
            <InteractiveRoadmap topics={previewTopics} />
          ) : (
            <div className="flex items-center justify-center h-full text-[#666] font-mono text-sm">Add topics to see preview</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
