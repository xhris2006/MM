-- =============================================
-- V1 SCHEMA — Miss & Master IAI (CORRIGÉ)
-- Anti-abus sans confirmation email
-- =============================================

-- Table des candidats
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,  -- ← NOUVEAU: lien unique ex: /candidats/marie-abomo
  description TEXT DEFAULT '',
  photo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('miss', 'master')),
  promotion TEXT DEFAULT '',
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des votes (INCHANGÉE — garde tes votes existants)
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, candidate_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_category ON candidates(category);
CREATE INDEX IF NOT EXISTS idx_candidates_slug ON candidates(slug);

-- =============================================
-- AJOUTER LA COLONNE SLUG (si elle n'existe pas déjà)
-- À exécuter si tu as déjà la table candidates
-- =============================================
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS slug TEXT;

-- Générer les slugs pour les candidats existants
UPDATE candidates 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Rendre unique après génération
-- (si doublons, ajouter un suffix)
UPDATE candidates c
SET slug = c.slug || '-' || SUBSTRING(c.id::text, 1, 4)
WHERE (SELECT COUNT(*) FROM candidates c2 WHERE c2.slug = c.slug) > 1;

-- =============================================
-- FONCTIONS RPC
-- =============================================

-- Incrémenter les votes (ATOMIC — thread-safe)
CREATE OR REPLACE FUNCTION increment_vote(p_candidate_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE candidates SET vote_count = vote_count + 1 WHERE id = p_candidate_id;
END;
$$;

-- Vérifier si déjà voté dans une catégorie
CREATE OR REPLACE FUNCTION has_voted_in_category(p_user_id UUID, p_category TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM votes v JOIN candidates c ON c.id = v.candidate_id
  WHERE v.user_id = p_user_id AND c.category = p_category;
  RETURN v_count > 0;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_select" ON candidates;
DROP POLICY IF EXISTS "candidates_all" ON candidates;
DROP POLICY IF EXISTS "votes_select" ON votes;
DROP POLICY IF EXISTS "votes_insert" ON votes;

CREATE POLICY "candidates_select" ON candidates FOR SELECT USING (true);
CREATE POLICY "candidates_all" ON candidates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "votes_select" ON votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STORAGE
-- =============================================
-- Dans Supabase > Storage > New Bucket
-- Name: photos | Public: OUI

-- =============================================
-- CONFIG SUPABASE AUTH À DÉSACTIVER
-- Dans Supabase > Authentication > Settings:
-- "Enable email confirmations" → DÉSACTIVER
-- =============================================

-- Décrémenter le compteur de votes (minimum 0) — pour retirer un vote
CREATE OR REPLACE FUNCTION decrement_vote(p_candidate_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE candidates SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = p_candidate_id;
END;
$$;

-- =============================================
-- ON DELETE CASCADE — votes liés aux users auth
-- Exécute ceci si ce n'est pas déjà en place
-- =============================================

-- Vérifier et recréer la FK avec CASCADE si nécessaire
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour la clé étrangère
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
