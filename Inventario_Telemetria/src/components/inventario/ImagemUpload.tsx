import { useRef, useState } from "react";
import { ImagePlus, Link2, Trash2 } from "lucide-react";
import { apagarImagem, enviarImagem } from "../../utils/imagem";

interface Props {
  valor: string | null;
  onChange: (url: string | null) => void;
}

export default function ImagemUpload({ valor, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [usandoLink, setUsandoLink] = useState(false);

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro("");
    setEnviando(true);
    try {
      const url = await enviarImagem(arquivo);
      onChange(url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar a imagem.");
    }
    setEnviando(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
          {valor ? (
            <img src={valor} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={24} className="text-gray-400" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void aoEscolher(e)} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={enviando} className="btn-ghost !px-3 !py-1.5 text-xs">
            <ImagePlus size={14} /> {enviando ? "Enviando..." : valor ? "Trocar imagem" : "Enviar imagem"}
          </button>
          <button type="button" onClick={() => setUsandoLink((v) => !v)} className="btn-ghost !px-3 !py-1.5 text-xs">
            <Link2 size={14} /> Usar link
          </button>
          {valor && (
            <button
              type="button"
              onClick={() => {
                void apagarImagem(valor);
                onChange(null);
              }}
              className="btn-danger !px-3 !py-1.5 text-xs"
            >
              <Trash2 size={14} /> Remover
            </button>
          )}
        </div>
      </div>
      {usandoLink && (
        <input
          className="input mt-2"
          type="url"
          placeholder="https://... (link direto da imagem)"
          value={valor ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || null)}
        />
      )}
      {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
      <p className="mt-1 text-[11px] text-gray-500">A imagem só aparece quando o card do componente é aberto.</p>
    </div>
  );
}
