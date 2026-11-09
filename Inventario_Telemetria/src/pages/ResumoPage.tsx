import { AlertTriangle, BookOpen, Boxes, HandCoins, LayoutDashboard, PackageX, Wallet } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import type { TabId } from "../config/tabs";
import { useData } from "../hooks/useData";
import { formatarData, formatarMoeda } from "../utils/format";
import { statusEstoque } from "../utils/estoque";

export default function ResumoPage({ onIrPara }: { onIrPara: (aba: TabId) => void }) {
  const { componentes, diario, orcamentos, emprestimos, alertas } = useData();

  if (componentes.loading) return <Spinner />;

  const totalUnidades = componentes.itens.reduce((s, c) => s + c.quantidade, 0);
  const emFalta = alertas.filter((c) => statusEstoque(c) === "falta").length;
  const baixos = alertas.length - emFalta;

  const orcamentoPendente = orcamentos.itens
    .filter((o) => o.status === "pendente" || o.status === "aprovado")
    .reduce((s, o) => s + o.quantidade * Number(o.preco_unitario), 0);

  const emprestadas = emprestimos.itens.filter((e) => e.status === "emprestado").reduce((s, e) => s + e.quantidade, 0);
  const pedidos = emprestimos.itens.filter((e) => e.status === "solicitado").length;

  const porTipo = Object.entries(
    componentes.itens.reduce<Record<string, number>>((acc, c) => {
      acc[c.tipo] = (acc[c.tipo] ?? 0) + c.quantidade;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maiorTipo = Math.max(1, ...porTipo.map(([, q]) => q));

  const cards = [
    { label: "Tipos de itens", valor: componentes.itens.length, icone: Boxes, cor: "text-blue-500" },
    { label: "Unidades totais", valor: totalUnidades, icone: Boxes, cor: "text-emerald-500" },
    { label: "Em falta", valor: emFalta, icone: PackageX, cor: emFalta > 0 ? "text-red-500" : "text-gray-500" },
    { label: "Estoque baixo", valor: baixos, icone: AlertTriangle, cor: baixos > 0 ? "text-yellow-500" : "text-gray-500" },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col overflow-y-auto pr-1">
      <PageHeader
        icone={LayoutDashboard}
        cor="orange"
        titulo="Resumo"
        subtitulo="Visão geral do material disponível no galpão."
      />

      {alertas.length > 0 && (
        <button
          onClick={() => onIrPara("Alertas")}
          className="mb-4 flex w-full items-center rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-left transition-all hover:scale-[1.01]"
        >
          <AlertTriangle className="mr-3 shrink-0 text-red-500" size={24} />
          <div>
            <p className="font-bold text-red-500">
              {alertas.length} {alertas.length === 1 ? "componente precisa" : "componentes precisam"} de atenção
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {emFalta} em falta · {baixos} com estoque baixo. Clique para ver.
            </p>
          </div>
        </button>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {cards.map(({ label, valor, icone: Icone, cor }) => (
          <div key={label} className="card p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 md:text-xs">{label}</h3>
              <Icone size={18} className={cor} />
            </div>
            <span className={`text-3xl font-black tabular-nums md:text-4xl ${cor}`}>{valor}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 flex items-center font-bold">
            <Boxes size={18} className="mr-2 text-orange-500" /> Unidades por tipo
          </h3>
          {porTipo.length === 0 ? (
            <p className="text-sm text-gray-500">Sem dados ainda.</p>
          ) : (
            <div className="space-y-3">
              {porTipo.map(([tipo, qtd]) => (
                <div key={tipo}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{tipo}</span>
                    <span className="tabular-nums text-gray-500">{qtd}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{ width: `${(qtd / maiorTipo) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={() => onIrPara("Orçamento")} className="card p-5 text-left transition-all hover:scale-[1.01]">
            <h3 className="mb-1 flex items-center font-bold">
              <Wallet size={18} className="mr-2 text-emerald-500" /> Orçamento em aberto
            </h3>
            <p className="text-xs text-gray-500">Pendente + aprovado, ainda não comprado.</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-emerald-500">{formatarMoeda(orcamentoPendente)}</p>
          </button>

          <button onClick={() => onIrPara("Empréstimos")} className="card p-5 text-left transition-all hover:scale-[1.01]">
            <h3 className="mb-1 flex items-center font-bold">
              <HandCoins size={18} className="mr-2 text-blue-500" /> Empréstimos
            </h3>
            <p className="text-xs text-gray-500">
              {pedidos > 0 ? `${pedidos} pedido(s) aguardando resposta.` : "Nenhum pedido aguardando."}
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-blue-500">
              {emprestadas} <span className="text-sm font-bold text-gray-500">unidades emprestadas</span>
            </p>
          </button>

          <div className="card flex-1 p-5">
            <h3 className="mb-3 flex items-center font-bold">
              <BookOpen size={18} className="mr-2 text-purple-500" /> Últimas anotações
            </h3>
            {diario.itens.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma anotação no diário ainda.</p>
            ) : (
              <ul className="space-y-2">
                {diario.itens.slice(0, 4).map((d) => (
                  <li key={d.id} className="border-b border-gray-200 pb-2 last:border-0 dark:border-gray-700">
                    <button onClick={() => onIrPara("Diário de Bordo")} className="w-full text-left">
                      <p className="truncate text-sm font-bold">{d.titulo}</p>
                      <p className="text-[11px] text-gray-500">
                        {d.autor_nome} · {formatarData(d.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
