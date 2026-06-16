import React, { useState, useEffect } from 'react';
import { Copy, Share2, Trash2, Edit, ChevronRight, Eye } from 'lucide-react';
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
import { PathSharingDialog } from './PathSharingDialog';
import { useNavigate } from '@tanstack/react-router';

interface LearningPath {
  id: number;
  title: string;
  slug: string;
  description: string;
  is_custom: boolean;
  created_by: number;
  created_by_username: string;
  visibility: 'private' | 'public' | 'shared';
  estimated_weeks: number;
  can_edit: boolean;
  topics: Array<{ id: number; title: string }>;
}

interface CustomPathListProps {
  onPathCloned?: (path: LearningPath) => void;
}

export function CustomPathList({ onPathCloned }: CustomPathListProps) {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedPathForClone, setSelectedPathForClone] =
    useState<LearningPath | null>(null);
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneSlug, setCloneSlug] = useState('');
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    loadCustomPaths();
  }, []);

  const loadCustomPaths = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/custom-paths/my_paths/');
      setPaths(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load paths');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleClonePath = async () => {
    if (!selectedPathForClone || !cloneTitle.trim()) {
      return;
    }

    try {
      setCloning(true);
      setError('');

      const response = await apiClient.post(
        `/api/custom-paths/${selectedPathForClone.slug}/clone/`,
        {
          new_title: cloneTitle,
          new_slug: cloneSlug,
        }
      );

      setPaths([...paths, response.data]);
      setCloneDialogOpen(false);
      setSelectedPathForClone(null);
      setCloneTitle('');
      setCloneSlug('');

      if (onPathCloned) {
        onPathCloned(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone path');
    } finally {
      setCloning(false);
    }
  };

  const handleDeletePath = async (pathSlug: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this path? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/custom-paths/${pathSlug}/`);
      setPaths(paths.filter((p) => p.slug !== pathSlug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete path');
    }
  };

  const handleViewPath = (pathSlug: string) => {
    navigate({ to: `/roadmap?pathSlug=${pathSlug}` });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading paths...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paths.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No custom paths yet.</p>
          <p className="text-sm">Create your first custom learning path!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paths.map((path) => (
            <div
              key={path.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {path.title}
                    {path.visibility === 'public' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                    {path.visibility === 'shared' && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Shared
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{path.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{path.topics.length} topics</span>
                    <span>{path.estimated_weeks} weeks</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {/* Clone Dialog */}
                  <Dialog
                    open={
                      cloneDialogOpen && selectedPathForClone?.id === path.id
                    }
                    onOpenChange={(open) => {
                      if (open) {
                        setSelectedPathForClone(path);
                        setCloneTitle(`${path.title} (Copy)`);
                        setCloneSlug(generateSlug(`${path.title} (Copy)`));
                      }
                      setCloneDialogOpen(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Copy size={14} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clone Path</DialogTitle>
                        <DialogDescription>
                          Create a copy of "{path.title}" with all its topics
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            New Path Title
                          </label>
                          <Input
                            value={cloneTitle}
                            onChange={(e) => {
                              setCloneTitle(e.target.value);
                              setCloneSlug(generateSlug(e.target.value));
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            Slug
                          </label>
                          <Input
                            value={cloneSlug}
                            onChange={(e) => setCloneSlug(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setCloneDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleClonePath}
                            disabled={cloning || !cloneTitle.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {cloning ? 'Cloning...' : 'Clone Path'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Share Button */}
                  <PathSharingDialog
                    pathSlug={path.slug}
                    pathTitle={path.title}
                    isCreator={path.can_edit}
                    currentVisibility={path.visibility}
                  />

                  {/* View Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleViewPath(path.slug)}
                  >
                    <Eye size={14} />
                  </Button>

                  {/* Delete Button */}
                  {path.can_edit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeletePath(path.slug)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

