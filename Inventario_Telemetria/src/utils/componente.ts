import type { Componente, Emprestimo, EstadoUnidade, NovoComponente, Unidade } from "../types";

export const ESTADOS: EstadoUnidade[] = ["bom", "duvidoso", "ruim"];

export const ESTILO_ESTADO: Record<EstadoUnidade, { label: string; badge: string; text: string; dot: string }> = {
  bom: {
    label: "Bom",
    badge: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  duvidoso: {
    label: "Duvidoso",
    badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    text: "text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  ruim: {
    label: "Ruim",
    badge: "bg-red-500/15 text-red-500 border-red-500/30",
    text: "text-red-500",
    dot: "bg-red-500",
  },
};

export interface ResumoUnidades {
  total: number;
  padrao: number; // unidades sem linha própria
  especificas: number;
  bom: number;
  duvidoso: number;
  ruim: number;
}

/** Junta unidades padrão (contadores) + específicas (uma a uma) numa contagem só. */
export function resumirUnidades(c: Componente, unidades: Unidade[]): ResumoUnidades {
  const especificas = unidades.length;
  const padrao = Math.max(0, c.quantidade - especificas);
  const duvPadrao = Math.min(c.qtd_duvidoso, padrao);
  const ruimPadrao = Math.min(c.qtd_ruim, padrao - duvPadrao);
  const bomPadrao = padrao - duvPadrao - ruimPadrao;
  const cont = (e: EstadoUnidade) => unidades.filter((u) => u.estado === e).length;
  return {
    total: c.quantidade,
    padrao,
    especificas,
    bom: bomPadrao + cont("bom"),
    duvidoso: duvPadrao + cont("duvidoso"),
    ruim: ruimPadrao + cont("ruim"),
  };
}

export interface ResumoEmprestimo {
  emprestado: number; // unidades fora do galpão agora
  disponivel: number;
  pessoas: string[];
  solicitacoes: number;
}

export function resumirEmprestimos(c: Componente, emprestimos: Emprestimo[]): ResumoEmprestimo {
  const ativos = emprestimos.filter((e) => e.status === "emprestado");
  const emprestado = ativos.reduce((s, e) => s + e.quantidade, 0);
  return {
    emprestado,
    disponivel: Math.max(0, c.quantidade - emprestado),
    pessoas: Array.from(new Set(ativos.map((e) => e.pessoa_nome))),
    solicitacoes: emprestimos.filter((e) => e.status === "solicitado").length,
  };
}

/** Todos os tipos de um componente (principal + extras). */
export const tiposDe = (c: Pick<Componente, "tipo" | "outros_tipos">) => [c.tipo, ...(c.outros_tipos ?? [])];

export function agruparPor<T>(itens: T[], chave: (i: T) => number | null): Map<number, T[]> {
  const mapa = new Map<number, T[]>();
  for (const i of itens) {
    const k = chave(i);
    if (k == null) continue;
    const lista = mapa.get(k);
    if (lista) lista.push(i);
    else mapa.set(k, [i]);
  }
  return mapa;
}

/** Cria um componente novo com todos os campos novos preenchidos com o padrão. */
export function novoComponente(base: Pick<NovoComponente, "nome"> & Partial<NovoComponente>): NovoComponente {
  return {
    tipo: "Outro",
    outros_tipos: [],
    quantidade: 0,
    quantidade_minima: 0,
    localizacao: null,
    descricao: null,
    descricao_completa: null,
    datasheet_url: null,
    imagem_url: null,
    caracteristicas: [],
    qtd_duvidoso: 0,
    qtd_ruim: 0,
    ...base,
  };
}

/** Componentes que têm pelo menos um dos tipos escolhidos (lista vazia = todos). */
export function selecionarComponentes(componentes: Componente[], tipos: string[]): Componente[] {
  if (tipos.length === 0) return componentes;
  return componentes.filter((c) => tiposDe(c).some((t) => tipos.includes(t)));
}
