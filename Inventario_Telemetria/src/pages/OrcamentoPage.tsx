import { useState } from "react";
import { ExternalLink, FileDown, PackagePlus, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { Orcamento, OrcamentoStatus } from "../types";
import { STATUS_ORCAMENTO, TIPOS_COMPONENTE } from "../utils/constants";
import { novoComponente } from "../utils/componente";
import { formatarMoeda } from "../utils/format";

const COR_STATUS: Record<OrcamentoStatus, string> = {
  pendente: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  aprovado: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  comprado: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  recusado: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

export default function OrcamentoPage() {
  const { orcamentos, componentes } = useData();
  const { user, podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Orcamento | null>(null);

  // campos do formulário
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_COMPONENTE[0]);
  const [quantidade, setQuantidade] = useState("1");
  const [preco, setPreco] = useState("0");
  const [fornecedor, setFornecedor] = useState("");
  const [link, setLink] = useState("");

  const abrirForm = (o: Orcamento | null) => {
    setEditando(o);
    setNome(o?.nome ?? "");
    setTipo(o?.tipo ?? TIPOS_COMPONENTE[0]);
    setQuantidade(String(o?.quantidade ?? 1));
    setPreco(String(o?.preco_unitario ?? 0));
    setFornecedor(o?.fornecedor ?? "");
    setLink(o?.link ?? "");
    setFormAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const dados = {
      nome: nome.trim(),
      tipo: tipo.trim() || "Outro",
      quantidade: Math.max(1, parseInt(quantidade) || 1),
      preco_unitario: Math.max(0, Number(preco.replace(",", ".")) || 0),
      fornecedor: fornecedor.trim() || null,
      link: link.trim() || null,
    };
    const ok = editando
      ? await orcamentos.atualizar(editando.id, dados)
      : await orcamentos.criar({ ...dados, status: "pendente", estocado: false, solicitante_nome: user?.name ?? null });
    if (ok) {
      toast(editando ? "Orçamento atualizado!" : "Item adicionado ao orçamento!");
      setFormAberto(false);
    }
  };

  const adicionarAoEstoque = async (o: Orcamento) => {
    const existente = componentes.itens.find((c) => c.nome.toLowerCase() === o.nome.toLowerCase());
    const ok = existente
      ? await componentes.atualizar(existente.id, { quantidade: existente.quantidade + o.quantidade })
      : await componentes.criar(novoComponente({ nome: o.nome, tipo: o.tipo, quantidade: o.quantidade }));
    if (ok) {
      await orcamentos.atualizar(o.id, { estocado: true });
      toast(`${o.quantidade}× "${o.nome}" adicionado(s) ao estoque!`);
    }
  };

  const apagar = async (o: Orcamento) => {
    if (!window.confirm(`Apagar "${o.nome}" do orçamento?`)) return;
    if (await orcamentos.remover(o.id)) toast("Item removido.", "aviso");
  };

  const totalPor = (status: OrcamentoStatus[]) =>
    orcamentos.itens
      .filter((o) => status.includes(o.status))
      .reduce((s, o) => s + o.quantidade * Number(o.preco_unitario), 0);

  const baixarPdf = async () => {
    if (orcamentos.itens.length === 0) return toast("O orçamento está vazio.", "aviso");
    const { gerarPdfOrcamento } = await import("../utils/pdf");
    gerarPdfOrcamento(orcamentos.itens, { status: ["pendente", "aprovado", "comprado"] }).save(
      `orcamento_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  const resumo = [
    { label: "Pendente", valor: totalPor(["pendente"]), cor: "text-yellow-500" },
    { label: "Aprovado", valor: totalPor(["aprovado"]), cor: "text-blue-500" },
    { label: "Comprado", valor: totalPor(["comprado"]), cor: "text-green-500" },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={Wallet}
        cor="green"
        titulo="Orçamento"
        subtitulo="Planejamento de compra de novos componentes."
        acao={
          <div className="flex gap-2">
            <button onClick={() => void baixarPdf()} className="btn-ghost" title="PDF para enviar à financeira">
              <FileDown size={18} /> PDF
            </button>
            {podeEditar && (
              <button onClick={() => abrirForm(null)} className="btn-primary">
                <Plus size={18} /> Novo item
              </button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid shrink-0 grid-cols-3 gap-2 md:gap-4">
        {resumo.map((r) => (
          <div key={r.label} className="card p-3 md:p-5">
            <h3 className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 md:text-xs">{r.label}</h3>
            <span className={`text-sm font-black tabular-nums sm:text-2xl md:text-3xl ${r.cor}`}>{formatarMoeda(r.valor)}</span>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 pr-1">
        {orcamentos.itens.length === 0 ? (
          <EmptyState icone={Wallet} texto="Nenhum item no orçamento." />
        ) : (
          orcamentos.itens.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold">{o.nome}</h4>
                    <span className="text-[11px] font-semibold uppercase text-orange-500">{o.tipo}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {o.quantidade} × {formatarMoeda(Number(o.preco_unitario))} ={" "}
                    <b className="text-gray-700 dark:text-gray-200">
                      {formatarMoeda(o.quantidade * Number(o.preco_unitario))}
                    </b>
                    {o.fornecedor ? ` · ${o.fornecedor}` : ""}
                    {o.solicitante_nome ? ` · por ${o.solicitante_nome.split(" ")[0]}` : ""}
                  </p>
                  {o.link && (
                    <a
                      href={o.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink size={12} className="mr-1" /> Ver na loja
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {podeEditar ? (
                    <select
                      value={o.status}
                      onChange={(e) => void orcamentos.atualizar(o.id, { status: e.target.value as OrcamentoStatus })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase outline-none ${COR_STATUS[o.status]} bg-transparent`}
                    >
                      {STATUS_ORCAMENTO.map((s) => (
                        <option key={s} value={s} className="bg-white text-gray-800">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${COR_STATUS[o.status]}`}>
                      {o.status}
                    </span>
                  )}

                  {podeEditar && o.status === "comprado" && !o.estocado && (
                    <button onClick={() => void adicionarAoEstoque(o)} className="btn-success !px-3 !py-1.5 text-xs">
                      <PackagePlus size={15} /> Dar entrada no estoque
                    </button>
                  )}
                  {o.estocado && <span className="text-xs font-bold text-green-500">✓ No estoque</span>}

                  {podeEditar && (
                    <button onClick={() => abrirForm(o)} className="rounded-lg p-2 text-blue-500 hover:bg-blue-500/10" title="Editar">
                      <Pencil size={16} />
                    </button>
                  )}
                  {podeExcluir && (
                    <button onClick={() => void apagar(o)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10" title="Apagar">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {formAberto && (
        <Modal titulo={editando ? "Editar item do orçamento" : "Novo item do orçamento"} onFechar={() => setFormAberto(false)}>
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className="label">Componente *</label>
              <input
                className="input"
                required
                autoFocus
                list="nomes-existentes"
                placeholder="Nome do componente"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <datalist id="nomes-existentes">
                {componentes.itens.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Tipo</label>
              <input className="input" list="tipos-orc" value={tipo} onChange={(e) => setTipo(e.target.value)} />
              <datalist id="tipos-orc">
                {TIPOS_COMPONENTE.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Quantidade</label>
                <input className="input" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
              </div>
              <div>
                <label className="label">Preço unitário (R$)</label>
                <input className="input" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
            <div>
              <label className="label">Link</label>
              <input className="input" type="url" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
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
