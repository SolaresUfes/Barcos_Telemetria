import { useState } from "react";
import type { Caracteristica, Componente, EstadoUnidade, Unidade } from "../../types";
import { ESTADOS, ESTILO_ESTADO } from "../../utils/componente";
import Modal from "../ui/Modal";
import CaracteristicasEditor, { limparCaracteristicas } from "./CaracteristicasEditor";

export interface DadosUnidade {
  rotulo: string;
  estado: EstadoUnidade;
  caracteristicas: Caracteristica[];
  observacao: string | null;
  /** só na criação: true = esta unidade já estava contada como "padrão" (o estoque não aumenta) */
  saiuDoPadrao: boolean;
}

interface Props {
  componente: Componente;
  inicial?: Unidade | null;
  rotuloSugerido: string;
  unidadesPadrao: number;
  onSalvar: (dados: DadosUnidade) => Promise<boolean>;
  onFechar: () => void;
}

export default function UnidadeForm({ componente, inicial, rotuloSugerido, unidadesPadrao, onSalvar, onFechar }: Props) {
  const [rotulo, setRotulo] = useState(inicial?.rotulo ?? rotuloSugerido);
  const [estado, setEstado] = useState<EstadoUnidade>(inicial?.estado ?? "bom");
  // Nova unidade começa com as características padrão: é só mudar o que for diferente
  const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>(
    inicial?.caracteristicas ?? componente.caracteristicas.map((c) => ({ ...c })),
  );
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");
  const [saiuDoPadrao, setSaiuDoPadrao] = useState(unidadesPadrao > 0);
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const ok = await onSalvar({
      rotulo: rotulo.trim() || rotuloSugerido,
      estado,
      caracteristicas: limparCaracteristicas(caracteristicas),
      observacao: observacao.trim() || null,
      saiuDoPadrao: !inicial && saiuDoPadrao && unidadesPadrao > 0,
    });
    setSalvando(false);
    if (ok) onFechar();
  };

  return (
    <Modal titulo={inicial ? "Editar unidade" : "Nova unidade específica"} onFechar={onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="label">Identificação</label>
          <input className="input" autoFocus value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
          <p className="mt-1 text-[11px] text-gray-500">Ex: #1, número de série, "a que tem a ponta de solda queimada"...</p>
        </div>

        <div>
          <label className="label">Estado</label>
          <div className="grid grid-cols-3 gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEstado(e)}
                className={`rounded-xl border px-3 py-2 text-xs font-black uppercase transition-all ${
                  estado === e ? ESTILO_ESTADO[e].badge + " ring-2 ring-current" : "border-gray-300 text-gray-500 dark:border-gray-700"
                }`}
              >
                {ESTILO_ESTADO[e].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Características desta unidade</label>
          <CaracteristicasEditor
            valor={caracteristicas}
            onChange={setCaracteristicas}
            vazioTexto="Sem características. Adicione o que a diferencia das outras (ex: Conector: Micro USB)."
          />
        </div>

        <div>
          <label className="label">Observação</label>
          <textarea className="input resize-none" rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>

        {!inicial && unidadesPadrao > 0 && (
          <label className="flex cursor-pointer items-start space-x-2 text-sm">
            <input
              type="checkbox"
              checked={saiuDoPadrao}
              onChange={(e) => setSaiuDoPadrao(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span>
              Esta unidade já estava contada entre as {unidadesPadrao} padrão
              <span className="block text-xs text-gray-500">
                Marcado: o estoque continua {componente.quantidade}. Desmarcado: é uma unidade nova e o estoque sobe para{" "}
                {componente.quantidade + 1}.
              </span>
            </span>
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onFechar} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="btn-primary flex-1">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
