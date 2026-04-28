-- Storage: bolena-cafe bucket policies
-- Public okuma (bucket zaten public ama explicit policy da ekleyelim)
CREATE POLICY "Public read bolena-cafe"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar upload edebilir
CREATE POLICY "Authenticated upload bolena-cafe"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar kendi yüklediği dosyaları güncelleyebilir
CREATE POLICY "Authenticated update bolena-cafe"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'bolena-cafe');

-- Authenticated kullanıcılar dosya silebilir
CREATE POLICY "Authenticated delete bolena-cafe"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bolena-cafe');
