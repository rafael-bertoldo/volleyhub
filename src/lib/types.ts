export type Modalidade = "ON" | "MF" | "MR" | "MP" | "A";
export type ModalidadeStatus = "pendente" | "aprovado" | "recusado";
export type InteresseCompeticoes = "sim" | "nao";

export interface Atleta {
  id: string;
  nome: string;
  nascimento: string;
  endereco: string;
  bairro_cidade: string;
  modalidade: Modalidade;
  modalidade_status: ModalidadeStatus;
  interesse_competicoes: InteresseCompeticoes;
  observacoes: string | null;
  access_token: string;
  ativo: boolean;
  criado_em: string;
}

export interface LinkConvite {
  id: string;
  token: string;
  usado: boolean;
  expira_em: string | null;
  criado_em: string;
}

export interface CadastroFormData {
  nome: string;
  nascimento: string;
  endereco: string;
  bairro_cidade: string;
  modalidade: Modalidade;
  interesse_competicoes: InteresseCompeticoes;
  observacoes: string;
}

export type TipoFeed = "anuncio" | "convocacao" | "lembrete" | "sistema";

export interface FeedItem {
  id: string;
  tipo: TipoFeed;
  atleta_id: string | null;
  evento_id: string | null;
  anuncio_id: string | null;
  titulo: string;
  corpo: string;
  imagem_url: string | null;
  lido: boolean;
  criado_em: string;
}

export interface Anuncio {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string | null;
  criado_em: string;
}

export type TipoEvento = "treino" | "amistoso" | "jogo";
export type OrigemEvento = "recorrente" | "manual";
export type StatusPresenca =
  | "reservado"
  | "confirmado"
  | "liberado"
  | "fila_espera"
  | "aguardando_pagamento";

export interface Evento {
  id: string;
  tipo: TipoEvento;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  capacidade: number;
  adversario: string;
  observacoes: string;
  confirmacao_abre_em: string | null;
  confirmacao_fecha_em: string | null;
  origem: OrigemEvento;
  criado_em: string;
}

export interface Presenca {
  id: string;
  evento_id: string;
  atleta_id: string;
  status: StatusPresenca;
  posicao_fila: number | null;
  criado_em: string;
  confirmado_em: string | null;
}

export interface TreinoComPresenca extends Evento {
  presenca: Presenca | null;
  vagas_ocupadas: number;
}

export type StatusConvocacao = "pendente" | "aceito" | "recusado";

export interface Convocacao {
  id: string;
  evento_id: string;
  atleta_id: string;
  status: StatusConvocacao;
  mensagem: string | null;
  convocado_em: string;
  respondido_em: string | null;
}

export interface ConvocacaoComEvento extends Convocacao {
  evento: Evento;
}

export interface JogoComConvocacoes extends Evento {
  convocacoes: ConvocacaoComAtleta[];
  stats: ConvocacaoStats;
}

export interface ConvocacaoComAtleta extends Convocacao {
  atleta: Pick<Atleta, "id" | "nome" | "modalidade">;
}

export interface ConvocacaoStats {
  total: number;
  pendentes: number;
  aceitos: number;
  recusados: number;
}

export interface AtletaElegivel {
  id: string;
  nome: string;
  modalidade: Modalidade;
  grupo: "mensalista" | "avulso";
  ja_convocado: boolean;
}

export interface FeedItemComConvocacao extends FeedItem {
  convocacao_status?: StatusConvocacao | null;
}
