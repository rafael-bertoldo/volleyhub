-- Dados esportivos adicionais do atleta.
alter table atletas
  add column if not exists apelido text,
  add column if not exists posicao text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'atletas_posicao_check'
  ) then
    alter table atletas
      add constraint atletas_posicao_check
      check (
        posicao is null
        or posicao in ('levantador', 'ponteiro', 'oposto', 'central', 'libero')
      );
  end if;
end $$;
