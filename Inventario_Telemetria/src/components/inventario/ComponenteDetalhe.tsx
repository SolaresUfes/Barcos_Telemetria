import { useMemo, useState } from "react";
import {
  ExternalLink,
  HandCoins,
  Layers,
  Maximize2,
  ListChecks,
  MapPin,
  Minus,
  Package,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../hooks/useData";
import { useToast } from "../../hooks/useToast";
import type { Componente, EstadoUnidade, Unidade } from "../../types";
import {
  ESTADOS,
  ESTILO_ESTADO,
  resumirEmprestimos,
  resumirUnidades,
  tiposDe,
} from "../../utils/componente";
import { statusEstoque } from "../../utils/estoque";
import { formatarData, plural } from "../../utils/format";
import EmprestimoForm, { type ModoEmprestimo } from "../emprestimos/EmprestimoForm";
import Modal from "../ui/Modal";
import StatusBadge from "../ui/StatusBadge";
import { CaracteristicasChips } from "./CaracteristicasEditor";
import UnidadeForm, { type DadosUnidade } from "./UnidadeForm";

interface Props {
  componente: Componente;
  onFechar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

const dataCurta = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "");

export default function ComponenteDetalhe({ componente: c, onFechar, onEditar, onExcluir }: Props) {
  const { componentes, unidades, unidadesPorComponente, emprestimos, emprestimosPorComponente } = useData();
  const { podeEditar, podeExcluir } = useAuth();
  const { toast } = useToast();

  const [unidadeForm, setUnidadeForm] = useState<{ aberto: boolean; editando: Unidade | null }>({
    aberto: false,
    editando: null,
  });
  const [imagemGrande, setImagemGrande] = useState(false);
  const [emprestimoModo, setEmprestimoModo] = useState<ModoEmprestimo | null>(null);

  const especificas = unidadesPorComponente.get(c.id) ?? [];
  const resumo = resumirUnidades(c, especificas);
  const listaEmp = emprestimosPorComponente.get(c.id) ?? [];
  const resumoEmp = resumirEmprestimos(c, listaEmp);
  const ativos = listaEmp.filter((e) => e.status === "emprestado");
  const pedidos = listaEmp.filter((e) => e.status === "solicitado");
  const statusStock = statusEstoque(c);
  const padraoDuv = Math.min(c.qtd_duvidoso, resumo.padrao);
  const padraoRuim = Math.min(c.qtd_ruim, resumo.padrao - padraoDuv);
  const padraoBom = resumo.padrao - padraoDuv - padraoRuim;

  const emprestimoPorUnidade = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const e of ativos) for (const id of e.unidade_ids) mapa.set(id, e.pessoa_nome);
    return mapa;
  }, [ativos]);

  const proximoRotulo = useMemo(() => {
    const numeros = especificas.map((u) => /^#(\d+)$/.exec(u.rotulo)?.[1]).filter(Boolean).map(Number);
    return `#${(numeros.length ? Math.max(...numeros) : especificas.length) + 1}`;
  }, [especificas]);

  // ---------- unidades padrão: contadores de estado ----------
  const ajustarPadrao = async (campo: "qtd_duvidoso" | "qtd_ruim", delta: number) => {
    const atual = campo === "qtd_duvidoso" ? Math.min(c.qtd_duvidoso, resumo.padrao) : Math.min(c.qtd_ruim, resumo.padrao);
    const outro = campo === "qtd_duvidoso" ? c.qtd_ruim : c.qtd_duvidoso;
    const novo = Math.max(0, Math.min(atual + delta, resumo.padrao - Math.min(outro, resumo.padrao)));
    if (novo === atual) return;
    await componentes.atualizar(c.id, { [campo]: novo });
  };

  // ---------- unidades específicas ----------
  const salvarUnidade = async (d: DadosUnidade): Promise<boolean> => {
    const editando = unidadeForm.editando;
    if (editando) {
      const ok = await unidades.atualizar(editando.id, {
        rotulo: d.rotulo,
        estado: d.estado,
        caracteristicas: d.caracteristicas,
        observacao: d.observacao,
      });
      if (ok) toast("Unidade atualizada!");
      return ok;
    }
    const criada = await unidades.criarRetornando({
      componente_id: c.id,
      rotulo: d.rotulo,
      estado: d.estado,
      caracteristicas: d.caracteristicas,
      observacao: d.observacao,
    });
    if (!criada) return false;
    if (d.saiuDoPadrao) {
      // a unidade deixa de ser "padrão": mantém os contadores coerentes com o novo total de padrão
      const novoPadrao = Math.max(0, resumo.padrao - 1);
      const duv = Math.min(c.qtd_duvidoso, novoPadrao);
      await componentes.atualizar(c.id, { qtd_duvidoso: duv, qtd_ruim: Math.min(c.qtd_ruim, novoPadrao - duv) });
    } else {
      await componentes.atualizar(c.id, { quantidade: c.quantidade + 1 });
    }
    toast("Unidade cadastrada!");
    return true;
  };

  const mudarEstado = (u: Unidade, estado: EstadoUnidade) => void unidades.atualizar(u.id, { estado });

  const apagarUnidade = async (u: Unidade) => {
    if (!window.confirm(`Apagar a unidade "${u.rotulo}"? O estoque de "${c.nome}" diminui em 1.`)) return;
    if (await unidades.remover(u.id)) {
      await componentes.atualizar(c.id, { quantidade: Math.max(0, c.quantidade - 1) });
      toast("Unidade apagada.", "aviso");
    }
  };

  const detalharTodas = async () => {
    const n = resumo.padrao;
    if (n === 0) return;
    if (n > 100) return toast("Muitas unidades padrão (mais de 100) para detalhar de uma vez.", "aviso");
    if (!window.confirm(`Criar ${n} unidades específicas a partir das unidades padrão? O estoque não muda.`)) return;
    const duv = Math.min(c.qtd_duvidoso, n);
    const ruim = Math.min(c.qtd_ruim, n - duv);
    const inicio = Number(proximoRotulo.slice(1));
    const linhas = Array.from({ length: n }, (_, i) => ({
      componente_id: c.id,
      rotulo: `#${inicio + i}`,
      estado: (i < ruim ? "ruim" : i < ruim + duv ? "duvidoso" : "bom") as EstadoUnidade,
      caracteristicas: c.caracteristicas,
      observacao: null,
    }));
    if (await unidades.criarVarios(linhas)) {
      await componentes.atualizar(c.id, { qtd_duvidoso: 0, qtd_ruim: 0 });
      toast(`${n} unidades criadas!`);
    }
  };

  const devolver = async (id: number) => {
    if (await emprestimos.atualizar(id, { status: "devolvido", devolvido_em: new Date().toISOString() }))
      toast("Devolução registrada!");
  };

  // ---------- visual ----------
  const barra = (e: EstadoUnidade) => (resumo.total > 0 ? (resumo[e] / resumo.total) * 100 : 0);

  return (
    <>
      <Modal titulo="Ficha do componente" onFechar={onFechar} largura="max-w-3xl">
        {/* Cabeçalho: imagem + identificação */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row">
          {c.imagem_url ? (
            <button
              type="button"
              onClick={() => setImagemGrande(true)}
              title="Clique para ampliar"
              className="group relative flex h-40 w-full shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 sm:w-40"
            >
              <img src={c.imagem_url} alt={c.nome} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" />
              <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 size={14} />
              </span>
            </button>
          ) : (
            <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 sm:w-40">
              <Package size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-2xl font-black leading-tight">{c.nome}</h2>
              <StatusBadge status={statusStock} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tiposDe(c).map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    i === 0
                      ? "border-orange-500/40 bg-orange-500/10 text-orange-500"
                      : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
            {c.localizacao && (
              <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} className="mr-1 shrink-0" /> {c.localizacao}
              </p>
            )}
            {c.datasheet_url && (
              <a
                href={c.datasheet_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-500 hover:bg-blue-500/20"
              >
                <ExternalLink size={14} className="mr-1.5" /> Abrir datasheet
              </a>
            )}
          </div>
        </div>

        {/* Números */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { l: "No inventário", v: c.quantidade, cor: "" },
            { l: "Disponíveis", v: resumoEmp.disponivel, cor: "text-green-500" },
            { l: "Emprestados", v: resumoEmp.emprestado, cor: resumoEmp.emprestado > 0 ? "text-blue-500" : "text-gray-500" },
          ].map((n) => (
            <div key={n.l} className="rounded-2xl border border-gray-200 p-3 text-center dark:border-gray-700">
              <p className={`text-2xl font-black tabular-nums ${n.cor}`}>{n.v}</p>
              <p className="text-[10px] font-bold uppercase text-gray-500">{n.l}</p>
            </div>
          ))}
        </div>

        {/* Estado geral */}
        <div className="mb-5">
          <div className="mb-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            {ESTADOS.map((e) => (
              <div key={e} className={ESTILO_ESTADO[e].dot} style={{ width: `${barra(e)}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
            <span className={ESTILO_ESTADO.bom.text}>{plural(resumo.bom, "bom", "bons")}</span>
            <span className={ESTILO_ESTADO.duvidoso.text}>{plural(resumo.duvidoso, "duvidoso", "duvidosos")}</span>
            <span className={ESTILO_ESTADO.ruim.text}>{plural(resumo.ruim, "ruim", "ruins")}</span>
          </div>
        </div>

        {/* Descrição */}
        {(c.descricao_completa || c.descricao) && (
          <section className="mb-5">
            <h4 className="label">Descrição</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {c.descricao_completa || c.descricao}
            </p>
            {c.descricao_completa && c.descricao && (
              <p className="mt-2 text-xs italic text-gray-500">Resumo: {c.descricao}</p>
            )}
          </section>
        )}

        {/* Unidades */}
        <section className="mb-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="label !mb-0 flex items-center">
              <Layers size={14} className="mr-1.5" /> Unidades
            </h4>
            {podeEditar && (
              <div className="flex gap-2">
                {resumo.padrao > 1 && resumo.padrao <= 100 && (
                  <button onClick={() => void detalharTodas()} className="btn-ghost !px-3 !py-1.5 text-xs" title="Cria uma unidade específica para cada unidade padrão">
                    <ListChecks size={14} /> Detalhar todas
                  </button>
                )}
                <button onClick={() => setUnidadeForm({ aberto: true, editando: null })} className="btn-ghost !px-3 !py-1.5 text-xs">
                  <Plus size={14} /> Unidade específica
                </button>
              </div>
            )}
          </div>

          {/* grupo padrão */}
          {(resumo.padrao > 0 || especificas.length === 0) && (
            <div className="mb-2 rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  {resumo.padrao} {resumo.padrao === 1 ? "unidade padrão" : "unidades padrão"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`font-bold ${ESTILO_ESTADO.bom.text}`}>
                    {plural(padraoBom, "boa", "boas")}
                  </span>
                  {(["qtd_duvidoso", "qtd_ruim"] as const).map((campo) => {
                    const estado: EstadoUnidade = campo === "qtd_duvidoso" ? "duvidoso" : "ruim";
                    const valor = Math.min(c[campo], resumo.padrao);
                    return (
                      <span key={campo} className="inline-flex items-center">
                        {podeEditar && (
                          <button
                            onClick={() => void ajustarPadrao(campo, -1)}
                            disabled={valor <= 0}
                            className="rounded-md border border-gray-300 p-0.5 disabled:opacity-30 dark:border-gray-600"
                            title={`Menos uma ${ESTILO_ESTADO[estado].label.toLowerCase()}`}
                          >
                            <Minus size={12} />
                          </button>
                        )}
                        <span className={`mx-1.5 font-bold ${ESTILO_ESTADO[estado].text}`}>
                          {estado === "duvidoso" ? plural(valor, "duvidosa", "duvidosas") : plural(valor, "ruim", "ruins")}
                        </span>
                        {podeEditar && (
                          <button
                            onClick={() => void ajustarPadrao(campo, 1)}
                            className="rounded-md border border-gray-300 p-0.5 dark:border-gray-600"
                            title={`Mais uma ${ESTILO_ESTADO[estado].label.toLowerCase()}`}
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
              {c.caracteristicas.length > 0 ? (
                <div className="mt-2">
                  <CaracteristicasChips lista={c.caracteristicas} />
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Sem características padrão cadastradas.</p>
              )}
            </div>
          )}

          {/* específicas */}
          {especificas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-gray-500">{especificas.length} específica(s)</p>
              {especificas.map((u) => {
                const com = emprestimoPorUnidade.get(u.id);
                return (
                  <div key={u.id} className="rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ESTILO_ESTADO[u.estado].dot}`} />
                        <span className="truncate font-bold">{u.rotulo}</span>
                        {com && (
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                            Emprestada · {com}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {podeEditar ? (
                          <select
                            value={u.estado}
                            onChange={(e) => mudarEstado(u, e.target.value as EstadoUnidade)}
                            className={`rounded-full border bg-transparent px-2.5 py-1 text-[11px] font-black uppercase outline-none ${ESTILO_ESTADO[u.estado].badge}`}
                          >
                            {ESTADOS.map((e) => (
                              <option key={e} value={e} className="bg-white text-gray-800">
                                {ESTILO_ESTADO[e].label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${ESTILO_ESTADO[u.estado].badge}`}>
                            {ESTILO_ESTADO[u.estado].label}
                          </span>
                        )}
                        {podeEditar && (
                          <>
                            <button
                              onClick={() => setUnidadeForm({ aberto: true, editando: u })}
                              className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-500/10"
                              title="Editar unidade"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => void apagarUnidade(u)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                              title="Apagar unidade"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {u.caracteristicas.length > 0 && (
                      <div className="mt-2">
                        <CaracteristicasChips lista={u.caracteristicas} />
                      </div>
                    )}
                    {u.observacao && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{u.observacao}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Empréstimos */}
        <section className="mb-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="label !mb-0 flex items-center">
              <HandCoins size={14} className="mr-1.5" /> Empréstimos
            </h4>
            <div className="flex gap-2">
              <button onClick={() => setEmprestimoModo("solicitar")} className="btn-ghost !px-3 !py-1.5 text-xs">
                <HandCoins size={14} /> Pedir emprestado
              </button>
              {podeEditar && (
                <button onClick={() => setEmprestimoModo("emprestar")} className="btn-ghost !px-3 !py-1.5 text-xs">
                  <UserRound size={14} /> Emprestar
                </button>
              )}
            </div>
          </div>

          {ativos.length === 0 && pedidos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum empréstimo nem pedido em andamento.</p>
          ) : (
            <ul className="space-y-1.5">
              {ativos.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-500/10 px-3 py-2 text-sm">
                  <span>
                    <b>{e.pessoa_nome}</b> está com {e.quantidade} un.
                    {e.previsao_devolucao && (
                      <span className="text-xs text-gray-500"> · devolver até {dataCurta(e.previsao_devolucao)}</span>
                    )}
                    <span className="block text-[11px] text-gray-500">desde {formatarData(e.emprestado_em)}</span>
                  </span>
                  {podeEditar && (
                    <button onClick={() => void devolver(e.id)} className="btn-ghost !px-2.5 !py-1 text-xs">
                      <Undo2 size={13} /> Devolvido
                    </button>
                  )}
                </li>
              ))}
              {pedidos.map((e) => (
                <li key={e.id} className="rounded-xl bg-yellow-500/10 px-3 py-2 text-sm">
                  <b>{e.pessoa_nome}</b> pediu {e.quantidade} un.{" "}
                  <span className="text-xs text-gray-500">(aguardando — veja na aba Empréstimos)</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Rodapé */}
        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex gap-2">
            {podeEditar && (
              <button onClick={onEditar} className="btn-ghost">
                <Pencil size={16} /> Editar
              </button>
            )}
            {podeExcluir && (
              <button onClick={onExcluir} className="btn-danger">
                <Trash2 size={16} /> Apagar
              </button>
            )}
          </div>
          <button onClick={onFechar} className="btn-primary">
            Fechar
          </button>
        </div>
      </Modal>

      {imagemGrande && c.imagem_url && (
        <Modal titulo={c.nome} onFechar={() => setImagemGrande(false)} largura="max-w-4xl">
          <img src={c.imagem_url} alt={c.nome} className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain" />
        </Modal>
      )}

      {unidadeForm.aberto && (
        <UnidadeForm
          componente={c}
          inicial={unidadeForm.editando}
          rotuloSugerido={proximoRotulo}
          unidadesPadrao={resumo.padrao}
          onSalvar={salvarUnidade}
          onFechar={() => setUnidadeForm({ aberto: false, editando: null })}
        />
      )}
      {emprestimoModo && <EmprestimoForm modo={emprestimoModo} componente={c} onFechar={() => setEmprestimoModo(null)} />}
    </>
  );
}
