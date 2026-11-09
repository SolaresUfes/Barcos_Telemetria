import { Plus, X } from "lucide-react";
import type { Caracteristica } from "../../types";
import { SUGESTOES_CARACTERISTICAS } from "../../utils/constants";

interface Props {
  valor: Caracteristica[];
  onChange: (v: Caracteristica[]) => void;
  vazioTexto?: string;
}

export default function CaracteristicasEditor({ valor, onChange, vazioTexto }: Props) {
  const mudar = (i: number, campo: keyof Caracteristica, texto: string) =>
    onChange(valor.map((c, idx) => (idx === i ? { ...c, [campo]: texto } : c)));

  return (
    <div className="space-y-2">
      {valor.length === 0 && vazioTexto && <p className="text-xs text-gray-500">{vazioTexto}</p>}
      {valor.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="input !py-2"
            list="sugestoes-caracteristicas"
            placeholder="Ex: Conector"
            value={c.chave}
            onChange={(e) => mudar(i, "chave", e.target.value)}
          />
          <input
            className="input !py-2"
            placeholder="Ex: USB-C"
            value={c.valor}
            onChange={(e) => mudar(i, "valor", e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(valor.filter((_, idx) => idx !== i))}
            className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-500/10"
            title="Remover"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <datalist id="sugestoes-caracteristicas">
        {SUGESTOES_CARACTERISTICAS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <button type="button" onClick={() => onChange([...valor, { chave: "", valor: "" }])} className="btn-ghost !px-3 !py-1.5 text-xs">
        <Plus size={14} /> Adicionar característica
      </button>
    </div>
  );
}

/** Remove linhas vazias antes de salvar. */
export const limparCaracteristicas = (lista: Caracteristica[]): Caracteristica[] =>
  lista
    .map((c) => ({ chave: c.chave.trim(), valor: c.valor.trim() }))
    .filter((c) => c.chave !== "" || c.valor !== "");

export function CaracteristicasChips({ lista }: { lista: Caracteristica[] }) {
  if (!lista || lista.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map((c, i) => (
        <span
          key={i}
          className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] dark:border-gray-700 dark:bg-gray-900"
        >
          <span className="text-gray-500">{c.chave}:</span> <b>{c.valor}</b>
        </span>
      ))}
    </div>
  );
}
