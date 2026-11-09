import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icone: LucideIcon;
  cor: string; // ex: "orange" | "blue" | "purple"...
  titulo: string;
  subtitulo: string;
  acao?: ReactNode;
}

const FUNDOS: Record<string, string> = {
  orange: "bg-orange-500/10 text-orange-500",
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
  green: "bg-emerald-500/10 text-emerald-500",
  red: "bg-red-500/10 text-red-500",
  indigo: "bg-indigo-500/10 text-indigo-500",
};

export default function PageHeader({ icone: Icone, cor, titulo, subtitulo, acao }: Props) {
  return (
    <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 md:mb-6">
      <div className="flex items-center space-x-3">
        <div className={`rounded-2xl p-3 ${FUNDOS[cor] ?? FUNDOS.orange}`}>
          <Icone size={26} />
        </div>
        <div>
          <h2 className="text-xl font-bold md:text-2xl">{titulo}</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 md:text-sm">{subtitulo}</p>
        </div>
      </div>
      {acao}
    </div>
  );
}
