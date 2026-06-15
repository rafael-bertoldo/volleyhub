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
