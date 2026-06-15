-- Habilita Supabase Realtime nas tabelas necessárias
alter publication supabase_realtime add table feed;
alter publication supabase_realtime add table presencas;
alter publication supabase_realtime add table convocacoes;

-- Anúncios globais: leitura pública para o cliente Realtime (publishable key)
create policy "feed_anuncios_publicos_select"
on feed for select
to anon, authenticated
using (tipo = 'anuncio' and atleta_id is null);

-- Lista de presença nos treinos: visível para quem acessa a página do treino
create policy "presencas_select_realtime"
on presencas for select
to anon, authenticated
using (true);

-- Convocações: leitura para Realtime (filtro por atleta_id no cliente)
create policy "convocacoes_select_realtime"
on convocacoes for select
to anon, authenticated
using (true);
