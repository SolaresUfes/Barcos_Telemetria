import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import type { DiarioTipo } from "../types";
import { TIPOS_DIARIO } from "../utils/constants";
import { formatarData } from "../utils/format";

const COR_TIPO: Record<DiarioTipo, string> = {
  falha: "bg-red-500/15 text-red-500 border-red-500/30",
  perda: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  observacao: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

export default function DiarioPage() {
  const { diario, componentes } = useData();
  const { user, podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<DiarioTipo>("falha");
  const [componenteId, setComponenteId] = useState("");
  const [qtdAfetada, setQtdAfetada] = useState("0");
  const [descontar, setDescontar] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | DiarioTipo>("todos");

  const componente = componentes.itens.find((c) => String(c.id) === componenteId);

  const salvar = async () => {
    if (!titulo.trim() || !texto.trim()) {
      toast("Preencha o título e o texto da anotação.", "aviso");
      return;
    }
    const qtd = Math.max(0, parseInt(qtdAfetada) || 0);

    const ok = await diario.criar({
      titulo: titulo.trim(),
      texto: texto.trim(),
      tipo,
      componente_id: componente?.id ?? null,
      componente_nome: componente?.nome ?? null,
      quantidade_afetada: componente ? qtd : 0,
      autor_nome: user?.name ?? "Desconhecido",
      autor_email: user?.email ?? null,
      autor_foto: user?.photo || null,
    });
    if (!ok) return;

    if (tipo === "perda" && descontar && componente && qtd > 0) {
      await componentes.atualizar(componente.id, { quantidade: Math.max(0, componente.quantidade - qtd) });
    }

    setTitulo("");
    setTexto("");
    setComponenteId("");
    setQtdAfetada("0");
    setDescontar(false);
    toast("Anotação salva no Diário de Bordo!");
  };

  const apagar = async (id: number) => {
    if (!window.confirm("Apagar esta anotação?")) return;
    if (await diario.remover(id)) toast("Anotação apagada.", "aviso");
  };

  const lista = diario.itens.filter((d) => filtro === "todos" || d.tipo === filtro);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={BookOpen}
        cor="purple"
        titulo="Diário de Bordo"
        subtitulo="Falhas, perdas e observações sobre o material do galpão."
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row">
        {podeEditar ? (
          <div className="card flex shrink-0 flex-col overflow-y-auto p-5 md:w-1/3">
            <h3 className="mb-4 flex items-center text-lg font-bold">
              <Plus size={18} className="mr-2 text-purple-500" /> Nova anotação
            </h3>

            <label className="label">Tipo</label>
            <div className="mb-3 flex gap-2">
              {TIPOS_DIARIO.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition-all ${
                    tipo === t.id ? COR_TIPO[t.id] : "border-gray-300 text-gray-500 dark:border-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              className="input mb-3"
              placeholder="Título da anotação..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <textarea
              className="input mb-3 min-h-[120px] flex-1 resize-none"
              placeholder="Descreva o que aconteceu (ex: sensor queimou ao ligar em 12V...)"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />

            <label className="label">Componente relacionado (opcional)</label>
            <select className="input mb-3" value={componenteId} onChange={(e) => setComponenteId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {componentes.itens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            {componente && (
              <div className="mb-3">
                <label className="label">Unidades afetadas</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={qtdAfetada}
                  onChange={(e) => setQtdAfetada(e.target.value)}
                />
                {tipo === "perda" && (
                  <label className="mt-2 flex cursor-pointer items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={descontar}
                      onChange={(e) => setDescontar(e.target.checked)}
                      className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>Descontar do estoque (atual: {componente.quantidade})</span>
                  </label>
                )}
              </div>
            )}

            <button onClick={() => void salvar()} className="btn mt-auto bg-purple-600 py-3.5 text-white shadow-lg shadow-purple-600/20 hover:scale-[1.02] hover:bg-purple-700">
              <BookOpen size={18} /> Salvar registro
            </button>
          </div>
        ) : (
          <div className="card shrink-0 p-5 text-sm text-gray-500 md:w-1/3">
            Seu acesso é somente leitura (Trainee). Peça a um membro para registrar ocorrências.
          </div>
        )}

        <div className="card flex min-h-0 flex-1 flex-col overflow-hidden p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Histórico</h3>
            <div className="flex gap-1.5">
              {([{ id: "todos", label: "Todos" }, ...TIPOS_DIARIO] as { id: "todos" | DiarioTipo; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                    filtro === f.id
                      ? "border-purple-500 bg-purple-500 text-white"
                      : "border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {lista.length === 0 ? (
              <EmptyState icone={BookOpen} texto="Nenhuma anotação por aqui." />
            ) : (
              lista.map((d) => (
                <div key={d.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`mr-2 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${COR_TIPO[d.tipo]}`}>
                        {TIPOS_DIARIO.find((t) => t.id === d.tipo)?.label}
                      </span>
                      <h4 className="mt-1 text-base font-bold text-purple-500 dark:text-purple-400">{d.titulo}</h4>
                    </div>
                    <span className="shrink-0 rounded-md bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:bg-gray-700 md:text-xs">
                      {formatarData(d.created_at)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">{d.texto}</p>

                  {d.componente_nome && (
                    <p className="mt-2 text-xs font-semibold text-orange-500">
                      Componente: {d.componente_nome}
                      {d.quantidade_afetada > 0 ? ` · ${d.quantidade_afetada} un.` : ""}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {d.autor_foto && (
                        <img src={d.autor_foto} alt="" referrerPolicy="no-referrer" className="h-5 w-5 rounded-full border border-gray-400" />
                      )}
                      <span className="text-xs font-bold text-gray-500">{d.autor_nome}</span>
                    </div>
                    {(podeExcluir || d.autor_email === user?.email) && (
                      <button
                        onClick={() => void apagar(d.id)}
                        className="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-500/10"
                        title="Apagar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
