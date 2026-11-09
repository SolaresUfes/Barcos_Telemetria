export const TIPOS_COMPONENTE = [
  "Microcontrolador",
  "Sensor",
  "Módulo",
  "Bateria",
  "Conversor / Regulador",
  "Resistor",
  "Capacitor",
  "Semicondutor",
  "Cabo / Conector",
  "Display",
  "Ferramenta",
  "Outro",
];

export const CARGOS = ["Trainee", "Membro"] as const;

export const STATUS_ORCAMENTO = ["pendente", "aprovado", "comprado", "recusado"] as const;

export const TIPOS_DIARIO = [
  { id: "falha", label: "Falha" },
  { id: "perda", label: "Perda" },
  { id: "observacao", label: "Observação" },
] as const;

/** Tipos extras sugeridos (um componente pode ter o tipo principal + vários destes). */
export const TIPOS_EXTRAS_SUGERIDOS = ["Básico"];

/** Sugestões de nomes de características (campo livre, é só para facilitar a digitação). */
export const SUGESTOES_CARACTERISTICAS = [
  "Conector",
  "Tensão",
  "Corrente",
  "Encapsulamento",
  "Cor",
  "Valor",
  "Versão",
  "Chip",
  "Frequência",
  "Fabricante",
];

export const OPCOES_ORDENACAO = [
  { id: "nome-asc", label: "Nome (A → Z)" },
  { id: "nome-desc", label: "Nome (Z → A)" },
  { id: "qtd-desc", label: "Quantidade (maior primeiro)" },
  { id: "qtd-asc", label: "Quantidade (menor primeiro)" },
  { id: "recentes", label: "Mais recentes" },
] as const;
export type OrdenacaoId = (typeof OPCOES_ORDENACAO)[number]["id"];
