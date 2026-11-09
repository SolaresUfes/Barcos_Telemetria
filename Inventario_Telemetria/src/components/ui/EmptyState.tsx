import type { LucideIcon } from "lucide-react";

export default function EmptyState({ icone: Icone, texto }: { icone: LucideIcon; texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500 opacity-70">
      <Icone size={48} className="mb-3 opacity-30" />
      <p className="text-sm font-medium">{texto}</p>
    </div>
  );
}
