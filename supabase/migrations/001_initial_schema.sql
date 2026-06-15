-- Roxinhos: schema inicial

create type modalidade as enum ('ON', 'MF', 'MR', 'MP', 'A');
create type modalidade_status as enum ('pendente', 'aprovado', 'recusado');
create type interesse_competicoes as enum ('sim', 'nao');

-- Links de convite para cadastro
create table links_convite (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  usado boolean not null default false,
  expira_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Atletas
create table atletas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nascimento date not null,
  endereco text not null,
  bairro_cidade text not null,
  modalidade modalidade not null,
  modalidade_status modalidade_status not null default 'pendente',
  interesse_competicoes interesse_competicoes not null,
  observacoes text,
  access_token text unique not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index idx_atletas_access_token on atletas(access_token);
create index idx_atletas_modalidade_status on atletas(modalidade_status);

-- Treinos recorrentes (configuração fixa)
create table treinos_recorrentes (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fim time not null,
  local text not null default '',
  capacidade smallint not null default 21,
  ativo boolean not null default true,
  unique (dia_semana)
);

-- Eventos (treinos gerados, amistosos, jogos)
create type tipo_evento as enum ('treino', 'amistoso', 'jogo');
create type origem_evento as enum ('recorrente', 'manual');

create table eventos (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_evento not null,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  local text not null default '',
  capacidade smallint not null default 21,
  confirmacao_abre_em timestamptz,
  confirmacao_fecha_em timestamptz,
  origem origem_evento not null default 'manual',
  criado_em timestamptz not null default now()
);

-- Presenças em treinos
create type status_presenca as enum (
  'reservado',
  'confirmado',
  'liberado',
  'fila_espera',
  'aguardando_pagamento'
);

create table presencas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  atleta_id uuid not null references atletas(id) on delete cascade,
  status status_presenca not null,
  posicao_fila smallint,
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  unique (evento_id, atleta_id)
);

-- Convocações para amistosos/jogos
create type status_convocacao as enum ('pendente', 'aceito', 'recusado');

create table convocacoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  atleta_id uuid not null references atletas(id) on delete cascade,
  status status_convocacao not null default 'pendente',
  mensagem text,
  convocado_em timestamptz not null default now(),
  respondido_em timestamptz,
  unique (evento_id, atleta_id)
);

-- Feed (anúncios globais e itens privados)
create type tipo_feed as enum ('anuncio', 'convocacao', 'lembrete', 'sistema');

create table feed (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_feed not null,
  atleta_id uuid references atletas(id) on delete cascade,
  evento_id uuid references eventos(id) on delete set null,
  titulo text not null,
  corpo text not null default '',
  lido boolean not null default false,
  criado_em timestamptz not null default now()
);

create index idx_feed_atleta on feed(atleta_id);

-- Anúncios
create table anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  criado_em timestamptz not null default now()
);

-- Dados iniciais: treinos recorrentes
-- 2=terça, 4=quinta, 5=sexta (PostgreSQL: 0=domingo)
insert into treinos_recorrentes (dia_semana, hora_inicio, hora_fim, local, capacidade) values
  (2, '19:30', '22:30', '', 21),
  (4, '20:30', '22:30', '', 21),
  (5, '20:00', '22:00', '', 21);

-- RLS: desabilitado no MVP (acesso via service role no servidor)
alter table atletas enable row level security;
alter table links_convite enable row level security;
alter table feed enable row level security;
alter table presencas enable row level security;
alter table convocacoes enable row level security;
alter table eventos enable row level security;
alter table anuncios enable row level security;
