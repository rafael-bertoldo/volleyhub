-- Remove eventos de treino duplicados (mantém o mais antigo)
delete from eventos a
using eventos b
where a.id > b.id
  and a.tipo = 'treino'
  and a.origem = 'recorrente'
  and a.data = b.data
  and a.hora_inicio = b.hora_inicio;

-- Impede novas duplicatas (ex.: requisições concorrentes)
create unique index if not exists idx_eventos_treino_recorrente_unique
  on eventos (data, hora_inicio)
  where tipo = 'treino' and origem = 'recorrente';
