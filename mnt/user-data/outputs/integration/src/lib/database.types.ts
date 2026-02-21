// ---------------------------------------------------------------------------
// Hand-authored types that mirror the SQL schema in supabase_migration.sql.
// Replace with the output of `supabase gen types typescript` once you have
// a linked project: https://supabase.com/docs/reference/cli/supabase-gen-types
// ---------------------------------------------------------------------------

export type MediaKindEnum = 'photo' | 'video' | 'audio' | 'document';
export type GenderCodeEnum = 'M' | 'F' | 'U';

// ── Row shapes (what Supabase returns) ──────────────────────────────────────

export interface TreeRow {
  id: string;
  user_id: string;
  name: string;
  home_person_id: string | null;
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  tree_id: string | null;
  name: string;
  gender: GenderCodeEnum | null;
  birth_year: string | null;
  death_year: string | null;
  image_url: string | null;
  summary: string | null;
  historical_context: { text: string; sources: unknown[] } | null;
  is_memorial: boolean;
  parent_ids: string[];
  child_ids: string[];
  spouse_ids: string[];
  timeline: unknown[];   // LifeEvent[] stored as JSONB
  memories: unknown[];   // Memory[] stored as JSONB
  sources: string[];
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: string;
  user_id: string;
  author_label: string;
  body: string;
  attachments: unknown[];  // CircleAttachment[] stored as JSONB
  created_at: string;
  updated_at: string;
}

export interface PostPersonRow {
  post_id: string;
  profile_id: string;
  user_id: string;
}

export interface MediaRow {
  id: string;
  user_id: string;
  name: string;
  kind: MediaKindEnum;
  storage_path: string;
  public_url: string | null;
  mime: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
}

export interface MediaPersonRow {
  media_id: string;
  profile_id: string;
  user_id: string;
}

// ── Insert shapes (what we send to Supabase) ────────────────────────────────

export type TreeInsert = Omit<TreeRow, 'created_at' | 'updated_at'>;
export type ProfileInsert = Omit<ProfileRow, 'created_at' | 'updated_at'>;
export type PostInsert = Omit<PostRow, 'created_at' | 'updated_at'>;
export type MediaInsert = Omit<MediaRow, 'created_at' | 'updated_at'>;

// ── Minimal Database shape for createClient<Database>() ─────────────────────

export interface Database {
  public: {
    Tables: {
      trees:        { Row: TreeRow;        Insert: TreeInsert;    Update: Partial<TreeInsert> };
      profiles:     { Row: ProfileRow;     Insert: ProfileInsert; Update: Partial<ProfileInsert> };
      posts:        { Row: PostRow;        Insert: PostInsert;    Update: Partial<PostInsert> };
      post_people:  { Row: PostPersonRow;  Insert: PostPersonRow; Update: Partial<PostPersonRow> };
      media:        { Row: MediaRow;       Insert: MediaInsert;   Update: Partial<MediaInsert> };
      media_people: { Row: MediaPersonRow; Insert: MediaPersonRow; Update: Partial<MediaPersonRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_kind: MediaKindEnum;
      gender_code: GenderCodeEnum;
    };
  };
}
