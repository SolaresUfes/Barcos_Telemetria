import type { NovoComponente } from "../types";
import { TIPOS_COMPONENTE } from "./constants";

// ---------------------------------------------------------------
//  Geração / download
// ---------------------------------------------------------------
export interface Coluna {
  chave: string;
  titulo: string;
}

function escaparCampo(valor: unknown, sep: string): string {
  const s = valor == null ? "" : String(valor);
  const precisaAspas = s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(sep);
  return precisaAspas ? `"${s.replace(/"/g, '""')}"` : s;
}

// Usa ";" por padrão para abrir corretamente no Excel em português
export function gerarCSV(linhas: Record<string, unknown>[], colunas: Coluna[], sep = ";"): string {
  const cabecalho = colunas.map((c) => escaparCampo(c.titulo, sep)).join(sep);
  const corpo = linhas.map((l) => colunas.map((c) => escaparCampo(l[c.chave], sep)).join(sep));
  return [cabecalho, ...corpo].join("\r\n");
}

export function baixarCSV(nomeArquivo: string, conteudo: string) {
  // BOM (﻿) para o Excel reconhecer acentos
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------
//  Leitura (detecta ; , ou tab automaticamente e respeita aspas)
// ---------------------------------------------------------------
export function lerCSV(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primeira = t.split(/\r?\n/)[0] ?? "";
  const sep = [";", ",", "\t"]
    .map((s) => ({ s, n: primeira.split(s).length }))
    .sort((a, b) => b.n - a.n)[0].s;

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

// ---------------------------------------------------------------
//  Interpretação do CSV de componentes
// ---------------------------------------------------------------
export const COLUNAS_COMPONENTES: Coluna[] = [
  { chave: "nome", titulo: "nome" },
  { chave: "tipo", titulo: "tipo" },
  { chave: "quantidade", titulo: "quantidade" },
  { chave: "quantidade_minima", titulo: "quantidade_minima" },
  { chave: "localizacao", titulo: "localizacao" },
  { chave: "descricao", titulo: "descricao" },
  { chave: "outros_tipos", titulo: "outros_tipos" },
  { chave: "datasheet_url", titulo: "datasheet" },
];

/** Campos que o CSV consegue preencher (os demais — imagem, unidades, características — só pelo site). */
export type LinhaImportada = Pick<
  NovoComponente,
  "nome" | "tipo" | "quantidade" | "quantidade_minima" | "localizacao" | "descricao"
> &
  Partial<Pick<NovoComponente, "outros_tipos" | "datasheet_url">>;

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

type CampoCSV = keyof LinhaImportada;

const ALIAS: Record<string, CampoCSV> = {
  nome: "nome",
  componente: "nome",
  item: "nome",
  tipo: "tipo",
  categoria: "tipo",
  quantidade: "quantidade",
  qtd: "quantidade",
  estoque: "quantidade",
  quantidade_minima: "quantidade_minima",
  qtd_minima: "quantidade_minima",
  minimo: "quantidade_minima",
  estoque_minimo: "quantidade_minima",
  localizacao: "localizacao",
  local: "localizacao",
  descricao: "descricao",
  observacao: "descricao",
  outros_tipos: "outros_tipos",
  tipos_extras: "outros_tipos",
  etiquetas: "outros_tipos",
  datasheet: "datasheet_url",
  datasheet_url: "datasheet_url",
};

export interface ResultadoImportacao {
  validos: LinhaImportada[];
  erros: string[];
}

export function interpretarComponentes(matriz: string[][]): ResultadoImportacao {
  if (matriz.length < 2) {
    return { validos: [], erros: ["O arquivo está vazio ou só tem o cabeçalho."] };
  }

  const cabecalho = matriz[0].map((h) => ALIAS[normalizar(h)] ?? null);
  if (!cabecalho.includes("nome")) {
    return { validos: [], erros: ['Coluna "nome" não encontrada no cabeçalho.'] };
  }

  const validos: LinhaImportada[] = [];
  const erros: string[] = [];

  const lerInteiro = (valor: string | undefined, padrao: number): number | null => {
    if (valor == null || valor.trim() === "") return padrao;
    const n = Number(valor.trim().replace(",", "."));
    return Number.isInteger(n) && n >= 0 ? n : null;
  };

  matriz.slice(1).forEach((cols, idx) => {
    const numeroLinha = idx + 2;
    const registro: Partial<Record<CampoCSV, string>> = {};
    cabecalho.forEach((campo, i) => {
      if (campo) registro[campo] = (cols[i] ?? "").trim();
    });

    if (!registro.nome) {
      erros.push(`Linha ${numeroLinha}: nome vazio.`);
      return;
    }
    const quantidade = lerInteiro(registro.quantidade, 0);
    const minima = lerInteiro(registro.quantidade_minima, 0);
    if (quantidade === null || minima === null) {
      erros.push(`Linha ${numeroLinha} (${registro.nome}): quantidade deve ser um número inteiro ≥ 0.`);
      return;
    }

    validos.push({
      nome: registro.nome,
      tipo: registro.tipo || TIPOS_COMPONENTE[TIPOS_COMPONENTE.length - 1],
      quantidade,
      quantidade_minima: minima,
      localizacao: registro.localizacao || null,
      descricao: registro.descricao || null,
      // só inclui se a coluna existe no arquivo (assim não apaga o que já está cadastrado)
      ...(cabecalho.includes("outros_tipos")
        ? {
            outros_tipos: (registro.outros_tipos ?? "")
              .split(/[|,]/)
              .map((t) => t.trim())
              .filter(Boolean),
          }
        : {}),
      ...(cabecalho.includes("datasheet_url") ? { datasheet_url: registro.datasheet_url || null } : {}),
    });
  });

  return { validos, erros };
}
