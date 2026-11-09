import { useMemo, useState } from "react";
import { Check, HandCoins, Plus, Search, Trash2, Undo2, X } from "lucide-react";
import EmprestimoForm from "../components/emprestimos/EmprestimoForm";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { Componente, Emprestimo, EmprestimoStatus } from "../types";
import { formatarData } from "../utils/format";

type Aba = "solicitacoes" | "emprestados" | "historico";

const dataCurta = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "");
const atrasado = (e: Emprestimo) =>
  e.status === "emprestado" && !!e.previsao_devolucao && e.previsao_devolucao < new Date().toISOString().slice(0, 10);

const COR_STATUS: Record<EmprestimoStatus, string> = {
  solicitado: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  emprestado: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  devolvido: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  recusado: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

export default function EmprestimosPage() {
  const { emprestimos, componentes, unidades } = useData();
  const { user, podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [aba, setAba] = useState<Aba>("solicitacoes");
  const [busca, setBusca] = useState("");
  const [entregando, setEntregando] = useState<Emprestimo | null>(null);
  const [escolhendo, setEscolhendo] = useState(false);
  const [novoPara, setNovoPara] = useState<Componente | null>(null);
  const [selecionado, setSelecionado] = useState("");

  const porComponente = (id: number | null) => (id == null ? null : componentes.itens.find((c) => c.id === id) ?? null);

  const grupos = useMemo(
    () => ({
      solicitacoes: emprestimos.itens.filter((e) => e.status === "solicitado"),
      emprestados: emprestimos.itens.filter((e) => e.status === "emprestado"),
      historico: emprestimos.itens.filter((e) => e.status === "devolvido" || e.status === "recusado"),
    }),
    [emprestimos.itens],
  );

  const pessoasComItens = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const e of grupos.emprestados) mapa.set(e.pessoa_nome, (mapa.get(e.pessoa_nome) ?? 0) + e.quantidade);
    return Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
  }, [grupos.emprestados]);

  const termo = busca.trim().toLowerCase();
  const lista = grupos[aba].filter(
    (e) =>
      !termo ||
      [e.componente_nome, e.pessoa_nome, e.solicitante_nome, e.observacao].some((v) => v?.toLowerCase().includes(termo)),
  );

  const rotulosUnidades = (e: Emprestimo) =>
    e.unidade_ids
      .map((id) => unidades.itens.find((u) => u.id === id)?.rotulo)
      .filter(Boolean)
      .join(", ");

  // ---------- ações ----------
  const devolver = async (e: Emprestimo) => {
    if (await emprestimos.atualizar(e.id, { status: "devolvido", devolvido_em: new Date().toISOString() }))
      toast(`Devolução de "${e.componente_nome}" registrada!`);
  };
  const recusar = async (e: Emprestimo) => {
    if (!window.confirm(`Recusar o pedido de ${e.pessoa_nome}?`)) return;
    if (await emprestimos.atualizar(e.id, { status: "recusado" })) toast("Pedido recusado.", "aviso");
  };
  const apagar = async (e: Emprestimo, msg: string) => {
    if (!window.confirm(msg)) return;
    if (await emprestimos.remover(e.id)) toast("Registro removido.", "aviso");
  };

  const emailMeu = user?.email.toLowerCase();
  const ehMeuPedido = (e: Emprestimo) => e.status === "solicitado" && e.solicitante_email?.toLowerCase() === emailMeu;

  const resumo = [
    { label: "Unidades emprestadas", valor: grupos.emprestados.reduce((s, e) => s + e.quantidade, 0), cor: "text-blue-500" },
    { label: "Pessoas com itens", valor: pessoasComItens.length, cor: "text-purple-500" },
    { label: "Pedidos aguardando", valor: grupos.solicitacoes.length, cor: grupos.solicitacoes.length ? "text-yellow-500" : "text-gray-500" },
    { label: "Atrasados", valor: grupos.emprestados.filter(atrasado).length, cor: grupos.emprestados.some(atrasado) ? "text-red-500" : "text-gray-500" },
  ];

  const abas: { id: Aba; label: string }[] = [
    { id: "solicitacoes", label: "Solicitações" },
    { id: "emprestados", label: "Emprestados" },
    { id: "historico", label: "Histórico" },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={HandCoins}
        cor="blue"
        titulo="Empréstimos"
        subtitulo="Quem está com o quê, e quem quer pegar emprestado."
        acao={
          podeEditar && (
            <button onClick={() => setEscolhendo(true)} className="btn-primary">
              <Plus size={18} /> Novo empréstimo
            </button>
          )
        }
      />

      <div className="mb-4 grid shrink-0 grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.label} className="card p-3 md:p-4">
            <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 md:text-xs">{r.label}</h3>
            <span className={`text-2xl font-black tabular-nums md:text-3xl ${r.cor}`}>{r.valor}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-2xl bg-gray-200 p-1 dark:bg-gray-800">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:flex-none ${
                aba === a.id ? "bg-white text-orange-500 shadow dark:bg-gray-700" : "text-gray-500"
              }`}
            >
              {a.label} <span className="ml-1 opacity-70">{grupos[a.id].length}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input !py-2 pl-9"
            placeholder="Buscar por pessoa ou componente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {aba === "emprestados" && pessoasComItens.length > 0 && (
        <div className="mb-3 flex shrink-0 flex-wrap gap-2">
          {pessoasComItens.map(([nome, qtd]) => (
            <button
              key={nome}
              onClick={() => setBusca(busca === nome ? "" : nome)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                busca === nome
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {nome} <span className="ml-1 opacity-70">{qtd}</span>
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 pr-1">
        {emprestimos.loading ? (
          <Spinner />
        ) : lista.length === 0 ? (
          <EmptyState
            icone={HandCoins}
            texto={
              aba === "solicitacoes"
                ? "Nenhum pedido em aberto. Peça pelo botão “Pedir emprestado” no card do componente."
                : aba === "emprestados"
                  ? "Nada emprestado no momento."
                  : "O histórico está vazio."
            }
          />
        ) : (
          lista.map((e) => {
            const comp = porComponente(e.componente_id);
            const unidadesTxt = rotulosUnidades(e);
            return (
              <div key={e.id} className={`card p-4 ${atrasado(e) ? "border-red-500/50" : ""}`}>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">
                        {e.quantidade}× {e.componente_nome || "(componente apagado)"}
                      </h4>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${COR_STATUS[e.status]}`}>
                        {e.status}
                      </span>
                      {atrasado(e) && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">Atrasado</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">
                      {e.status === "solicitado" ? (
                        <>
                          <b>{e.pessoa_nome}</b> quer pegar emprestado
                        </>
                      ) : e.status === "emprestado" ? (
                        <>
                          Com <b>{e.pessoa_nome}</b>
                        </>
                      ) : (
                        <>
                          <b>{e.pessoa_nome}</b>
                        </>
                      )}
                      {unidadesTxt && <span className="text-xs text-gray-500"> · unidades {unidadesTxt}</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      Pedido em {formatarData(e.created_at)}
                      {e.solicitante_nome && e.solicitante_nome !== e.pessoa_nome ? ` por ${e.solicitante_nome}` : ""}
                      {e.emprestado_em && ` · emprestado em ${formatarData(e.emprestado_em)}`}
                      {e.previsao_devolucao && ` · devolver até ${dataCurta(e.previsao_devolucao)}`}
                      {e.devolvido_em && ` · devolvido em ${formatarData(e.devolvido_em)}`}
                    </p>
                    {e.observacao && <p className="mt-1 text-xs italic text-gray-500">“{e.observacao}”</p>}
                    {comp && e.status === "solicitado" && (
                      <p className="mt-1 text-[11px] text-gray-500">No inventário: {comp.quantidade} un.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {podeEditar && e.status === "solicitado" && (
                      <>
                        <button onClick={() => setEntregando(e)} className="btn-success !px-3 !py-1.5 text-xs">
                          <Check size={15} /> Entregar
                        </button>
                        <button onClick={() => void recusar(e)} className="btn-ghost !px-3 !py-1.5 text-xs">
                          <X size={15} /> Recusar
                        </button>
                      </>
                    )}
                    {podeEditar && e.status === "emprestado" && (
                      <button onClick={() => void devolver(e)} className="btn-success !px-3 !py-1.5 text-xs">
                        <Undo2 size={15} /> Registrar devolução
                      </button>
                    )}
                    {ehMeuPedido(e) && !podeExcluir && (
                      <button
                        onClick={() => void apagar(e, "Cancelar o seu pedido?")}
                        className="btn-ghost !px-3 !py-1.5 text-xs"
                      >
                        <X size={15} /> Cancelar pedido
                      </button>
                    )}
                    {podeExcluir && (
                      <button
                        onClick={() => void apagar(e, "Apagar este registro de empréstimo?")}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                        title="Apagar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {entregando && (
        <EmprestimoForm
          modo="entregar"
          existente={entregando}
          componente={porComponente(entregando.componente_id)}
          onFechar={() => setEntregando(null)}
        />
      )}

      {escolhendo && (
        <Modal titulo="Novo empréstimo" onFechar={() => setEscolhendo(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Componente</label>
              <select className="input" value={selecionado} onChange={(e) => setSelecionado(e.target.value)} autoFocus>
                <option value="">Escolha...</option>
                {componentes.itens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.quantidade})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEscolhendo(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                disabled={!selecionado}
                onClick={() => {
                  setNovoPara(componentes.itens.find((c) => c.id === Number(selecionado)) ?? null);
                  setEscolhendo(false);
                  setSelecionado("");
                }}
                className="btn-primary flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {novoPara && <EmprestimoForm modo="emprestar" componente={novoPara} onFechar={() => setNovoPara(null)} />}
    </div>
  );
}
