// ---------------------------------------------------------------------------
// hooks/useArchiveStore.ts  (Supabase-backed, localStorage removed)
//
// Public API is intentionally identical to the old hook so no component or
// sub-hook (useGedcomImport, useProfileEditor, useMediaAttach) needs to change.
//
// Key design decisions
// ─────────────────────
// 1. State is still held in React useState — Supabase is the source of truth
//    but we keep a local in-memory cache so the UI stays synchronous.
//
// 2. setProfiles / setFamilyTrees are *augmented* dispatchers: when called
//    with a new value they (a) update React state immediately for instant UI
//    feedback, and (b) fire-and-forget persist the diff to Supabase.
//
// 3. addCirclePost / deleteCirclePost follow the same optimistic pattern.
//
// 4. All repo errors are caught and logged; a stored `error` field lets
//    consumers surface them if they choose.
// ---------------------------------------------------------------------------

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { CirclePost, FamilyTree, Profile, User } from '../types';
import { listTrees, createTree, updateTree } from '../repos/treeRepo';
import {
  listProfiles,
  upsertProfiles,
  deleteProfile as deleteProfileRepo,
} from '../repos/profileRepo';
import {
  listPosts,
  createPost,
  deletePost as deletePostRepo,
} from '../repos/postRepo';

// ── Types ────────────────────────────────────────────────────────────────────

type SetState<T> = Dispatch<SetStateAction<T>>;

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useArchiveStore = (user: User | null) => {
  // ── Local state (in-memory cache of Supabase data) ─────────────────────────
  const [profiles, setProfilesRaw]       = useState<Profile[]>([]);
  const [familyTrees, setFamilyTreesRaw] = useState<FamilyTree[]>([]);
  const [circlePosts, setCirclePostsRaw] = useState<CirclePost[]>([]);

  const [activeProfileId,  setActiveProfileId]  = useState<string | null>(null);
  const [selectedTreeId,   setSelectedTreeId]   = useState<string | null>(null);
  const [treeViewId,       setTreeViewId]       = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setProfilesRaw([]);
      setFamilyTreesRaw([]);
      setCirclePostsRaw([]);
      setActiveProfileId(null);
      setSelectedTreeId(null);
      setTreeViewId(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([listTrees(), listProfiles(), listPosts()])
      .then(([trees, profs, posts]) => {
        if (cancelled) return;
        setFamilyTreesRaw(trees);
        setProfilesRaw(profs);
        setCirclePostsRaw(posts);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[useArchiveStore] initial load failed:', msg);
        setError(msg);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  // ── Augmented setProfiles ───────────────────────────────────────────────────
  // Matches the React Dispatch<SetStateAction<Profile[]>> signature exactly
  // so useProfileEditor, useGedcomImport, useMediaAttach work unchanged.
  // After each state update we diff against the previous array and upsert
  // any new or modified profiles to Supabase (fire-and-forget).
  const prevProfilesRef = useRef<Profile[]>([]);

  const setProfiles: SetState<Profile[]> = useCallback(
    (valueOrUpdater) => {
      setProfilesRaw((prev) => {
        const next =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (p: Profile[]) => Profile[])(prev)
            : valueOrUpdater;

        const prevById = new Map(prev.map((p) => [p.id, p]));
        const toUpsert = next.filter((p) => {
          const old = prevById.get(p.id);
          return !old || JSON.stringify(old) !== JSON.stringify(p);
        });

        if (toUpsert.length > 0) {
          upsertProfiles(toUpsert).catch((err: unknown) => {
            console.error('[useArchiveStore] upsertProfiles failed:', err);
          });
        }

        prevProfilesRef.current = next;
        return next;
      });
    },
    []
  );

  // ── Augmented setFamilyTrees ────────────────────────────────────────────────
  // New trees are created in Supabase; updates to existing trees (e.g.
  // homePersonId set by chooseHome) are sent via updateTree.
  const setFamilyTrees: SetState<FamilyTree[]> = useCallback(
    (valueOrUpdater) => {
      setFamilyTreesRaw((prev) => {
        const next =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (t: FamilyTree[]) => FamilyTree[])(prev)
            : valueOrUpdater;

        const prevIds = new Set(prev.map((t) => t.id));

        next.forEach((tree) => {
          if (!prevIds.has(tree.id)) {
            // Brand new tree.
            createTree(tree).catch((err: unknown) => {
              console.error('[useArchiveStore] createTree failed:', err);
            });
          } else {
            const old = prev.find((t) => t.id === tree.id);
            if (old && JSON.stringify(old) !== JSON.stringify(tree)) {
              updateTree(tree.id, {
                homePersonId: tree.homePersonId,
                memberIds: tree.memberIds,
                name: tree.name,
              }).catch((err: unknown) => {
                console.error('[useArchiveStore] updateTree failed:', err);
              });
            }
          }
        });

        return next;
      });
    },
    []
  );

  // ── Circle posts ────────────────────────────────────────────────────────────

  const addCirclePost = useCallback((post: CirclePost) => {
    // Optimistic update — roll back on failure.
    setCirclePostsRaw((prev) => [post, ...prev]);
    createPost(post).catch((err: unknown) => {
      console.error('[useArchiveStore] createPost failed:', err);
      setCirclePostsRaw((prev) => prev.filter((p) => p.id !== post.id));
    });
  }, []);

  const deleteCirclePost = useCallback((id: string) => {
    setCirclePostsRaw((prev) => prev.filter((p) => p.id !== id));
    deletePostRepo(id).catch((err: unknown) => {
      console.error('[useArchiveStore] deletePost failed:', err);
    });
  }, []);

  const updateCirclePost = useCallback((id: string, patch: Partial<CirclePost>) => {
    // Posts are not edited in the current UI; kept for API compatibility.
    setCirclePostsRaw((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────────

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const selectedTree = useMemo(
    () => familyTrees.find((t) => t.id === selectedTreeId) ?? null,
    [familyTrees, selectedTreeId]
  );

  const selectedTreeForView = useMemo(
    () => familyTrees.find((t) => t.id === treeViewId) ?? null,
    [familyTrees, treeViewId]
  );

  // ── clearAll ────────────────────────────────────────────────────────────────
  // Clears local cache only — Supabase data is preserved for next login.
  const clearAll = useCallback(() => {
    setProfilesRaw([]);
    setFamilyTreesRaw([]);
    setCirclePostsRaw([]);
    setActiveProfileId(null);
    setSelectedTreeId(null);
    setTreeViewId(null);
    prevProfilesRef.current = [];
  }, []);

  // ── deleteProfileById ───────────────────────────────────────────────────────
  // useProfileEditor calls setProfiles(prev => prev.filter(…)) for the
  // optimistic state update. Call this alongside it to persist the deletion.
  const deleteProfileById = useCallback((profileId: string) => {
    deleteProfileRepo(profileId).catch((err: unknown) => {
      console.error('[useArchiveStore] deleteProfile failed:', err);
    });
  }, []);

  // ── Return (identical surface to old hook + optional extras) ─────────────────
  return {
    profiles,      setProfiles,
    familyTrees,   setFamilyTrees,
    circlePosts,

    activeProfileId,  setActiveProfileId,
    selectedTreeId,   setSelectedTreeId,
    treeViewId,       setTreeViewId,

    activeProfile,
    selectedTree,
    selectedTreeForView,

    addCirclePost,
    deleteCirclePost,
    updateCirclePost,
    clearAll,

    // New — call alongside setProfiles(prev => prev.filter(…)) when deleting.
    deleteProfileById,

    // New — optional loading/error state for UI feedback.
    isLoading,
    error,
  };
};
