import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Componente, DiarioEntry, Emprestimo, MelhorPreco, Orcamento, Unidade } from "../types";
import { agruparPor } from "../utils/componente";
import { statusEstoque } from "../utils/estoque";
import { useTabela, type Tabela } from "./useTabela";

interface DataCtx {
  componentes: Tabela<Componente>;
  diario: Tabela<DiarioEntry>;
  orcamentos: Tabela<Orcamento>;
  unidades: Tabela<Unidade>;
  emprestimos: Tabela<Emprestimo>;
  precos: Tabela<MelhorPreco>;
  unidadesPorComponente: Map<number, Unidade[]>;
  emprestimosPorComponente: Map<number, Emprestimo[]>;
  alertas: Componente[]; // itens em falta ou com estoque baixo
}

const Ctx = createContext<DataCtx | null>(null);

/** Carrega os dados uma única vez e compartilha entre todas as abas. */
export function DataProvider({ children }: { children: ReactNode }) {
  const componentes = useTabela<Componente>("componentes", "nome", true);
  const diario = useTabela<DiarioEntry>("diario", "created_at", false);
  const orcamentos = useTabela<Orcamento>("orcamentos", "created_at", false);

  const unidades = useTabela<Unidade>("unidades", "id", true);
  const emprestimos = useTabela<Emprestimo>("emprestimos", "created_at", false);
  const precos = useTabela<MelhorPreco>("melhores_precos", "created_at", false);

  const unidadesPorComponente = useMemo(() => agruparPor(unidades.itens, (u) => u.componente_id), [unidades.itens]);
  const emprestimosPorComponente = useMemo(
    () => agruparPor(emprestimos.itens, (e) => e.componente_id),
    [emprestimos.itens],
  );

  const alertas = useMemo(
    () => componentes.itens.filter((c) => statusEstoque(c) !== "ok"),
    [componentes.itens],
  );

  return <Ctx.Provider value={{
        componentes,
        diario,
        orcamentos,
        unidades,
        emprestimos,
        precos,
        unidadesPorComponente,
        emprestimosPorComponente,
        alertas,
      }}>{children}</Ctx.Provider>;
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData precisa estar dentro de <DataProvider>");
  return ctx;
}
