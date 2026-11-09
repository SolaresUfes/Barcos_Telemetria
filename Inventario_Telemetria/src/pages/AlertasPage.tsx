import { AlertTriangle, CheckCircle2, ShoppingCart } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { Componente } from "../types";
import { statusEstoque } from "../utils/estoque";

export default function AlertasPage() {
  const { alertas, orcamentos } = useData();
  const { user, podeEditar } = useAuth();
  const { toast } = useToast();

  const emFalta = alertas.filter((c) => statusEstoque(c) === "falta");
  const baixos = alertas.filter((c) => statusEstoque(c) === "baixo");

  const jaTemOrcamento = (c: Componente) =>
    orcamentos.itens.some(
      (o) => o.nome.toLowerCase() === c.nome.toLowerCase() && (o.status === "pendente" || o.status === "aprovado"),
    );

  const solicitar = async (c: Componente) => {
    const sugestao = Math.max(1, c.quantidade_minima * 2 - c.quantidade);
    const ok = await orcamentos.criar({
      nome: c.nome,
      tipo: c.tipo,
      quantidade: sugestao,
      preco_unitario: 0,
      status: "pendente",
      estocado: false,
      solicitante_nome: user?.name ?? null,
    });
    if (ok) toast(`Orçamento de ${sugestao}× "${c.nome}" criado. Preencha o preço na aba Orçamento.`);
  };

  const Secao = ({ titulo, itens, cor }: { titulo: string; itens: Componente[]; cor: string }) =>
    itens.length === 0 ? null : (
      <section className="mb-6">
        <h3 className={`mb-3 text-sm font-black uppercase tracking-wider ${cor}`}>
          {titulo} ({itens.length})
        </h3>
        <div className="space-y-2">
          {itens.map((c) => (
            <div
              key={c.id}
              className="card flex flex-col justify-between gap-3 border-red-500/30 p-4 sm:flex-row sm:items-center dark:border-red-500/30"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{c.nome}</span>
                  <StatusBadge status={statusEstoque(c)} />
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {c.tipo} · em estoque: <b>{c.quantidade}</b> / mínimo: <b>{c.quantidade_minima}</b>
                  {c.localizacao ? ` · ${c.localizacao}` : ""}
                </p>
              </div>

              {podeEditar &&
                (jaTemOrcamento(c) ? (
                  <span className="flex shrink-0 items-center text-xs font-bold text-green-600 dark:text-green-400">
                    <CheckCircle2 size={16} className="mr-1" /> Orçamento já solicitado
                  </span>
                ) : (
                  <button onClick={() => void solicitar(c)} className="btn-ghost shrink-0 !py-2 text-xs">
                    <ShoppingCart size={16} /> Solicitar orçamento
                  </button>
                ))}
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={AlertTriangle}
        cor="red"
        titulo="Alertas de Estoque"
        subtitulo="Componentes em falta ou abaixo do mínimo configurado."
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
        {alertas.length === 0 ? (
          <EmptyState icone={CheckCircle2} texto="Tudo certo! Nenhum componente em falta." />
        ) : (
          <>
            <Secao titulo="Em falta" itens={emFalta} cor="text-red-500" />
            <Secao titulo="Estoque baixo" itens={baixos} cor="text-yellow-600 dark:text-yellow-400" />
          </>
        )}
      </div>
    </div>
  );
}
