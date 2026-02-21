import { useCallback, useMemo, useState } from 'react';
import { CirclePost, FamilyTree, Profile, User } from '../types';

export const useArchiveStore = (user: User | null) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [treeViewId, setTreeViewId] = useState<string | null>(null);
  const [circlePosts, setCirclePosts] = useState<CirclePost[]>([]);

  // Reset state when user signs out
  const prevUserId = useMemo(() => user?.id, [user?.id]);

  const addCirclePost = useCallback((post: CirclePost) => {
    setCirclePosts(prev => [post, ...prev]);
  }, []);

  const deleteCirclePost = useCallback((id: string) => {
    setCirclePosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateCirclePost = useCallback((id: string, patch: Partial<CirclePost>) => {
    setCirclePosts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const activeProfile = useMemo(
    () => profiles.find(p => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const selectedTree = useMemo(
    () => familyTrees.find(t => t.id === selectedTreeId) ?? null,
    [familyTrees, selectedTreeId]
  );

  const selectedTreeForView = useMemo(
    () => familyTrees.find(t => t.id === treeViewId) ?? null,
    [familyTrees, treeViewId]
  );

  const clearAll = useCallback(() => {
    setProfiles([]);
    setFamilyTrees([]);
    setActiveProfileId(null);
    setSelectedTreeId(null);
    setTreeViewId(null);
    setCirclePosts([]);
  }, []);

  // Required by App.tsx onDeleteProfile handler
  const deleteProfileById = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    profiles, setProfiles,
    familyTrees, setFamilyTrees,
    activeProfileId, setActiveProfileId,
    selectedTreeId, setSelectedTreeId,
    treeViewId, setTreeViewId,
    activeProfile, selectedTree, selectedTreeForView,
    circlePosts, addCirclePost, deleteCirclePost, updateCirclePost,
    clearAll,
    deleteProfileById,
  };
};
