-- Storage: bolena-cafe bucket policies
-- Public okuma (bucket zaten public ama explicit policy da ekleyelim)
DROP POLICY IF EXISTS "Public read bolena-cafe" ON storage.objects;
CREATE POLICY "Public read bolena-cafe"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar upload edebilir
DROP POLICY IF EXISTS "Authenticated upload bolena-cafe" ON storage.objects;
CREATE POLICY "Authenticated upload bolena-cafe"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar kendi yüklediği dosyaları güncelleyebilir
DROP POLICY IF EXISTS "Authenticated update bolena-cafe" ON storage.objects;
CREATE POLICY "Authenticated update bolena-cafe"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar dosya silebilir
DROP POLICY IF EXISTS "Authenticated delete bolena-cafe" ON storage.objects;
CREATE POLICY "Authenticated delete bolena-cafe"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bolena-cafe');
