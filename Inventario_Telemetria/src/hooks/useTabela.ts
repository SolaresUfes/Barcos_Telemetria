import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./useToast";

export interface Tabela<T extends { id: number }> {
  itens: T[];
  loading: boolean;
  carregar: () => Promise<void>;
  criar: (dados: Partial<Omit<T, "id">>) => Promise<boolean>;
  /** Cria e devolve a linha criada (com o id), ou null se deu erro. */
  criarRetornando: (dados: Partial<Omit<T, "id">>) => Promise<T | null>;
  criarVarios: (linhas: Partial<Omit<T, "id">>[]) => Promise<boolean>;
  atualizar: (id: number, dados: Partial<Omit<T, "id">>) => Promise<boolean>;
  remover: (id: number) => Promise<boolean>;
}

/** Hook genérico de CRUD para uma tabela do Supabase. */
export function useTabela<T extends { id: number }>(tabela: string, colunaOrdem: string, asc = true): Tabela<T> {
  const { toast } = useToast();
  const [itens, setItens] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from(tabela).select("*").order(colunaOrdem, { ascending: asc });
    if (error) toast(`Erro ao carregar "${tabela}": ${error.message}`, "erro");
    else setItens((data ?? []) as T[]);
    setLoading(false);
  }, [tabela, colunaOrdem, asc, toast]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const executar = async (promessa: PromiseLike<{ error: { message: string } | null }>, msgErro: string) => {
    const { error } = await promessa;
    if (error) {
      toast(`${msgErro}: ${error.message}`, "erro");
      return false;
    }
    await carregar();
    return true;
  };

  const criar: Tabela<T>["criar"] = (dados) =>
    executar(supabase.from(tabela).insert([dados] as never), "Erro ao salvar");
  const criarRetornando: Tabela<T>["criarRetornando"] = async (dados) => {
    const { data, error } = await supabase.from(tabela).insert([dados] as never).select().single();
    if (error) {
      toast(`Erro ao salvar: ${error.message}`, "erro");
      return null;
    }
    await carregar();
    return data as T;
  };
  const criarVarios: Tabela<T>["criarVarios"] = (linhas) =>
    executar(supabase.from(tabela).insert(linhas as never), "Erro ao salvar");
  const atualizar: Tabela<T>["atualizar"] = (id, dados) =>
    executar(supabase.from(tabela).update(dados as never).eq("id", id), "Erro ao atualizar");
  const remover: Tabela<T>["remover"] = (id) =>
    executar(supabase.from(tabela).delete().eq("id", id), "Erro ao apagar");

  return { itens, loading, carregar, criar, criarRetornando, criarVarios, atualizar, remover };
}
