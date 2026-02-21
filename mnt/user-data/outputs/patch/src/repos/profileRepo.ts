// ---------------------------------------------------------------------------
// repos/profileRepo.ts
// Profiles are bulk-upserted on GEDCOM import, and individually upserted
// whenever the user edits a profile in the app.
// ---------------------------------------------------------------------------

import { supabase } from '../lib/supabaseClient';
import { rowToProfile, profileToInsert } from '../lib/mappers';
import type { Profile } from '../types';

/**
 * Insert or update a single profile.
 * Pass `treeId` when creating during a GEDCOM import so the profile is
 * associated with the new tree.
 */
export async function upsertProfile(
  profile: Profile,
  treeId?: string
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileToInsert(profile, treeId), { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`upsertProfile: ${error.message}`);
  return rowToProfile(data);
}

/**
 * Bulk upsert — used during a GEDCOM import where hundreds of profiles
 * arrive at once. Batches into chunks of 200 to stay within Supabase limits.
 */
export async function upsertProfiles(
  profiles: Profile[],
  treeId?: string
): Promise<Profile[]> {
  const CHUNK = 200;
  const results: Profile[] = [];

  for (let i = 0; i < profiles.length; i += CHUNK) {
    const chunk = profiles.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        chunk.map((p) => profileToInsert(p, treeId)),
        { onConflict: 'id' }
      )
      .select();

    if (error) throw new Error(`upsertProfiles (chunk ${i}): ${error.message}`);
    results.push(...(data ?? []).map(rowToProfile));
  }

  return results;
}

/**
 * List every profile that belongs to the current user.
 * Optionally scope to a single tree.
 */
export async function listProfiles(treeId?: string): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*');

  if (treeId) {
    query = query.eq('tree_id', treeId);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw new Error(`listProfiles: ${error.message}`);
  return (data ?? []).map(rowToProfile);
}

/**
 * Hard-delete a profile. Cascades to post_people and media_people via FK.
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw new Error(`deleteProfile: ${error.message}`);
}
