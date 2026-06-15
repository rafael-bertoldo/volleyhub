-- Controle de mensalidade dos mensalistas (válida até o dia 10 de cada mês)
alter table atletas add column if not exists mensalidade_mes date;
alter table atletas add column if not exists mensalidade_paga_em timestamptz;
