-- Vincula atletas ao Supabase Auth para login por email/senha.
alter table atletas
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text;

alter table atletas
  alter column access_token drop not null;

create unique index if not exists idx_atletas_auth_user_id
  on atletas(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists idx_atletas_email
  on atletas(lower(email))
  where email is not null;
