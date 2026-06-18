import React, { useState } from 'react';
import { Plus, X, Copy, Share2, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { apiClient } from '../../lib/api-client';

interface Topic {
  id?: number;
  title: string;
  summary?: string;
  order: number;
  dependencies?: number[];
}

export function CustomPathBuilder() {
  const [isOpen, setIsOpen] = useState(false);
  const [pathTitle, setPathTitle] = useState('');
  const [pathSlug, setPathSlug] = useState('');
  const [pathDescription, setPathDescription] = useState('');
  const [estimatedWeeks, setEstimatedWeeks] = useState(12);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setPathTitle(title);
    setPathSlug(generateSlug(title));
  };

  const addTopic = () => {
    const newTopic: Topic = {
      title: `Topic ${topics.length + 1}`,
      summary: '',
      order: topics.length,
      dependencies: [],
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (index: number, updates: Partial<Topic>) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], ...updates };
    setTopics(updated);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleCreatePath = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!pathTitle.trim()) {
        setError('Path title is required');
        return;
      }

      if (topics.length === 0) {
        setError('At least one topic is required');
        return;
      }

      const payload = {
        title: pathTitle,
        slug: pathSlug,
        description: pathDescription,
        estimated_weeks: estimatedWeeks,
      };

      const response = await apiClient.post('/api/custom-paths/', payload);

      // Create topics for the path
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        // Topic creation endpoint would be added here
      }

      setSuccess('Custom path created successfully!');
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create path');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPathTitle('');
    setPathSlug('');
    setPathDescription('');
    setEstimatedWeeks(12);
    setTopics([]);
    setError('');
    setSuccess('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Create Custom Path
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Custom Learning Path</DialogTitle>
          <DialogDescription>
            Build your own learning roadmap with custom topics and sequence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Path Info Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-lg font-medium">Path Title</label>
              <Input
                placeholder="e.g., Full Stack Development"
                value={pathTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium">Path Slug</label>
              <Input
                placeholder="auto-generated"
                value={pathSlug}
                onChange={(e) => setPathSlug(e.target.value)}
                disabled
                className="bg-gray-50"
              />
              <p className="text-lg text-gray-500">Auto-generated from title</p>
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-lg"
                placeholder="Describe what learners will achieve"
                value={pathDescription}
                onChange={(e) => setPathDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium">Estimated Duration (weeks)</label>
              <Input
                type="number"
                min="1"
                max="52"
                value={estimatedWeeks}
                onChange={(e) => setEstimatedWeeks(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Topics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Topics ({topics.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="flex items-center gap-1"
              >
                <Plus size={14} />
                Add Topic
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {topics.length === 0 ? (
                <p className="text-lg text-gray-500 py-4 text-center">
                  No topics added yet. Click "Add Topic" to start.
                </p>
              ) : (
                topics.map((topic, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-gray-50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Topic title"
                          value={topic.title}
                          onChange={(e) =>
                            updateTopic(index, { title: e.target.value })
                          }
                          className="text-lg"
                        />
                        <textarea
                          placeholder="Topic summary (optional)"
                          value={topic.summary || ''}
                          onChange={(e) =>
                            updateTopic(index, { summary: e.target.value })
                          }
                          className="w-full px-2 py-1 text-lg border rounded"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={() => removeTopic(index)}
                        className="p-1 hover:bg-red-50 rounded text-red-600 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePath}
              disabled={loading || !pathTitle.trim() || topics.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Path'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
