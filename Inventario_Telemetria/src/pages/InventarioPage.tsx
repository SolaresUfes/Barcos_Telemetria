import { useMemo, useState } from "react";
import { ArrowUpDown, ImageIcon, LayoutGrid, Package, Plus, Search } from "lucide-react";
import ComponenteCard from "../components/inventario/ComponenteCard";
import ComponenteDetalhe from "../components/inventario/ComponenteDetalhe";
import ComponenteForm, { type OpcoesCriacao } from "../components/inventario/ComponenteForm";
import EmprestimoForm from "../components/emprestimos/EmprestimoForm";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { Componente, NovoComponente, StatusEstoque } from "../types";
import { OPCOES_ORDENACAO, TIPOS_COMPONENTE, type OrdenacaoId } from "../utils/constants";
import { resumirEmprestimos, resumirUnidades, tiposDe } from "../utils/componente";
import { statusEstoque } from "../utils/estoque";
import { apagarImagem } from "../utils/imagem";

type FiltroEstado = "todos" | "bom" | "duvidoso" | "ruim";
type FiltroEmprestimo = "todos" | "emprestados" | "livres";

export default function InventarioPage() {
  const { componentes, unidades, unidadesPorComponente, emprestimosPorComponente } = useData();
  const { podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusEstoque>("todos");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
  const [emprestimoFiltro, setEmprestimoFiltro] = useState<FiltroEmprestimo>("todos");
  const [ordem, setOrdem] = useState<OrdenacaoId>("nome-asc");

  const [visao, setVisao] = useState<"cards" | "galeria">(() => {
    try {
      return localStorage.getItem("inventario_visao") === "galeria" ? "galeria" : "cards";
    } catch {
      return "cards";
    }
  });
  const mudarVisao = (v: "cards" | "galeria") => {
    setVisao(v);
    try {
      localStorage.setItem("inventario_visao", v);
    } catch {
      /* sem storage: só não lembra */
    }
  };

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Componente | null>(null);
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [pedindo, setPedindo] = useState<Componente | null>(null);

  // Tipos: os padrões + qualquer tipo novo que apareceu (cadastro manual ou importação)
  const todosOsTipos = useMemo(
    () => Array.from(new Set(componentes.itens.flatMap(tiposDe))),
    [componentes.itens],
  );
  const tiposExtras = useMemo(() => todosOsTipos.filter((t) => !TIPOS_COMPONENTE.includes(t)), [todosOsTipos]);
  // "Básico" sempre aparece primeiro quando existir
  const tiposPresentes = useMemo(
    () =>
      [...todosOsTipos].sort((a, b) =>
        a === "Básico" ? -1 : b === "Básico" ? 1 : a.localeCompare(b, "pt-BR"),
      ),
    [todosOsTipos],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = componentes.itens.filter((c) => {
      if (tipoFiltro !== "Todos" && !tiposDe(c).includes(tipoFiltro)) return false;
      if (statusFiltro !== "todos" && statusEstoque(c) !== statusFiltro) return false;

      if (estadoFiltro !== "todos") {
        const r = resumirUnidades(c, unidadesPorComponente.get(c.id) ?? []);
        if (r[estadoFiltro] === 0) return false;
      }
      if (emprestimoFiltro !== "todos") {
        const emprestado = resumirEmprestimos(c, emprestimosPorComponente.get(c.id) ?? []).emprestado > 0;
        if (emprestimoFiltro === "emprestados" ? !emprestado : emprestado) return false;
      }

      if (!termo) return true;
      return [c.nome, ...tiposDe(c), c.localizacao, c.descricao, c.descricao_completa].some((v) =>
        v?.toLowerCase().includes(termo),
      );
    });

    return lista.sort((a, b) => {
      switch (ordem) {
        case "nome-desc":
          return b.nome.localeCompare(a.nome, "pt-BR", { sensitivity: "base" });
        case "qtd-desc":
          return b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR");
        case "qtd-asc":
          return a.quantidade - b.quantidade || a.nome.localeCompare(b.nome, "pt-BR");
        case "recentes":
          return b.created_at.localeCompare(a.created_at);
        default:
          return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
      }
    });
  }, [
    componentes.itens,
    busca,
    tipoFiltro,
    statusFiltro,
    estadoFiltro,
    emprestimoFiltro,
    ordem,
    unidadesPorComponente,
    emprestimosPorComponente,
  ]);

  const salvar = async (dados: NovoComponente, opcoes: OpcoesCriacao) => {
    if (editando) {
      // se a imagem foi trocada/removida, apaga a antiga do storage
      if (editando.imagem_url && editando.imagem_url !== dados.imagem_url) void apagarImagem(editando.imagem_url);
      const ok = await componentes.atualizar(editando.id, dados);
      if (ok) toast("Componente atualizado!");
      return ok;
    }

    const criado = await componentes.criarRetornando(dados);
    if (!criado) return false;
    if (opcoes.unidadesIndividuais && dados.quantidade > 0) {
      const linhas = Array.from({ length: dados.quantidade }, (_, i) => ({
        componente_id: criado.id,
        rotulo: `#${i + 1}`,
        estado: "bom" as const,
        caracteristicas: dados.caracteristicas,
        observacao: null,
      }));
      await unidades.criarVarios(linhas);
    }
    toast("Componente cadastrado!");
    return true;
  };

  const excluir = async (c: Componente) => {
    if (!window.confirm(`Apagar "${c.nome}" do inventário?`)) return;
    if (await componentes.remover(c.id)) {
      void apagarImagem(c.imagem_url);
      setDetalheId(null);
      toast("Componente apagado.", "aviso");
    }
  };

  const abrirEdicao = (c: Componente) => {
    setEditando(c);
    setFormAberto(true);
  };

  const contagemPorTipo = (tipo: string) => componentes.itens.filter((c) => tiposDe(c).includes(tipo)).length;
  const detalhe = detalheId != null ? componentes.itens.find((c) => c.id === detalheId) ?? null : null;
  const filtrosAtivos =
    busca !== "" || tipoFiltro !== "Todos" || statusFiltro !== "todos" || estadoFiltro !== "todos" || emprestimoFiltro !== "todos";

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={Package}
        cor="orange"
        titulo="Inventário"
        subtitulo="Componentes eletrônicos disponíveis no galpão. Clique em um card para ver a ficha completa."
        acao={
          podeEditar && (
            <button
              onClick={() => {
                setEditando(null);
                setFormAberto(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} /> Novo componente
            </button>
          )
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex shrink-0 flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Buscar por nome, tipo, localização, descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex shrink-0 gap-1 rounded-2xl bg-gray-200 p-1 dark:bg-gray-800">
            {[
              { id: "cards" as const, icone: LayoutGrid, titulo: "Ver como cards" },
              { id: "galeria" as const, icone: ImageIcon, titulo: "Ver só as imagens (galeria)" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => mudarVisao(v.id)}
                title={v.titulo}
                aria-label={v.titulo}
                className={`rounded-xl px-3 transition-all ${
                  visao === v.id ? "bg-white text-orange-500 shadow dark:bg-gray-700" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <v.icone size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <select
            className="input"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}
            title="Nível de estoque"
          >
            <option value="todos">Estoque: todos</option>
            <option value="ok">Estoque: OK</option>
            <option value="baixo">Estoque: baixo</option>
            <option value="falta">Estoque: em falta</option>
          </select>
          <select
            className="input"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as FiltroEstado)}
            title="Condição das unidades"
          >
            <option value="todos">Condição: todas</option>
            <option value="bom">Com unidades boas</option>
            <option value="duvidoso">Com unidades duvidosas</option>
            <option value="ruim">Com unidades ruins</option>
          </select>
          <select
            className="input"
            value={emprestimoFiltro}
            onChange={(e) => setEmprestimoFiltro(e.target.value as FiltroEmprestimo)}
            title="Empréstimo"
          >
            <option value="todos">Empréstimo: todos</option>
            <option value="emprestados">Emprestados</option>
            <option value="livres">Sem empréstimo</option>
          </select>
          <div className="relative">
            <ArrowUpDown size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="input pl-9"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as OrdenacaoId)}
              title="Ordenar por"
            >
              {OPCOES_ORDENACAO.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["Todos", ...tiposPresentes].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                tipoFiltro === t
                  ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {t}
              {t !== "Todos" && <span className="ml-1.5 opacity-70">{contagemPorTipo(t)}</span>}
            </button>
          ))}
          {filtrosAtivos && (
            <button
              onClick={() => {
                setBusca("");
                setTipoFiltro("Todos");
                setStatusFiltro("todos");
                setEstadoFiltro("todos");
                setEmprestimoFiltro("todos");
              }}
              className="ml-auto text-xs font-bold text-orange-500 hover:underline"
            >
              Limpar filtros ({filtrados.length} de {componentes.itens.length})
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
        {componentes.loading ? (
          <Spinner />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icone={Package}
            texto={componentes.itens.length === 0 ? "Nenhum componente cadastrado ainda." : "Nada encontrado com esses filtros."}
          />
        ) : visao === "galeria" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtrados.map((c) => {
              const falta = statusEstoque(c) !== "ok";
              const emprestado = resumirEmprestimos(c, emprestimosPorComponente.get(c.id) ?? []).emprestado;
              return (
                <button
                  key={c.id}
                  onClick={() => setDetalheId(c.id)}
                  title={c.nome}
                  className="card group relative aspect-square cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-orange-500/60 hover:shadow-xl hover:shadow-orange-500/20 active:scale-[0.98]"
                >
                  {c.imagem_url ? (
                    <img
                      src={c.imagem_url}
                      alt={c.nome}
                      loading="lazy"
                      className="h-full w-full bg-white object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-gray-300 dark:text-gray-600">
                      <Package size={40} />
                      <span className="text-[10px] font-bold uppercase">sem imagem</span>
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-black text-white shadow ${
                      falta ? "bg-red-500" : "bg-gray-800/80"
                    }`}
                  >
                    {c.quantidade}
                  </span>
                  {emprestado > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                      {emprestado} emprestado(s)
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-6 text-left text-xs font-bold leading-tight text-white">
                    <span className="line-clamp-2">{c.nome}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrados.map((c) => (
              <ComponenteCard
                key={c.id}
                item={c}
                unidades={unidadesPorComponente.get(c.id) ?? []}
                emprestimos={emprestimosPorComponente.get(c.id) ?? []}
                podeEditar={podeEditar}
                podeExcluir={podeExcluir}
                onAbrir={() => setDetalheId(c.id)}
                onPedir={() => setPedindo(c)}
                onAjustar={(delta) => void componentes.atualizar(c.id, { quantidade: Math.max(0, c.quantidade + delta) })}
                onEditar={() => abrirEdicao(c)}
                onExcluir={() => void excluir(c)}
              />
            ))}
          </div>
        )}
      </div>

      {detalhe && (
        <ComponenteDetalhe
          componente={detalhe}
          onFechar={() => setDetalheId(null)}
          onEditar={() => abrirEdicao(detalhe)}
          onExcluir={() => void excluir(detalhe)}
        />
      )}

      {formAberto && (
        <ComponenteForm
          inicial={editando}
          tiposExtras={tiposExtras}
          onSalvar={salvar}
          onFechar={() => setFormAberto(false)}
        />
      )}

      {pedindo && <EmprestimoForm modo="solicitar" componente={pedindo} onFechar={() => setPedindo(null)} />}
    </div>
  );
}
