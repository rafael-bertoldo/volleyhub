-- Imagens em anúncios e feed
alter table anuncios add column if not exists imagem_url text;
alter table feed add column if not exists imagem_url text;

-- Bucket público para imagens de anúncios (máx. 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anuncios',
  'anuncios',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública das imagens
create policy "Imagens de anúncios são públicas"
on storage.objects for select
to public
using (bucket_id = 'anuncios');
