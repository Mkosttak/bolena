-- Blog Yazıları
CREATE TABLE IF NOT EXISTS blog_posts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE NOT NULL,
  title_tr             TEXT NOT NULL,
  title_en             TEXT,
  content_tr           TEXT NOT NULL DEFAULT '',
  content_en           TEXT,
  excerpt_tr           TEXT,
  excerpt_en           TEXT,
  cover_image_url      TEXT,
  author_name          TEXT NOT NULL,
  published_at         DATE,
  is_published         BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INTEGER,
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  meta_title           TEXT,
  meta_description     TEXT,
  focus_keywords       TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anon kullanıcılar sadece yayınlanmış yazıları okuyabilir
DROP POLICY IF EXISTS "blog_public_read" ON blog_posts;
CREATE POLICY "blog_public_read" ON blog_posts
  FOR SELECT TO anon
  USING (is_published = true AND published_at <= CURRENT_DATE);

-- Authenticated kullanıcılar her şeyi okuyabilir
DROP POLICY IF EXISTS "blog_auth_read" ON blog_posts;
CREATE POLICY "blog_auth_read" ON blog_posts
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated kullanıcılar yazabilir (gerçek güvenlik requireModuleAccess ile)
DROP POLICY IF EXISTS "blog_auth_write" ON blog_posts;
CREATE POLICY "blog_auth_write" ON blog_posts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();
