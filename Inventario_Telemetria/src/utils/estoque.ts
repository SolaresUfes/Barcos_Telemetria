import type { Componente, StatusEstoque } from "../types";

export function statusEstoque(c: Pick<Componente, "quantidade" | "quantidade_minima">): StatusEstoque {
  if (c.quantidade <= 0) return "falta";
  if (c.quantidade <= c.quantidade_minima) return "baixo";
  return "ok";
}

export const ESTILO_STATUS: Record<StatusEstoque, { label: string; badge: string; bar: string; text: string }> = {
  falta: {
    label: "Em falta",
    badge: "bg-red-500/15 text-red-500 border-red-500/30",
    bar: "bg-red-500",
    text: "text-red-500",
  },
  baixo: {
    label: "Estoque baixo",
    badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    bar: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  ok: {
    label: "OK",
    badge: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
};
