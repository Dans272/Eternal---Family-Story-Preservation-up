// ---------------------------------------------------------------------------
// Mappers: convert snake_case Supabase rows ↔ camelCase app types.
// Keeping these in one place means the repos stay thin and the app types
// never need to change.
// ---------------------------------------------------------------------------

import type { FamilyTree, Profile, CirclePost, CircleAttachment, LifeEvent, Memory } from '../types';
import type { TreeRow, ProfileRow, PostRow, TreeInsert, ProfileInsert, PostInsert } from './database.types';

// ── FamilyTree ───────────────────────────────────────────────────────────────

export function rowToTree(row: TreeRow): FamilyTree {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    homePersonId: row.home_person_id ?? '',
    memberIds: row.member_ids ?? [],
  };
}

export function treeToInsert(t: FamilyTree): TreeInsert {
  return {
    id: t.id,
    user_id: t.userId,
    name: t.name,
    home_person_id: t.homePersonId || null,
    member_ids: t.memberIds,
  };
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    gender: row.gender ?? undefined,
    birthYear: row.birth_year ?? '',
    deathYear: row.death_year ?? undefined,
    imageUrl: row.image_url ?? '',
    summary: row.summary ?? '',
    historicalContext: row.historical_context ?? undefined,
    isMemorial: row.is_memorial,
    parentIds: row.parent_ids ?? [],
    childIds: row.child_ids ?? [],
    spouseIds: row.spouse_ids ?? [],
    timeline: (row.timeline as LifeEvent[]) ?? [],
    memories: (row.memories as Memory[]) ?? [],
    sources: row.sources ?? [],
  };
}

export function profileToInsert(p: Profile, treeId?: string): ProfileInsert {
  return {
    id: p.id,
    user_id: p.userId,
    tree_id: treeId ?? null,
    name: p.name,
    gender: p.gender ?? null,
    birth_year: p.birthYear || null,
    death_year: p.deathYear || null,
    image_url: p.imageUrl || null,
    summary: p.summary || null,
    historical_context: p.historicalContext ?? null,
    is_memorial: p.isMemorial ?? false,
    parent_ids: p.parentIds ?? [],
    child_ids: p.childIds ?? [],
    spouse_ids: p.spouseIds ?? [],
    timeline: (p.timeline ?? []) as unknown[],
    memories: (p.memories ?? []) as unknown[],
    sources: p.sources ?? [],
  };
}

// ── CirclePost ───────────────────────────────────────────────────────────────

/** taggedProfileIds must be injected from the post_people join */
export function rowToPost(row: PostRow, taggedProfileIds: string[]): CirclePost {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    authorLabel: row.author_label,
    body: row.body,
    attachments: (row.attachments as CircleAttachment[]) ?? [],
    taggedProfileIds,
  };
}

export function postToInsert(p: CirclePost): PostInsert {
  return {
    id: p.id,
    user_id: p.userId,
    author_label: p.authorLabel,
    body: p.body,
    attachments: p.attachments as unknown[],
  };
}
