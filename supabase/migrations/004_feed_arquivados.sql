-- Vínculo anúncio ↔ feed e arquivamento por atleta
alter table feed add column if not exists anuncio_id uuid references anuncios(id) on delete cascade;

create table if not exists feed_arquivados (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas(id) on delete cascade,
  feed_id uuid not null references feed(id) on delete cascade,
  arquivado_em timestamptz not null default now(),
  unique (atleta_id, feed_id)
);

create index if not exists idx_feed_arquivados_atleta on feed_arquivados(atleta_id);
