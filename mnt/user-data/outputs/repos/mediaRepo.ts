// ---------------------------------------------------------------------------
// repos/mediaRepo.ts
// Files are uploaded to the Supabase Storage bucket named 'media' (private).
// After a successful upload the metadata row is inserted into the media table.
// Signed URLs are generated on demand (1-hour expiry) and should not be
// persisted — generate a fresh one each time you render a <img> or <video>.
// ---------------------------------------------------------------------------

import { supabase } from '../lib/supabaseClient';
import type { MediaItem, MediaKind } from '../types';
import type { MediaRow } from '../lib/database.types';

const BUCKET = 'media';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

// ── Internal helpers ─────────────────────────────────────────────────────────

function rowToMediaItem(row: MediaRow, signedUrl: string): MediaItem {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as MediaKind,
    url: signedUrl,
    mime: row.mime ?? undefined,
    size: row.size ?? undefined,
    createdAt: row.created_at,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface UploadMediaOptions {
  /** UUID of the authenticated user — needed to namespace the storage path. */
  userId: string;
  /** The browser File object to upload. */
  file: File;
  /** Optional profile IDs to tag in media_people after upload. */
  taggedProfileIds?: string[];
}

/**
 * Upload a file to Supabase Storage, write a metadata row, optionally tag
 * profiles, and return a MediaItem with a fresh signed URL.
 *
 * Storage path:  `{userId}/{timestamp}-{sanitisedFileName}`
 * This ensures files from different users never collide even without RLS on
 * the bucket (though you should also enable Storage RLS).
 */
export async function uploadMedia(opts: UploadMediaOptions): Promise<MediaItem> {
  const { userId, file, taggedProfileIds = [] } = opts;

  // 1. Build a collision-safe storage path.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${Date.now()}-${safeName}`;

  // 2. Upload the raw file.
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw new Error(`uploadMedia storage: ${uploadError.message}`);

  // 3. Infer media kind from MIME type.
  const kind = inferKind(file.type);

  // 4. Insert the metadata row.
  const { data: row, error: insertError } = await supabase
    .from('media')
    .insert({
      user_id: userId,
      name: file.name,
      kind,
      storage_path: storagePath,
      public_url: null,
      mime: file.type || null,
      size: file.size,
    })
    .select()
    .single();

  if (insertError) {
    // Best-effort cleanup: remove the orphaned file from Storage.
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    throw new Error(`uploadMedia insert: ${insertError.message}`);
  }

  // 5. Tag profiles if requested.
  if (taggedProfileIds.length > 0) {
    const tags = taggedProfileIds.map((profileId) => ({
      media_id: row.id,
      profile_id: profileId,
      user_id: userId,
    }));

    const { error: tagError } = await supabase.from('media_people').insert(tags);
    if (tagError) {
      console.error('uploadMedia tagging failed:', tagError.message);
    }
  }

  // 6. Generate a signed URL for immediate display.
  const signedUrl = await getSignedUrl(storagePath);

  return rowToMediaItem(row, signedUrl);
}

/**
 * Generate a fresh signed URL for a storage path.
 * Call this every time you need to display a private media item.
 */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`getSignedUrl: ${error?.message ?? 'no URL returned'}`);
  }

  return data.signedUrl;
}

/**
 * List all media items for the current user (RLS-filtered).
 * Signed URLs are generated in parallel for all items.
 */
export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listMedia: ${error.message}`);

  const rows = data ?? [];
  const signedUrls = await Promise.all(
    rows.map((r) => getSignedUrl(r.storage_path).catch(() => ''))
  );

  return rows.map((row, i) => rowToMediaItem(row, signedUrls[i]));
}

/**
 * Delete a media row and its file from Storage.
 * Cascades to media_people via FK ON DELETE CASCADE.
 */
export async function deleteMedia(mediaId: string, storagePath: string): Promise<void> {
  const [{ error: dbError }, { error: storageError }] = await Promise.all([
    supabase.from('media').delete().eq('id', mediaId),
    supabase.storage.from(BUCKET).remove([storagePath]),
  ]);

  if (dbError) throw new Error(`deleteMedia db: ${dbError.message}`);
  if (storageError) throw new Error(`deleteMedia storage: ${storageError.message}`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferKind(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
