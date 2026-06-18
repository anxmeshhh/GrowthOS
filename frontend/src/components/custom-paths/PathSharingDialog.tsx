import React, { useState, useEffect } from 'react';
import { Share2, Users, Lock, Globe, Copy, Trash2 } from 'lucide-react';
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

interface PathSharingProps {
  pathSlug: string;
  pathTitle: string;
  isCreator: boolean;
  currentVisibility: 'private' | 'public' | 'shared';
}

interface SharedUser {
  id: number;
  shared_to_username: string;
  permission: 'view' | 'edit' | 'admin';
}

export function PathSharingDialog({
  pathSlug,
  pathTitle,
  isCreator,
  currentVisibility,
}: PathSharingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>(
    currentVisibility
  );
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [shareUsername, setShareUsername] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && isCreator) {
      loadSharedUsers();
    }
  }, [isOpen, isCreator]);

  const loadSharedUsers = async () => {
    try {
      const response = await apiClient.get(
        `/api/custom-paths/${pathSlug}/shared_with/`
      );
      setSharedUsers(response.data);
    } catch (err) {
      console.error('Failed to load shared users:', err);
    }
  };

  const handleVisibilityChange = async (newVisibility: typeof visibility) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await apiClient.patch(`/api/custom-paths/${pathSlug}/update_visibility/`, {
        visibility: newVisibility,
      });

      setVisibility(newVisibility);
      setSuccess(`Path visibility changed to ${newVisibility}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePath = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!shareUsername.trim()) {
        setError('Please enter a username');
        return;
      }

      await apiClient.post(`/api/custom-paths/${pathSlug}/share/`, {
        username: shareUsername,
        permission: sharePermission,
      });

      setSuccess(`Path shared with ${shareUsername}`);
      setShareUsername('');
      await loadSharedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share path');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsharePath = async (username: string) => {
    try {
      setLoading(true);
      setError('');

      await apiClient.post(`/api/custom-paths/${pathSlug}/unshare/`, {
        username,
      });

      setSuccess(`Removed sharing with ${username}`);
      await loadSharedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove sharing');
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (vis: typeof visibility) => {
    switch (vis) {
      case 'private':
        return <Lock size={16} />;
      case 'public':
        return <Globe size={16} />;
      case 'shared':
        return <Users size={16} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!isCreator}
        >
          <Share2 size={16} />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{pathTitle}"</DialogTitle>
          <DialogDescription>
            Control who can access and edit your learning path
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

          {/* Visibility Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Path Visibility</h3>

            <div className="space-y-2">
              {(['private', 'public', 'shared'] as const).map((vis) => (
                <button
                  key={vis}
                  onClick={() => handleVisibilityChange(vis)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border-2 text-left transition ${
                    visibility === vis
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getVisibilityIcon(vis)}
                    <div>
                      <div className="font-medium capitalize">{vis}</div>
                      <div className="text-lg text-gray-500">
                        {vis === 'private' && 'Only you can access'}
                        {vis === 'public' && 'Anyone can view'}
                        {vis === 'shared' && 'Share with specific users'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Share with Users Section */}
          {visibility !== 'private' && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-medium text-lg">Share with Users</h3>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username"
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSharePath();
                      }
                    }}
                  />
                  <select
                    value={sharePermission}
                    onChange={(e) =>
                      setSharePermission(e.target.value as 'view' | 'edit')
                    }
                    className="px-3 py-2 border rounded-md text-lg"
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                </div>
                <Button
                  onClick={handleSharePath}
                  disabled={loading || !shareUsername.trim()}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Share
                </Button>
              </div>

              {/* Shared Users List */}
              {sharedUsers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-lg font-medium">Shared with:</h4>
                  {sharedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="text-lg font-medium">
                          {user.shared_to_username}
                        </div>
                        <div className="text-lg text-gray-500 capitalize">
                          {user.permission} permission
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsharePath(user.shared_to_username)}
                        disabled={loading}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Copy Share Link */}
          {visibility === 'public' && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  const url = `${window.location.origin}/paths/${pathSlug}`;
                  navigator.clipboard.writeText(url);
                  setSuccess('Share link copied!');
                }}
              >
                <Copy size={14} />
                Copy Share Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
