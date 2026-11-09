import { useMemo, useState } from "react";
import { BadgeDollarSign, ExternalLink, Pencil, Plus, Search, Trash2, Trophy } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { MelhorPreco } from "../types";
import { formatarMoeda } from "../utils/format";

const chave = (nome: string) => nome.trim().toLowerCase();
const dataCurta = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "");

export default function PrecosPage() {
  const { precos, componentes } = useData();
  const { user, podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<MelhorPreco | null>(null);

  const [nome, setNome] = useState("");
  const [loja, setLoja] = useState("");
  const [preco, setPreco] = useState("");
  const [link, setLink] = useState("");
  const [data, setData] = useState("");
  const [obs, setObs] = useState("");

  const abrirForm = (p: MelhorPreco | null, nomeInicial = "") => {
    setEditando(p);
    setNome(p?.componente_nome ?? nomeInicial);
    setLoja(p?.loja ?? "");
    setPreco(p ? String(p.preco_unitario).replace(".", ",") : "");
    setLink(p?.link ?? "");
    setData(p?.data_compra ?? "");
    setObs(p?.observacao ?? "");
    setFormAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(preco.replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0) return toast("Preço inválido.", "aviso");
    const dados = {
      componente_nome: nome.trim(),
      loja: loja.trim(),
      preco_unitario: valor,
      link: link.trim() || null,
      data_compra: data || null,
      observacao: obs.trim() || null,
    };
    const ok = editando
      ? await precos.atualizar(editando.id, dados)
      : await precos.criar({ ...dados, autor_nome: user?.name ?? null });
    if (ok) {
      toast(editando ? "Preço atualizado!" : "Preço registrado!");
      setFormAberto(false);
    }
  };

  const apagar = async (p: MelhorPreco) => {
    if (!window.confirm(`Apagar o registro de "${p.componente_nome}" em ${p.loja}?`)) return;
    if (await precos.remover(p.id)) toast("Registro removido.", "aviso");
  };

  // Agrupa por componente e ordena cada grupo do mais barato para o mais caro
  const grupos = useMemo(() => {
    const mapa = new Map<string, { nome: string; itens: MelhorPreco[] }>();
    for (const p of precos.itens) {
      const k = chave(p.componente_nome);
      const g = mapa.get(k);
      if (g) g.itens.push(p);
      else mapa.set(k, { nome: p.componente_nome.trim(), itens: [p] });
    }
    const termo = busca.trim().toLowerCase();
    return Array.from(mapa.values())
      .map((g) => ({ ...g, itens: g.itens.sort((a, b) => Number(a.preco_unitario) - Number(b.preco_unitario)) }))
      .filter(
        (g) =>
          !termo ||
          g.nome.toLowerCase().includes(termo) ||
          g.itens.some((i) => i.loja.toLowerCase().includes(termo)),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [precos.itens, busca]);

  const lojas = new Set(precos.itens.map((p) => chave(p.loja))).size;

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={BadgeDollarSign}
        cor="purple"
        titulo="Melhores Preços"
        subtitulo="Onde cada componente já foi comprado e por quanto. Diferente do orçamento, aqui é o histórico do que deu certo."
        acao={
          podeEditar && (
            <button onClick={() => abrirForm(null)} className="btn-primary">
              <Plus size={18} /> Registrar preço
            </button>
          )
        }
      />

      <div className="mb-4 grid shrink-0 grid-cols-3 gap-2 md:gap-4">
        {[
          { l: "Componentes", v: grupos.length },
          { l: "Registros", v: precos.itens.length },
          { l: "Lojas", v: lojas },
        ].map((x) => (
          <div key={x.l} className="card p-3 md:p-4">
            <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 md:text-xs">{x.l}</h3>
            <span className="text-2xl font-black tabular-nums text-purple-500 md:text-3xl">{x.v}</span>
          </div>
        ))}
      </div>

      <div className="relative mb-3 shrink-0">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Buscar por componente ou loja..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 pr-1">
        {precos.loading ? (
          <Spinner />
        ) : grupos.length === 0 ? (
          <EmptyState
            icone={BadgeDollarSign}
            texto={precos.itens.length === 0 ? "Nenhum preço registrado ainda." : "Nada encontrado."}
          />
        ) : (
          grupos.map((g) => {
            const melhor = g.itens[0];
            const melhorValor = Number(melhor.preco_unitario);
            return (
              <div key={chave(g.nome)} className="card p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-bold">{g.nome}</h4>
                  {podeEditar && (
                    <button onClick={() => abrirForm(null, g.nome)} className="btn-ghost !px-3 !py-1.5 text-xs">
                      <Plus size={14} /> Outro preço
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {g.itens.map((p, i) => {
                    const valor = Number(p.preco_unitario);
                    const diferenca = valor - melhorValor;
                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col justify-between gap-2 rounded-xl px-3 py-2 sm:flex-row sm:items-center ${
                          i === 0 ? "bg-green-500/10 ring-1 ring-green-500/30" : "bg-gray-100 dark:bg-gray-900/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                            {i === 0 && <Trophy size={14} className="text-green-500" />}
                            {p.loja}
                            {i === 0 && g.itens.length > 1 && (
                              <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                                Melhor preço
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {p.data_compra ? `Comprado em ${dataCurta(p.data_compra)}` : "Sem data"}
                            {p.autor_nome ? ` · por ${p.autor_nome.split(" ")[0]}` : ""}
                            {p.observacao ? ` · ${p.observacao}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={`text-lg font-black tabular-nums ${i === 0 ? "text-green-500" : ""}`}>
                              {formatarMoeda(valor)}
                            </p>
                            {i > 0 && diferenca > 0 && (
                              <p className="text-[10px] font-bold text-red-500">
                                +{formatarMoeda(diferenca)}
                                {melhorValor > 0 && ` (+${Math.round((diferenca / melhorValor) * 100)}%)`}
                              </p>
                            )}
                          </div>
                          {p.link && (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-2 text-blue-500 hover:bg-blue-500/10"
                              title="Abrir link"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {podeEditar && (
                            <button onClick={() => abrirForm(p)} className="rounded-lg p-2 text-blue-500 hover:bg-blue-500/10" title="Editar">
                              <Pencil size={16} />
                            </button>
                          )}
                          {podeExcluir && (
                            <button onClick={() => void apagar(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10" title="Apagar">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {formAberto && (
        <Modal titulo={editando ? "Editar preço" : "Registrar preço"} onFechar={() => setFormAberto(false)}>
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className="label">Componente *</label>
              <input
                className="input"
                required
                autoFocus
                list="nomes-precos"
                placeholder="Nome do componente"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <datalist id="nomes-precos">
                {componentes.itens.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Loja / fornecedor *</label>
                <input className="input" required value={loja} onChange={(e) => setLoja(e.target.value)} />
              </div>
              <div>
                <label className="label">Preço unitário (R$) *</label>
                <input className="input" required inputMode="decimal" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Link</label>
              <input className="input" type="url" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <div>
              <label className="label">Data da compra</label>
              <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <label className="label">Observação</label>
              <input
                className="input"
                placeholder="Ex: frete grátis acima de R$ 100, compra em lote de 50..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormAberto(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
