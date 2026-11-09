export interface Member {
  id: number;
  email: string;
  name: string;
  mainRole: string; // '', 'Trainee' ou 'Membro'
  isModerador: boolean;
  photo: string;
}

export interface Caracteristica {
  chave: string;
  valor: string;
}

export interface Componente {
  id: number;
  nome: string;
  tipo: string;
  outros_tipos: string[]; // tipos extras (ex: "Básico")
  quantidade: number; // total possuído (unidades padrão + específicas)
  quantidade_minima: number;
  localizacao: string | null;
  descricao: string | null; // resumo curto (aparece no card da lista)
  descricao_completa: string | null; // texto longo (só no detalhe)
  datasheet_url: string | null;
  imagem_url: string | null; // só aparece no detalhe
  caracteristicas: Caracteristica[]; // características das unidades padrão
  qtd_duvidoso: number; // das unidades padrão
  qtd_ruim: number; // das unidades padrão
  created_at: string;
}

export type NovoComponente = Omit<Componente, "id" | "created_at">;

export type EstadoUnidade = "bom" | "duvidoso" | "ruim";

export interface Unidade {
  id: number;
  componente_id: number;
  rotulo: string;
  estado: EstadoUnidade;
  caracteristicas: Caracteristica[];
  observacao: string | null;
  created_at: string;
}

export type EmprestimoStatus = "solicitado" | "emprestado" | "devolvido" | "recusado";

export interface Emprestimo {
  id: number;
  componente_id: number | null;
  componente_nome: string;
  quantidade: number;
  unidade_ids: number[];
  pessoa_nome: string;
  solicitante_nome: string | null;
  solicitante_email: string | null;
  observacao: string | null;
  status: EmprestimoStatus;
  previsao_devolucao: string | null;
  emprestado_em: string | null;
  devolvido_em: string | null;
  created_at: string;
}

export interface MelhorPreco {
  id: number;
  componente_nome: string;
  loja: string;
  preco_unitario: number;
  link: string | null;
  data_compra: string | null;
  observacao: string | null;
  autor_nome: string | null;
  created_at: string;
}

export type DiarioTipo = "falha" | "perda" | "observacao";

export interface DiarioEntry {
  id: number;
  titulo: string;
  texto: string;
  tipo: DiarioTipo;
  componente_id: number | null;
  componente_nome: string | null;
  quantidade_afetada: number;
  autor_nome: string | null;
  autor_email: string | null;
  autor_foto: string | null;
  created_at: string;
}

export type OrcamentoStatus = "pendente" | "aprovado" | "comprado" | "recusado";

export interface Orcamento {
  id: number;
  nome: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  fornecedor: string | null;
  link: string | null;
  status: OrcamentoStatus;
  estocado: boolean;
  solicitante_nome: string | null;
  created_at: string;
}

export type StatusEstoque = "falta" | "baixo" | "ok";
