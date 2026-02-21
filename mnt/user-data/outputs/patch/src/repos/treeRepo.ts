// ---------------------------------------------------------------------------
// repos/treeRepo.ts
// All queries rely on RLS for user scoping; auth.uid() is evaluated
// server-side so no user_id filter is needed client-side. We still pass
// user_id explicitly on INSERT because RLS WITH CHECK requires it to match
// auth.uid() and the client sets it directly.
// ---------------------------------------------------------------------------

import { supabase } from '../lib/supabaseClient';
import { rowToTree, treeToInsert } from '../lib/mappers';
import type { FamilyTree } from '../types';

/**
 * Persist a new tree. Typically called once per GEDCOM import.
 * Throws on Supabase error so the caller can surface it via toast.
 */
export async function createTree(tree: FamilyTree): Promise<FamilyTree> {
  const { data, error } = await supabase
    .from('trees')
    .insert(treeToInsert(tree))
    .select()
    .single();

  if (error) throw new Error(`createTree: ${error.message}`);
  return rowToTree(data);
}

/**
 * Return all trees belonging to the authenticated user.
 * RLS ensures only the current user's rows are returned.
 */
export async function listTrees(): Promise<FamilyTree[]> {
  const { data, error } = await supabase
    .from('trees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listTrees: ${error.message}`);
  return (data ?? []).map(rowToTree);
}

/**
 * Update the home_person_id and member_ids after the user picks a home person.
 */
export async function updateTree(
  id: string,
  patch: { homePersonId?: string; memberIds?: string[]; name?: string }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.homePersonId !== undefined) update.home_person_id = patch.homePersonId;
  if (patch.memberIds !== undefined)    update.member_ids = patch.memberIds;
  if (patch.name !== undefined)         update.name = patch.name;

  const { error } = await supabase.from('trees').update(update).eq('id', id);
  if (error) throw new Error(`updateTree: ${error.message}`);
}
