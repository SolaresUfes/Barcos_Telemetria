import { useState } from "react";
import { X } from "lucide-react";
import type { Caracteristica, Componente, NovoComponente } from "../../types";
import { TIPOS_COMPONENTE, TIPOS_EXTRAS_SUGERIDOS } from "../../utils/constants";
import Modal from "../ui/Modal";
import CaracteristicasEditor, { limparCaracteristicas } from "./CaracteristicasEditor";
import ImagemUpload from "./ImagemUpload";

export interface OpcoesCriacao {
  /** Só na criação: cria uma unidade específica para cada item (em vez de tudo "padrão"). */
  unidadesIndividuais: boolean;
}

interface Props {
  inicial?: Componente | null;
  tiposExtras: string[];
  onSalvar: (dados: NovoComponente, opcoes: OpcoesCriacao) => Promise<boolean>;
  onFechar: () => void;
}

export default function ComponenteForm({ inicial, tiposExtras, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tipo, setTipo] = useState(inicial?.tipo ?? TIPOS_COMPONENTE[0]);
  const [outrosTipos, setOutrosTipos] = useState<string[]>(inicial?.outros_tipos ?? []);
  const [novoOutro, setNovoOutro] = useState("");
  const [quantidade, setQuantidade] = useState(String(inicial?.quantidade ?? 0));
  const [minima, setMinima] = useState(String(inicial?.quantidade_minima ?? 0));
  const [localizacao, setLocalizacao] = useState(inicial?.localizacao ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [descricaoCompleta, setDescricaoCompleta] = useState(inicial?.descricao_completa ?? "");
  const [datasheet, setDatasheet] = useState(inicial?.datasheet_url ?? "");
  const [imagem, setImagem] = useState<string | null>(inicial?.imagem_url ?? null);
  const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>(inicial?.caracteristicas ?? []);
  const [individuais, setIndividuais] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const todosTipos = Array.from(new Set([...TIPOS_COMPONENTE, ...tiposExtras]));
  const sugestoesExtras = Array.from(new Set([...TIPOS_EXTRAS_SUGERIDOS, ...todosTipos])).filter(
    (t) => t !== tipo.trim() && !outrosTipos.includes(t),
  );

  const adicionarOutro = (valor: string) => {
    const v = valor.trim();
    if (v && v !== tipo.trim() && !outrosTipos.some((t) => t.toLowerCase() === v.toLowerCase())) {
      setOutrosTipos([...outrosTipos, v]);
    }
    setNovoOutro("");
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const qtd = Math.max(0, parseInt(quantidade) || 0);
    const tipoPrincipal = tipo.trim() || "Outro";
    const extras = [...outrosTipos];
    const pendente = novoOutro.trim();
    if (pendente && !extras.some((t) => t.toLowerCase() === pendente.toLowerCase())) extras.push(pendente);

    const ok = await onSalvar(
      {
        nome: nome.trim(),
        tipo: tipoPrincipal,
        outros_tipos: extras.filter((t) => t !== tipoPrincipal),
        quantidade: qtd,
        quantidade_minima: Math.max(0, parseInt(minima) || 0),
        localizacao: localizacao.trim() || null,
        descricao: descricao.trim() || null,
        descricao_completa: descricaoCompleta.trim() || null,
        datasheet_url: datasheet.trim() || null,
        imagem_url: imagem,
        caracteristicas: limparCaracteristicas(caracteristicas),
        // contadores de estado das unidades padrão: mantém o que já existe (editados no detalhe)
        qtd_duvidoso: inicial?.qtd_duvidoso ?? 0,
        qtd_ruim: inicial?.qtd_ruim ?? 0,
      },
      { unidadesIndividuais: !inicial && individuais && qtd > 0 },
    );
    setSalvando(false);
    if (ok) onFechar();
  };

  return (
    <Modal titulo={inicial ? "Editar componente" : "Novo componente"} onFechar={onFechar} largura="max-w-xl">
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="label">Nome *</label>
          <input
            className="input"
            required
            autoFocus
            placeholder="Ex: ESP32 DevKit V1"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tipo principal</label>
            <input className="input" list="lista-tipos" value={tipo} onChange={(e) => setTipo(e.target.value)} />
            <datalist id="lista-tipos">
              {todosTipos.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Outros tipos (ex: Básico)</label>
            <input
              className="input"
              list="lista-tipos-extras"
              placeholder="Digite e aperte Enter"
              value={novoOutro}
              onChange={(e) => setNovoOutro(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarOutro(novoOutro);
                }
              }}
              onBlur={() => novoOutro && adicionarOutro(novoOutro)}
            />
            <datalist id="lista-tipos-extras">
              {sugestoesExtras.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
        {outrosTipos.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-1.5">
            {outrosTipos.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-500"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setOutrosTipos(outrosTipos.filter((x) => x !== t))}
                  className="ml-1 rounded-full hover:bg-orange-500/20"
                  title="Remover"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {!outrosTipos.includes("Básico") && (
          <button
            type="button"
            onClick={() => adicionarOutro("Básico")}
            className="-mt-1 text-xs font-bold text-orange-500 hover:underline"
          >
            + marcar como Básico
          </button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantidade</label>
            <input
              className="input"
              type="number"
              min={0}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mínimo (alerta)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={minima}
              onChange={(e) => setMinima(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Localização</label>
          <input
            className="input"
            placeholder="Ex: Armário 2 · Gaveta B"
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Descrição curta (aparece na lista)</label>
          <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>

        <div>
          <label className="label">Descrição completa (aparece ao abrir o card)</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Para que serve, como usar, cuidados, pinagem..."
            value={descricaoCompleta}
            onChange={(e) => setDescricaoCompleta(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Link do datasheet</label>
          <input
            className="input"
            type="url"
            placeholder="https://..."
            value={datasheet}
            onChange={(e) => setDatasheet(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Imagem</label>
          <ImagemUpload valor={imagem} onChange={setImagem} />
        </div>

        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <label className="label">Características padrão</label>
          <p className="mb-3 text-xs text-gray-500">
            Valem para todas as unidades "padrão" (ex: Conector: USB-C). Unidades que fogem do padrão podem ser
            cadastradas depois, uma a uma, dentro do card.
          </p>
          <CaracteristicasEditor valor={caracteristicas} onChange={setCaracteristicas} />
        </div>

        {!inicial && (
          <label className="flex cursor-pointer items-start space-x-2 text-sm">
            <input
              type="checkbox"
              checked={individuais}
              onChange={(e) => setIndividuais(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span>
              Cadastrar cada unidade separadamente
              <span className="block text-xs text-gray-500">
                Cria uma unidade específica para cada item (bom / duvidoso / ruim e características próprias). Deixe
                desmarcado para itens iguais, como jumpers e resistores.
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
