// ---------------------------------------------------------------------------
// repos/postRepo.ts
// Posts are created with an optional list of tagged profile IDs.
// Mentions are stored in post_people in the same transaction (via Promise.all
// after insert — Supabase JS v2 does not yet support true multi-statement
// transactions from the client, so we do a best-effort insert and surface
// any failure clearly).
// ---------------------------------------------------------------------------

import { supabase } from '../lib/supabaseClient';
import { rowToPost, postToInsert } from '../lib/mappers';
import type { CirclePost } from '../types';

/**
 * Insert a post and its tagged-profile join rows.
 * If mention insertion fails the post still exists; the error is logged but
 * not re-thrown so the UI stays responsive.
 */
export async function createPost(post: CirclePost): Promise<CirclePost> {
  // 1. Insert the post row.
  const { data, error } = await supabase
    .from('posts')
    .insert(postToInsert(post))
    .select()
    .single();

  if (error) throw new Error(`createPost: ${error.message}`);

  // 2. Insert mention rows for each tagged profile.
  if (post.taggedProfileIds.length > 0) {
    const mentions = post.taggedProfileIds.map((profileId) => ({
      post_id: data.id,
      profile_id: profileId,
      user_id: post.userId,
    }));

    const { error: mentionError } = await supabase
      .from('post_people')
      .insert(mentions);

    if (mentionError) {
      // Non-fatal: the post is saved, just log the partial failure.
      console.error('createPost mentions insert failed:', mentionError.message);
    }
  }

  return rowToPost(data, post.taggedProfileIds);
}

/**
 * List posts for the current user (RLS-filtered), newest first.
 * Fetches tagged profile IDs by joining post_people.
 */
export async function listPosts(): Promise<CirclePost[]> {
  // Fetch posts + their mentions in one query using PostgREST's nested select.
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_people ( profile_id )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listPosts: ${error.message}`);

  return (data ?? []).map((row) => {
    const taggedProfileIds = (row.post_people as { profile_id: string }[]).map(
      (pp) => pp.profile_id
    );
    return rowToPost(row, taggedProfileIds);
  });
}

/**
 * Delete a post. Cascades to post_people rows via FK ON DELETE CASCADE.
 */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw new Error(`deletePost: ${error.message}`);
}
