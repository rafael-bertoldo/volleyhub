-- Remove treinos gerados além da semana atual (legado de geração de 6 semanas)
delete from eventos
where tipo = 'treino'
  and origem = 'recorrente'
  and data > (date_trunc('week', current_date)::date + interval '6 days');
