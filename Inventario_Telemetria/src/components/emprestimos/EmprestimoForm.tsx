import { useMemo, useState } from "react";
import type { Componente, Emprestimo } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../hooks/useData";
import { useToast } from "../../hooks/useToast";
import { ESTILO_ESTADO } from "../../utils/componente";
import Modal from "../ui/Modal";

export type ModoEmprestimo = "solicitar" | "emprestar" | "entregar";

interface Props {
  modo: ModoEmprestimo;
  /** null quando o componente do pedido já foi apagado do inventário */
  componente: Componente | null;
  existente?: Emprestimo;
  onFechar: () => void;
}

const TITULOS: Record<ModoEmprestimo, string> = {
  solicitar: "Pedir emprestado",
  emprestar: "Registrar empréstimo",
  entregar: "Registrar entrega",
};

export default function EmprestimoForm({ modo, componente, existente, onFechar }: Props) {
  const { emprestimos, emprestimosPorComponente, unidadesPorComponente } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [pessoa, setPessoa] = useState(existente?.pessoa_nome ?? (modo === "solicitar" ? user?.name ?? "" : ""));
  const [quantidade, setQuantidade] = useState(String(existente?.quantidade ?? 1));
  const [previsao, setPrevisao] = useState(existente?.previsao_devolucao ?? "");
  const [observacao, setObservacao] = useState(existente?.observacao ?? "");
  const [escolhidas, setEscolhidas] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);

  // ---------- disponibilidade ----------
  const disp = useMemo(() => {
    if (!componente) return null;
    const ativos = (emprestimosPorComponente.get(componente.id) ?? []).filter(
      (e) => e.status === "emprestado" && e.id !== existente?.id,
    );
    const emprestado = ativos.reduce((s, e) => s + e.quantidade, 0);
    const idsEmprestados = new Set(ativos.flatMap((e) => e.unidade_ids));
    const especificas = unidadesPorComponente.get(componente.id) ?? [];
    const padrao = Math.max(0, componente.quantidade - especificas.length);
    const padraoEmprestado = ativos.reduce((s, e) => s + Math.max(0, e.quantidade - e.unidade_ids.length), 0);
    return {
      disponivel: Math.max(0, componente.quantidade - emprestado),
      padraoLivre: Math.max(0, padrao - padraoEmprestado),
      especificasLivres: especificas.filter((u) => !idsEmprestados.has(u.id)),
    };
  }, [componente, emprestimosPorComponente, unidadesPorComponente, existente?.id]);

  const qtd = Math.max(0, parseInt(quantidade) || 0);
  const escolherUnidades = modo !== "solicitar" && !!disp && disp.especificasLivres.length > 0;
  const limite = modo === "solicitar" ? componente?.quantidade ?? 99999 : disp?.disponivel ?? 99999;

  const validar = (): string | null => {
    if (!pessoa.trim()) return "Informe quem vai ficar com o componente.";
    if (qtd < 1) return "A quantidade precisa ser pelo menos 1.";
    if (componente && qtd > limite) {
      return modo === "solicitar"
        ? `Só existem ${componente.quantidade} no inventário.`
        : `Só ${limite} disponível(is) agora (o resto já está emprestado).`;
    }
    if (modo !== "solicitar" && disp) {
      if (escolhidas.length > qtd) return "Você marcou mais unidades específicas do que a quantidade.";
      if (qtd - escolhidas.length > disp.padraoLivre) {
        return escolhidas.length === 0 && disp.especificasLivres.length > 0
          ? "Marque quais unidades específicas serão emprestadas."
          : "Faltam unidades: marque mais unidades específicas ou diminua a quantidade.";
      }
    }
    return null;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validar();
    if (problema) return toast(problema, "aviso");
    setSalvando(true);

    const agora = new Date().toISOString();
    const comum = {
      quantidade: qtd,
      pessoa_nome: pessoa.trim(),
      observacao: observacao.trim() || null,
      previsao_devolucao: previsao || null,
    };

    let ok: boolean;
    if (modo === "entregar" && existente) {
      ok = await emprestimos.atualizar(existente.id, {
        ...comum,
        unidade_ids: escolhidas,
        status: "emprestado",
        emprestado_em: agora,
      });
    } else {
      ok = await emprestimos.criar({
        ...comum,
        componente_id: componente?.id ?? null,
        componente_nome: componente?.nome ?? "",
        solicitante_nome: user?.name ?? null,
        solicitante_email: user?.email ?? null,
        unidade_ids: modo === "emprestar" ? escolhidas : [],
        status: modo === "solicitar" ? "solicitado" : "emprestado",
        emprestado_em: modo === "solicitar" ? null : agora,
      });
    }
    setSalvando(false);
    if (ok) {
      toast(
        modo === "solicitar"
          ? "Pedido enviado! Ele aparece na aba Empréstimos."
          : "Empréstimo registrado!",
      );
      onFechar();
    }
  };

  const nomeComponente = componente?.nome ?? existente?.componente_nome ?? "";

  return (
    <Modal titulo={`${TITULOS[modo]}${nomeComponente ? ` — ${nomeComponente}` : ""}`} onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        {componente && (
          <p className="rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
            No inventário: <b>{componente.quantidade}</b> · disponíveis agora: <b>{disp?.disponivel ?? 0}</b>
          </p>
        )}

        <div>
          <label className="label">{modo === "solicitar" ? "Quem vai pegar *" : "Com quem fica *"}</label>
          <input
            className="input"
            required
            autoFocus
            placeholder="Nome da pessoa"
            value={pessoa}
            onChange={(e) => setPessoa(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantidade</label>
            <input
              className="input"
              type="number"
              min={1}
              max={limite}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Devolver até (opcional)</label>
            <input className="input" type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
          </div>
        </div>

        {escolherUnidades && disp && (
          <div>
            <label className="label">Unidades específicas (opcional)</label>
            <p className="mb-2 text-xs text-gray-500">
              {disp.padraoLivre > 0
                ? `As demais saem das ${disp.padraoLivre} unidades padrão livres.`
                : "Não há unidades padrão livres: marque exatamente as que serão emprestadas."}
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
              {disp.especificasLivres.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={escolhidas.includes(u.id)}
                    onChange={(e) =>
                      setEscolhidas(e.target.checked ? [...escolhidas, u.id] : escolhidas.filter((x) => x !== u.id))
                    }
                    className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="font-semibold">{u.rotulo}</span>
                  <span className={`text-[10px] font-black uppercase ${ESTILO_ESTADO[u.estado].text}`}>
                    {ESTILO_ESTADO[u.estado].label}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {u.caracteristicas.map((c) => c.valor).filter(Boolean).join(" · ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Observação / para que vai usar</label>
          <textarea className="input resize-none" rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onFechar} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="btn-primary flex-1">
            {salvando ? "Salvando..." : modo === "solicitar" ? "Enviar pedido" : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
