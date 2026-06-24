import React, { useState, useEffect } from "react";
import { Plus, X, Edit2, ArrowUp, ArrowDown, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { apiClient } from "../../lib/api-client";

interface Topic {
  id?: number | string;
  title: string;
  summary?: string;
  order: number;
  dependencies?: number[];
  node_kind?: string;
}

interface PathBuilderProps {
  existingPath?: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomPathBuilder({
  existingPath,
  onSuccess,
  trigger,
  open,
  onOpenChange,
}: PathBuilderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const [pathTitle, setPathTitle] = useState("");
  const [pathSlug, setPathSlug] = useState("");
  const [pathDescription, setPathDescription] = useState("");
  const [estimatedWeeks, setEstimatedWeeks] = useState(12);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = !!existingPath;

  useEffect(() => {
    if (isOpen) {
      if (existingPath) {
        setPathTitle(existingPath.title || "");
        setPathSlug(existingPath.slug || "");
        setPathDescription(existingPath.description || "");
        setEstimatedWeeks(existingPath.estimated_weeks || 12);
        setTopics(existingPath.topics || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingPath]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 255);
  };

  const handleTitleChange = (title: string) => {
    setPathTitle(title);
    if (!isEditing) {
      setPathSlug(generateSlug(title));
    }
  };

  const addTopic = () => {
    const newTopic: Topic = {
      title: `Topic ${topics.length + 1}`,
      summary: "",
      order: topics.length,
      dependencies: [],
      node_kind: "topic",
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (index: number, updates: Partial<Topic>) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], ...updates };
    setTopics(updated);
  };

  const removeTopic = (index: number) => {
    const updated = topics.filter((_, i) => i !== index);
    updated.forEach((t, i) => (t.order = i));
    setTopics(updated);
  };

  const moveTopicUp = (index: number) => {
    if (index === 0) return;
    const updated = [...topics];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updated.forEach((t, i) => (t.order = i));
    setTopics(updated);
  };

  const moveTopicDown = (index: number) => {
    if (index === topics.length - 1) return;
    const updated = [...topics];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updated.forEach((t, i) => (t.order = i));
    setTopics(updated);
  };

  const insertTopicBelow = (index: number) => {
    const newTopic: Topic = {
      title: `Topic ${topics.length + 2}`,
      summary: "",
      order: 0,
      dependencies: [],
      node_kind: "topic",
    };
    const updated = [...topics];
    updated.splice(index + 1, 0, newTopic);
    updated.forEach((t, i) => (t.order = i));
    setTopics(updated);
  };

  const handleSavePath = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!pathTitle.trim()) {
        setError("Path title is required");
        return;
      }

      if (topics.length === 0) {
        setError("At least one topic is required");
        return;
      }

      const validTopics = topics
        .map((topic, index) => ({
          ...topic,
          title: topic.title.trim(),
          summary: topic.summary || "",
          order: index,
        }))
        .filter((topic) => topic.title);

      if (validTopics.length === 0) {
        setError("At least one named topic is required");
        return;
      }

      const payload = {
        title: pathTitle.trim(),
        description: pathDescription,
        estimated_weeks: estimatedWeeks,
        topics: validTopics,
      };

      if (isEditing) {
        await apiClient.patch(`/api/custom-paths/${existingPath.slug}/`, payload);
        setSuccess("Custom path updated successfully!");
      } else {
        await apiClient.post("/api/custom-paths/", {
          ...payload,
          slug: pathSlug || generateSlug(pathTitle),
        });
        setSuccess("Custom path created successfully!");
      }

      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleOpenChange(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${isEditing ? "update" : "create"} path`,
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPathTitle("");
    setPathSlug("");
    setPathDescription("");
    setEstimatedWeeks(12);
    setTopics([]);
    setError("");
    setSuccess("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" className="flex items-center gap-2">
            {isEditing ? <Edit2 size={16} /> : <Plus size={16} />}
            {isEditing ? "Edit Path" : "Create Custom Path"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-[#222] text-[#f0f0f0]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Custom Path" : "Create a Custom Learning Path"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing
              ? "Modify your learning roadmap and topics"
              : "Build your own learning roadmap with custom topics and sequence"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-900 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950 border-green-900">
              <AlertDescription className="text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          {/* Path Info Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Path Title</label>
              <Input
                placeholder="e.g., Full Stack Development"
                value={pathTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-[#111] border-[#666] text-[#eee]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Path Slug</label>
              <Input
                placeholder="auto-generated"
                value={pathSlug}
                onChange={(e) => setPathSlug(e.target.value)}
                disabled
                className="bg-[#050505] border-[#222] text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-[#666] bg-[#111] text-[#eee] rounded-md text-sm"
                placeholder="Describe what learners will achieve"
                value={pathDescription}
                onChange={(e) => setPathDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Estimated Duration (weeks)
              </label>
              <Input
                type="number"
                min="1"
                max="52"
                value={estimatedWeeks}
                onChange={(e) => setEstimatedWeeks(parseInt(e.target.value))}
                className="bg-[#111] border-[#666] text-[#eee]"
              />
            </div>
          </div>

          {/* Topics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-200">Topics ({topics.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="flex items-center gap-1 border-[#666] hover:bg-[#222]"
              >
                <Plus size={14} />
                Add Topic
              </Button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {topics.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No topics added yet. Click "Add Topic" to start.
                </p>
              ) : (
                topics.map((topic, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="p-3 border border-[#222] rounded-lg bg-[#0f0f0f] flex gap-3">
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-1 border-r border-[#222] pr-3 py-1">
                        <button
                          type="button"
                          onClick={() => moveTopicUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-[#222] rounded text-gray-400 disabled:opacity-30 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() => moveTopicDown(index)}
                          disabled={index === topics.length - 1}
                          className="p-1 hover:bg-[#222] rounded text-gray-400 disabled:opacity-30 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Topic title"
                              value={topic.title}
                              onChange={(e) => updateTopic(index, { title: e.target.value })}
                              className="text-sm bg-[#1a1a1a] border-[#666] text-[#eee]"
                            />
                            <textarea
                              placeholder="Topic summary (optional)"
                              value={topic.summary || ""}
                              onChange={(e) => updateTopic(index, { summary: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-[#666] bg-[#1a1a1a] text-[#eee] rounded"
                              rows={2}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTopic(index)}
                            className="p-1 hover:bg-red-950/50 rounded text-red-500 ml-2"
                            title="Delete Topic"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Insert Below Button */}
                    <div className="flex justify-center -my-1 relative z-10 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => insertTopicBelow(index)}
                        className="bg-[#1a1a1a] border border-[#666] rounded-full p-1 text-green-500 hover:bg-[#222] hover:scale-110 transition-all shadow-lg"
                        title="Insert Topic Here"
                      >
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-[#222]">
            <Button
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                resetForm();
              }}
              className="border-[#666] hover:bg-[#222]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePath}
              disabled={loading || !pathTitle.trim() || topics.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Path"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
