-- Rename persisted schema to en-US while preserving existing data.

-- Enum type names and values.
do $$
begin
  if exists (select 1 from pg_type where typname = 'modalidade')
     and not exists (select 1 from pg_type where typname = 'membership_type') then
    alter type modalidade rename to membership_type;
  end if;

  if exists (select 1 from pg_type where typname = 'modalidade_status')
     and not exists (select 1 from pg_type where typname = 'membership_status') then
    alter type modalidade_status rename to membership_status;
  end if;

  if exists (select 1 from pg_type where typname = 'interesse_competicoes')
     and not exists (select 1 from pg_type where typname = 'competition_interest') then
    alter type interesse_competicoes rename to competition_interest;
  end if;

  if exists (select 1 from pg_type where typname = 'tipo_evento')
     and not exists (select 1 from pg_type where typname = 'event_type') then
    alter type tipo_evento rename to event_type;
  end if;

  if exists (select 1 from pg_type where typname = 'origem_evento')
     and not exists (select 1 from pg_type where typname = 'event_source') then
    alter type origem_evento rename to event_source;
  end if;

  if exists (select 1 from pg_type where typname = 'status_presenca')
     and not exists (select 1 from pg_type where typname = 'attendance_status') then
    alter type status_presenca rename to attendance_status;
  end if;

  if exists (select 1 from pg_type where typname = 'status_convocacao')
     and not exists (select 1 from pg_type where typname = 'call_up_status') then
    alter type status_convocacao rename to call_up_status;
  end if;

  if exists (select 1 from pg_type where typname = 'tipo_feed')
     and not exists (select 1 from pg_type where typname = 'feed_item_type') then
    alter type tipo_feed rename to feed_item_type;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'membership_status' and e.enumlabel = 'pendente') then
    alter type membership_status rename value 'pendente' to 'pending';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'membership_status' and e.enumlabel = 'aprovado') then
    alter type membership_status rename value 'aprovado' to 'approved';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'membership_status' and e.enumlabel = 'recusado') then
    alter type membership_status rename value 'recusado' to 'rejected';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'competition_interest' and e.enumlabel = 'sim') then
    alter type competition_interest rename value 'sim' to 'yes';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'competition_interest' and e.enumlabel = 'nao') then
    alter type competition_interest rename value 'nao' to 'no';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'event_type' and e.enumlabel = 'treino') then
    alter type event_type rename value 'treino' to 'training';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'event_type' and e.enumlabel = 'amistoso') then
    alter type event_type rename value 'amistoso' to 'friendly';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'event_type' and e.enumlabel = 'jogo') then
    alter type event_type rename value 'jogo' to 'game';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'event_source' and e.enumlabel = 'recorrente') then
    alter type event_source rename value 'recorrente' to 'recurring';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'attendance_status' and e.enumlabel = 'reservado') then
    alter type attendance_status rename value 'reservado' to 'reserved';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'attendance_status' and e.enumlabel = 'confirmado') then
    alter type attendance_status rename value 'confirmado' to 'confirmed';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'attendance_status' and e.enumlabel = 'liberado') then
    alter type attendance_status rename value 'liberado' to 'released';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'attendance_status' and e.enumlabel = 'fila_espera') then
    alter type attendance_status rename value 'fila_espera' to 'waitlist';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'attendance_status' and e.enumlabel = 'aguardando_pagamento') then
    alter type attendance_status rename value 'aguardando_pagamento' to 'pending_payment';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'call_up_status' and e.enumlabel = 'pendente') then
    alter type call_up_status rename value 'pendente' to 'pending';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'call_up_status' and e.enumlabel = 'aceito') then
    alter type call_up_status rename value 'aceito' to 'accepted';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'call_up_status' and e.enumlabel = 'recusado') then
    alter type call_up_status rename value 'recusado' to 'declined';
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'feed_item_type' and e.enumlabel = 'anuncio') then
    alter type feed_item_type rename value 'anuncio' to 'announcement';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'feed_item_type' and e.enumlabel = 'convocacao') then
    alter type feed_item_type rename value 'convocacao' to 'call_up';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'feed_item_type' and e.enumlabel = 'lembrete') then
    alter type feed_item_type rename value 'lembrete' to 'reminder';
  end if;
end $$;

-- Tables.
alter table if exists atletas rename to players;
alter table if exists links_convite rename to invite_links;
alter table if exists treinos_recorrentes rename to recurring_trainings;
alter table if exists eventos rename to events;
alter table if exists presencas rename to attendances;
alter table if exists convocacoes rename to call_ups;
alter table if exists anuncios rename to announcements;
alter table if exists feed_arquivados rename to archived_feed_items;

-- players
alter table players rename column nome to name;
alter table players rename column apelido to nickname;
alter table players rename column nascimento to birth_date;
alter table players rename column endereco to address;
alter table players rename column bairro_cidade to city_area;
alter table players rename column posicao to preferred_position;
alter table players rename column modalidade to membership_type;
alter table players rename column modalidade_status to membership_status;
alter table players rename column interesse_competicoes to competition_interest;
alter table players rename column observacoes to notes;
alter table players rename column ativo to active;
alter table players rename column criado_em to created_at;
alter table players rename column mensalidade_mes to membership_fee_month;
alter table players rename column mensalidade_paga_em to membership_fee_paid_at;

-- invite_links
alter table invite_links rename column usado to used;
alter table invite_links rename column expira_em to expires_at;
alter table invite_links rename column criado_em to created_at;

-- recurring_trainings
alter table recurring_trainings rename column dia_semana to weekday;
alter table recurring_trainings rename column hora_inicio to start_time;
alter table recurring_trainings rename column hora_fim to end_time;
alter table recurring_trainings rename column local to location;
alter table recurring_trainings rename column capacidade to capacity;
alter table recurring_trainings rename column ativo to active;

-- events
alter table events rename column tipo to type;
alter table events rename column data to date;
alter table events rename column hora_inicio to start_time;
alter table events rename column hora_fim to end_time;
alter table events rename column local to location;
alter table events rename column capacidade to capacity;
alter table events rename column confirmacao_abre_em to confirmation_opens_at;
alter table events rename column confirmacao_fecha_em to confirmation_closes_at;
alter table events rename column origem to source;
alter table events rename column criado_em to created_at;
alter table events rename column adversario to opponent;
alter table events rename column observacoes to notes;

-- attendances
alter table attendances rename column evento_id to event_id;
alter table attendances rename column atleta_id to player_id;
alter table attendances rename column posicao_fila to waitlist_position;
alter table attendances rename column criado_em to created_at;
alter table attendances rename column confirmado_em to confirmed_at;

-- call_ups
alter table call_ups rename column evento_id to event_id;
alter table call_ups rename column atleta_id to player_id;
alter table call_ups rename column mensagem to message;
alter table call_ups rename column convocado_em to called_up_at;
alter table call_ups rename column respondido_em to responded_at;

-- feed
alter table feed rename column tipo to type;
alter table feed rename column atleta_id to player_id;
alter table feed rename column evento_id to event_id;
alter table feed rename column titulo to title;
alter table feed rename column corpo to body;
alter table feed rename column lido to is_read;
alter table feed rename column criado_em to created_at;
alter table feed rename column imagem_url to image_url;
alter table feed rename column anuncio_id to announcement_id;

-- announcements
alter table announcements rename column titulo to title;
alter table announcements rename column corpo to body;
alter table announcements rename column criado_em to created_at;
alter table announcements rename column imagem_url to image_url;

-- archived_feed_items
alter table archived_feed_items rename column atleta_id to player_id;
alter table archived_feed_items rename column feed_id to feed_item_id;
alter table archived_feed_items rename column arquivado_em to archived_at;

-- Preferred position values are stored as text.
alter table players drop constraint if exists atletas_posicao_check;
update players
set preferred_position = case preferred_position
  when 'levantador' then 'setter'
  when 'ponteiro' then 'outside_hitter'
  when 'oposto' then 'opposite'
  when 'central' then 'middle_blocker'
  when 'libero' then 'libero'
  else preferred_position
end;
alter table players
  add constraint players_preferred_position_check
  check (
    preferred_position is null
    or preferred_position in ('setter', 'outside_hitter', 'opposite', 'middle_blocker', 'libero')
  );

-- Storage bucket for announcement images.
update storage.buckets
set id = 'announcements', name = 'announcements'
where id = 'anuncios';

update storage.objects
set bucket_id = 'announcements'
where bucket_id = 'anuncios';

-- Helpful index names after renaming.
alter index if exists idx_atletas_access_token rename to idx_players_access_token;
alter index if exists idx_atletas_modalidade_status rename to idx_players_membership_status;
alter index if exists idx_atletas_auth_user_id rename to idx_players_auth_user_id;
alter index if exists idx_atletas_email rename to idx_players_email;
alter index if exists idx_feed_atleta rename to idx_feed_player;
alter index if exists idx_feed_arquivados_atleta rename to idx_archived_feed_items_player;
alter index if exists idx_eventos_treino_recorrente_unique rename to idx_events_recurring_training_unique;
