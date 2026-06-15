-- Vincula itens de feed antigos (sem anuncio_id) ao anúncio correspondente
update feed f
set anuncio_id = a.id
from anuncios a
where f.tipo = 'anuncio'
  and f.atleta_id is null
  and f.anuncio_id is null
  and f.titulo = a.titulo
  and f.corpo = a.corpo
  and coalesce(f.imagem_url, '') = coalesce(a.imagem_url, '');
