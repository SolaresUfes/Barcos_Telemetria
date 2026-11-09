import { jsPDF } from "jspdf";
import autoTable, { type CellDef, type RowInput } from "jspdf-autotable";
import type { Componente, Emprestimo, Orcamento, OrcamentoStatus, Unidade } from "../types";
import { resumirEmprestimos, resumirUnidades, selecionarComponentes } from "./componente";
import { statusEstoque } from "./estoque";
import { formatarMoeda, plural } from "./format";

// ---------- visual compartilhado (inventário e orçamento) ----------
const LARANJA: [number, number, number] = [249, 115, 22];
const LARANJA_CLARO: [number, number, number] = [255, 237, 213];
const LARANJA_ESCURO: [number, number, number] = [194, 65, 12];
const VERMELHO: [number, number, number] = [220, 38, 38];
const AMARELO: [number, number, number] = [202, 138, 4];
const CINZA: [number, number, number] = [150, 150, 150];

/** As fontes padrão do PDF só têm letras latinas/acentos: troca o resto por equivalentes simples. */
export function textoPdf(t: string | null | undefined): string {
  return (t ?? "")
    .replace(/Ω/g, "ohm")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/→/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[•·]/g, "-")
    .replace(/[^\u0000-ÿ]/g, "?");
}

function cabecalho(titulo: string, linhas: string[]): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...LARANJA);
  doc.text(textoPdf(titulo), 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  linhas.forEach((l, i) => doc.text(textoPdf(l), 14, 24 + i * 4.5));
  return doc;
}

const estiloTabela = (doc: jsPDF, inicioY: number) => ({
  startY: inicioY,
  theme: "plain" as const,
  styles: { fontSize: 7.5, cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, textColor: 60, lineColor: [235, 235, 235] as [number, number, number], lineWidth: { bottom: 0.15 } },
  headStyles: { fillColor: LARANJA, textColor: 255, fontStyle: "bold" as const, lineWidth: 0 },
  margin: { left: 14, right: 14, bottom: 14 },
  didDrawPage: () => {
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
  },
});

const linhaGrupo = (texto: string, colunas: number): RowInput => [
  {
    content: textoPdf(texto),
    colSpan: colunas,
    styles: { fillColor: LARANJA_CLARO, textColor: LARANJA_ESCURO, fontStyle: "bold", fontSize: 8, lineWidth: 0 },
  },
];

const dataHora = () => new Date().toLocaleString("pt-BR");

// ---------- inventário ----------
export interface OpcoesPdf {
  /** tipos escolhidos (principal OU extras, ex: "Básico"). Vazio = todos */
  tipos: string[];
  mostrarEstado: boolean;
  mostrarEmprestimo: boolean;
  mostrarLocalizacao: boolean;
  mostrarDescricao: boolean;
}

interface Dados {
  componentes: Componente[];
  unidadesPorComponente: Map<number, Unidade[]>;
  emprestimosPorComponente: Map<number, Emprestimo[]>;
}

export function gerarPdfInventario(dados: Dados, opcoes: OpcoesPdf): jsPDF {
  const itens = selecionarComponentes(dados.componentes, opcoes.tipos);
  const totalUnidades = itens.reduce((s, c) => s + c.quantidade, 0);

  const doc = cabecalho("Inventário Solares", [
    `Gerado em ${dataHora()} - ${plural(itens.length, "componente", "componentes")} - ${plural(totalUnidades, "unidade", "unidades")}`,
    opcoes.tipos.length ? `Tipos: ${opcoes.tipos.join(", ")}` : "Todos os tipos",
  ]);

  const colunas = ["Componente", "Tipo", "Tags", "Qtd", "Mín"];
  if (opcoes.mostrarEstado) colunas.push("Bom", "Duv.", "Ruim");
  if (opcoes.mostrarEmprestimo) colunas.push("Empr.");
  if (opcoes.mostrarLocalizacao) colunas.push("Local");
  if (opcoes.mostrarDescricao) colunas.push("Descrição");

  const grupos = new Map<string, Componente[]>();
  for (const c of itens) grupos.set(c.tipo, [...(grupos.get(c.tipo) ?? []), c]);

  const numero = (v: number, cor?: [number, number, number]): CellDef => ({
    content: v > 0 || !cor ? String(v) : "-",
    styles: { halign: "center", ...(cor && v > 0 ? { textColor: cor } : cor ? { textColor: CINZA } : {}) },
  });

  const corpo: RowInput[] = [];
  for (const tipo of Array.from(grupos.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"))) {
    const lista = grupos.get(tipo)!.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    corpo.push(linhaGrupo(`${tipo}  (${plural(lista.length, "item", "itens")})`, colunas.length));
    for (const c of lista) {
      const r = resumirUnidades(c, dados.unidadesPorComponente.get(c.id) ?? []);
      const emp = resumirEmprestimos(c, dados.emprestimosPorComponente.get(c.id) ?? []);
      const linha: RowInput = [
        textoPdf(c.nome),
        textoPdf(c.tipo),
        textoPdf((c.outros_tipos ?? []).join(", ")),
        { content: String(c.quantidade), styles: { halign: "center", textColor: statusEstoque(c) !== "ok" ? VERMELHO : 60 } },
        numero(c.quantidade_minima),
      ];
      if (opcoes.mostrarEstado) linha.push(numero(r.bom), numero(r.duvidoso, AMARELO), numero(r.ruim, VERMELHO));
      if (opcoes.mostrarEmprestimo) linha.push(numero(emp.emprestado, [37, 99, 235]));
      if (opcoes.mostrarLocalizacao) linha.push(textoPdf(c.localizacao));
      if (opcoes.mostrarDescricao) linha.push(textoPdf(c.descricao_completa || c.descricao));
      corpo.push(linha);
    }
  }

  if (itens.length === 0) corpo.push([{ content: "Nenhum componente com os tipos escolhidos.", colSpan: colunas.length }]);

  autoTable(doc, {
    ...estiloTabela(doc, 33),
    head: [colunas],
    body: corpo,
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 48 } },
  });
  return doc;
}

// ---------- orçamento ----------
export interface OpcoesPdfOrcamento {
  status: OrcamentoStatus[];
}

const NOME_STATUS: Record<OrcamentoStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  comprado: "Comprado",
  recusado: "Recusado",
};

const hostDe = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function gerarPdfOrcamento(itens: Orcamento[], opcoes: OpcoesPdfOrcamento): jsPDF {
  const lista = itens.filter((o) => opcoes.status.includes(o.status));
  const total = (l: Orcamento[]) => l.reduce((s, o) => s + o.quantidade * Number(o.preco_unitario), 0);

  const doc = cabecalho("Orçamento - Inventário Solares", [
    `Gerado em ${dataHora()} - ${plural(lista.length, "item", "itens")} - Total ${formatarMoeda(total(lista))}`,
    `Status: ${opcoes.status.map((s) => NOME_STATUS[s]).join(", ")}`,
  ]);

  const colunas = ["Componente", "Tipo", "Qtd", "Preço unit.", "Total", "Fornecedor", "Link", "Solicitante"];
  const COL_LINK = 6;
  const links = new Map<string, string>(); // "linha" -> url (para tornar o texto clicável)

  const corpo: RowInput[] = [];
  const ordem: OrcamentoStatus[] = ["pendente", "aprovado", "comprado", "recusado"];
  for (const status of ordem.filter((s) => opcoes.status.includes(s))) {
    const grupo = lista.filter((o) => o.status === status).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    if (grupo.length === 0) continue;
    corpo.push(linhaGrupo(`${NOME_STATUS[status]}  (${plural(grupo.length, "item", "itens")})  -  ${formatarMoeda(total(grupo))}`, colunas.length));
    for (const o of grupo) {
      if (o.link) links.set(`${corpo.length}`, o.link);
      corpo.push([
        { content: textoPdf(o.nome), styles: { fontStyle: "bold" } },
        textoPdf(o.tipo),
        { content: String(o.quantidade), styles: { halign: "center" } },
        { content: formatarMoeda(Number(o.preco_unitario)), styles: { halign: "right" } },
        { content: formatarMoeda(o.quantidade * Number(o.preco_unitario)), styles: { halign: "right", fontStyle: "bold" } },
        textoPdf(o.fornecedor),
        { content: o.link ? textoPdf(hostDe(o.link)) : "", styles: { textColor: [37, 99, 235] } },
        textoPdf(o.solicitante_nome),
      ]);
    }
  }

  if (lista.length === 0) {
    corpo.push([{ content: "Nenhum item com os status escolhidos.", colSpan: colunas.length }]);
  } else {
    corpo.push([
      { content: "TOTAL GERAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: LARANJA_CLARO, textColor: LARANJA_ESCURO } },
      { content: formatarMoeda(total(lista)), styles: { halign: "right", fontStyle: "bold", fillColor: LARANJA_CLARO, textColor: LARANJA_ESCURO } },
      { content: "", colSpan: 3, styles: { fillColor: LARANJA_CLARO } },
    ]);
  }

  autoTable(doc, {
    ...estiloTabela(doc, 33),
    head: [colunas],
    body: corpo,
    columnStyles: { 0: { cellWidth: 60 }, 2: { cellWidth: 14 } },
    didDrawCell: (d) => {
      if (d.section === "body" && d.column.index === COL_LINK) {
        const url = links.get(String(d.row.index));
        if (url) doc.link(d.cell.x, d.cell.y, d.cell.width, d.cell.height, { url });
      }
    },
  });
  return doc;
}
