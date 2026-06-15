-- Campos extras para jogos e amistosos
alter table eventos add column if not exists adversario text not null default '';
alter table eventos add column if not exists observacoes text not null default '';
