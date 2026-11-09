import { HandCoins, MapPin, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import type { Componente, Emprestimo, Unidade } from "../../types";
import { ESTILO_ESTADO, resumirEmprestimos, resumirUnidades } from "../../utils/componente";
import { ESTILO_STATUS, statusEstoque } from "../../utils/estoque";
import { plural } from "../../utils/format";
import StatusBadge from "../ui/StatusBadge";

interface Props {
  item: Componente;
  unidades: Unidade[];
  emprestimos: Emprestimo[];
  onAbrir: () => void;
  onPedir: () => void;
  podeEditar: boolean;
  podeExcluir: boolean;
  onAjustar: (delta: number) => void;
  onEditar: () => void;
  onExcluir: () => void;
}

export default function ComponenteCard({
  item,
  unidades,
  emprestimos,
  onAbrir,
  onPedir,
  podeEditar,
  podeExcluir,
  onAjustar,
  onEditar,
  onExcluir,
}: Props) {
  const resumo = resumirUnidades(item, unidades);
  const emp = resumirEmprestimos(item, emprestimos);
  const parar = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const status = statusEstoque(item);
  const estilo = ESTILO_STATUS[status];
  const referencia = Math.max(item.quantidade_minima * 2, 1);
  const largura = Math.min(100, (item.quantidade / referencia) * 100);

  return (
    <div
      onClick={onAbrir}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && onAbrir()}
      className={`card flex group cursor-pointer flex-col p-4 transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-orange-500/60 hover:shadow-xl hover:shadow-orange-500/20 active:translate-y-0 active:scale-[0.99] ${
        status !== "ok" ? "border-red-500/40 dark:border-red-500/40" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold md:text-base" title={item.nome}>
            {item.nome}
          </h3>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">{item.tipo}</span>
          {(item.outros_tipos ?? []).map((t) => (
            <span key={t} className="ml-1.5 rounded-full border border-gray-300 px-1.5 py-px text-[9px] font-bold uppercase text-gray-500 dark:border-gray-600">
              {t}
            </span>
          ))}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="my-2 flex items-center justify-between">
        {podeEditar ? (
          <button
            onClick={parar(() => onAjustar(-1))}
            disabled={resumo.padrao <= 0}
            className="rounded-lg border border-gray-300 p-1.5 transition-all hover:bg-gray-100 active:scale-90 disabled:opacity-30 dark:border-gray-600 dark:hover:bg-gray-700"
            title={resumo.padrao <= 0 ? "Só restam unidades específicas: apague-as na ficha" : "Retirar 1"}
          >
            <Minus size={16} />
          </button>
        ) : (
          <span />
        )}

        <div className="text-center">
          <span className={`text-3xl font-black tabular-nums ${estilo.text}`}>{item.quantidade}</span>
          <p className="text-[10px] font-bold uppercase text-gray-500">mín. {item.quantidade_minima}</p>
        </div>

        {podeEditar ? (
          <button
            onClick={parar(() => onAjustar(1))}
            className="rounded-lg border border-gray-300 p-1.5 transition-all hover:bg-gray-100 active:scale-90 dark:border-gray-600 dark:hover:bg-gray-700"
            title="Adicionar 1"
          >
            <Plus size={16} />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-1.5 rounded-full transition-all ${estilo.bar}`} style={{ width: `${largura}%` }} />
      </div>

      {(resumo.duvidoso > 0 || resumo.ruim > 0) && (
        <p className="mb-1 flex flex-wrap gap-x-3 text-[11px] font-bold">
          {resumo.duvidoso > 0 && (
            <span className={ESTILO_ESTADO.duvidoso.text}>● {plural(resumo.duvidoso, "duvidoso", "duvidosos")}</span>
          )}
          {resumo.ruim > 0 && <span className={ESTILO_ESTADO.ruim.text}>● {plural(resumo.ruim, "ruim", "ruins")}</span>}
        </p>
      )}
      {emp.emprestado > 0 && (
        <p className="mb-1 truncate rounded-lg bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-500" title={emp.pessoas.join(", ")}>
          Emprestado: {emp.emprestado} · {emp.pessoas.join(", ")}
        </p>
      )}
      {item.localizacao && (
        <p className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <MapPin size={12} className="mr-1 shrink-0" />
          <span className="truncate">{item.localizacao}</span>
        </p>
      )}
      {item.descricao && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400" title={item.descricao}>
          {item.descricao}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-1 pt-3">
        <button
          onClick={parar(onPedir)}
          className="inline-flex items-center rounded-lg px-2 py-1.5 text-[11px] font-bold text-gray-500 transition-all hover:bg-blue-500/10 hover:text-blue-500"
          title="Pedir este componente emprestado"
        >
          <HandCoins size={14} className="mr-1" /> Pedir emprestado
        </button>
        <div className="flex gap-1">
          {podeEditar && (
            <button
              onClick={parar(onEditar)}
              className="rounded-lg p-2 text-blue-500 transition-all hover:bg-blue-500/10"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
          )}
          {podeExcluir && (
            <button
              onClick={parar(onExcluir)}
              className="rounded-lg p-2 text-red-500 transition-all hover:bg-red-500/10"
              title="Apagar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
