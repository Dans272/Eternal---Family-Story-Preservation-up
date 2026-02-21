-- =============================================================================
-- Eternal Family Archive — Supabase migration
-- Run once in the Supabase SQL editor (or via supabase db push).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Shared helpers
-- ---------------------------------------------------------------------------

-- Reusable domain type so every media-kind column is validated identically.
DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM ('photo', 'video', 'audio', 'document');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Reusable domain type for relationship roles stored on profiles.
DO $$ BEGIN
  CREATE TYPE gender_code AS ENUM ('M', 'F', 'U');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- 1. TABLE DEFINITIONS
-- =============================================================================


-- ---------------------------------------------------------------------------
-- trees
-- One row per GEDCOM import.  memberIds and homePersonId are resolved via
-- profiles once profiles are inserted; we keep homePersonId as a nullable FK
-- that we set after the profiles upsert.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name            text NOT NULL,
  home_person_id  uuid,                          -- FK to profiles; set post-insert
  member_ids      uuid[] NOT NULL DEFAULT '{}',  -- denormalised for cheap reads

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at fresh automatically.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trees_updated_at
  BEFORE UPDATE ON trees
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- profiles
-- One row per person.  Relationships (parentIds, childIds, spouseIds) are
-- stored as uuid arrays — same shape as the TypeScript model — so the app
-- needs zero transformation.  Complex structured data (timeline, memories,
-- historicalContext) is kept as JSONB; columns are typed, not just "jsonb",
-- so Postgres will reject malformed inserts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id             uuid REFERENCES trees(id) ON DELETE SET NULL,

  name                text        NOT NULL,
  gender              gender_code,
  birth_year          text,                       -- kept as text to match GEDCOM
  death_year          text,
  image_url           text,
  summary             text,
  historical_context  jsonb,                      -- { text: string, sources: any[] }
  is_memorial         boolean     NOT NULL DEFAULT false,

  -- Relationships (denormalised arrays — keep in sync on write)
  parent_ids          uuid[]      NOT NULL DEFAULT '{}',
  child_ids           uuid[]      NOT NULL DEFAULT '{}',
  spouse_ids          uuid[]      NOT NULL DEFAULT '{}',

  -- Structured event history  [{ id, type, date, place, spouseName, media[] }]
  timeline            jsonb       NOT NULL DEFAULT '[]',

  -- Memories  [{ id, type, content, timestamp }]
  memories            jsonb       NOT NULL DEFAULT '[]',

  -- Raw GEDCOM source citations
  sources             text[]      NOT NULL DEFAULT '{}',

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Now we can add the FK from trees back to profiles.
ALTER TABLE trees
  ADD CONSTRAINT trees_home_person_fk
  FOREIGN KEY (home_person_id) REFERENCES profiles(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- posts
-- Family-circle posts.  Attachments are stored inline as JSONB (same shape
-- as CircleAttachment[]) because they are always read and written together.
-- Tagged profiles live in post_people so they can be queried efficiently.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  author_label  text NOT NULL,                   -- display name snapshot
  body          text NOT NULL,
  attachments   jsonb NOT NULL DEFAULT '[]',     -- CircleAttachment[]

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- post_people  (many-to-many: posts ↔ profiles)
-- A row exists when a profile is mentioned/tagged in a post.
-- Ownership is enforced via CHECK: the inserting user must own the post.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_people (
  post_id     uuid NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  PRIMARY KEY (post_id, profile_id)
);


-- ---------------------------------------------------------------------------
-- media
-- One row per uploaded file.  The actual bytes live in Supabase Storage;
-- this table holds the metadata and the storage path / public URL.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name        text        NOT NULL,
  kind        media_kind  NOT NULL,
  storage_path text       NOT NULL,              -- path inside your Storage bucket
  public_url  text,                              -- cached CDN URL
  mime        text,
  size        bigint,                            -- bytes

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- media_people  (many-to-many: media ↔ profiles)
-- A row exists when a person is tagged in a media item.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_people (
  media_id    uuid NOT NULL REFERENCES media(id)    ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  PRIMARY KEY (media_id, profile_id)
);


-- =============================================================================
-- 2. ROW LEVEL SECURITY — enable on every table
-- =============================================================================

ALTER TABLE trees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_people  ENABLE ROW LEVEL SECURITY;
ALTER TABLE media        ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_people ENABLE ROW LEVEL SECURITY;

-- Deny everything by default (Supabase default is already deny, but being
-- explicit makes auditing easier and survives schema resets).
ALTER TABLE trees        FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles     FORCE ROW LEVEL SECURITY;
ALTER TABLE posts        FORCE ROW LEVEL SECURITY;
ALTER TABLE post_people  FORCE ROW LEVEL SECURITY;
ALTER TABLE media        FORCE ROW LEVEL SECURITY;
ALTER TABLE media_people FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================
-- Convention: one policy per operation per table, named
--   <table>_<select|insert|update|delete>_own
-- The expression  (user_id = auth.uid())  is inlined directly; Postgres
-- evaluates it per-row after the planner pushes it as a filter, which is
-- index-friendly when user_id is indexed (see indexes below).
-- ---------------------------------------------------------------------------


-- ── trees ────────────────────────────────────────────────────────────────────

CREATE POLICY trees_select_own ON trees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY trees_insert_own ON trees
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY trees_update_own ON trees
  FOR UPDATE USING (user_id = auth.uid())
             WITH CHECK (user_id = auth.uid());

CREATE POLICY trees_delete_own ON trees
  FOR DELETE USING (user_id = auth.uid());


-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (user_id = auth.uid())
             WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE USING (user_id = auth.uid());


-- ── posts ────────────────────────────────────────────────────────────────────

CREATE POLICY posts_select_own ON posts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY posts_insert_own ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY posts_update_own ON posts
  FOR UPDATE USING (user_id = auth.uid())
             WITH CHECK (user_id = auth.uid());

CREATE POLICY posts_delete_own ON posts
  FOR DELETE USING (user_id = auth.uid());


-- ── post_people ───────────────────────────────────────────────────────────────
-- A user may only insert/delete rows where they own the parent post.
-- The user_id column is a redundant denormalisation of posts.user_id that
-- lets us write a simple equality check without a subquery in the policy.
-- The INSERT CHECK also verifies the user owns the referenced profile so a
-- user cannot tag a profile that belongs to someone else.

CREATE POLICY post_people_select_own ON post_people
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY post_people_insert_own ON post_people
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    -- must own the parent post
    AND EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_people.post_id
        AND posts.user_id = auth.uid()
    )
    -- must own the tagged profile
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = post_people.profile_id
        AND profiles.user_id = auth.uid()
    )
  );

-- Updates to a junction table are rare; block them — re-insert instead.
-- (No UPDATE policy = UPDATE is denied.)

CREATE POLICY post_people_delete_own ON post_people
  FOR DELETE USING (user_id = auth.uid());


-- ── media ────────────────────────────────────────────────────────────────────

CREATE POLICY media_select_own ON media
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY media_insert_own ON media
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY media_update_own ON media
  FOR UPDATE USING (user_id = auth.uid())
             WITH CHECK (user_id = auth.uid());

CREATE POLICY media_delete_own ON media
  FOR DELETE USING (user_id = auth.uid());


-- ── media_people ──────────────────────────────────────────────────────────────
-- Same ownership pattern as post_people.

CREATE POLICY media_people_select_own ON media_people
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY media_people_insert_own ON media_people
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM media
      WHERE media.id = media_people.media_id
        AND media.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = media_people.profile_id
        AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY media_people_delete_own ON media_people
  FOR DELETE USING (user_id = auth.uid());


-- =============================================================================
-- 4. INDEXES
-- All foreign keys and the most common filter columns get an index.
-- user_id indexes are the most important: every RLS policy filters by them.
-- =============================================================================

CREATE INDEX IF NOT EXISTS trees_user_id_idx          ON trees        (user_id);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx       ON profiles     (user_id);
CREATE INDEX IF NOT EXISTS profiles_tree_id_idx       ON profiles     (tree_id);
CREATE INDEX IF NOT EXISTS posts_user_id_idx          ON posts        (user_id);
CREATE INDEX IF NOT EXISTS post_people_post_id_idx    ON post_people  (post_id);
CREATE INDEX IF NOT EXISTS post_people_profile_id_idx ON post_people  (profile_id);
CREATE INDEX IF NOT EXISTS post_people_user_id_idx    ON post_people  (user_id);
CREATE INDEX IF NOT EXISTS media_user_id_idx          ON media        (user_id);
CREATE INDEX IF NOT EXISTS media_people_media_id_idx  ON media_people (media_id);
CREATE INDEX IF NOT EXISTS media_people_profile_idx   ON media_people (profile_id);
CREATE INDEX IF NOT EXISTS media_people_user_id_idx   ON media_people (user_id);
