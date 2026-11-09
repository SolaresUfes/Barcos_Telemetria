import type { StatusEstoque } from "../../types";
import { ESTILO_STATUS } from "../../utils/estoque";

export default function StatusBadge({ status }: { status: StatusEstoque }) {
  const e = ESTILO_STATUS[status];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${e.badge}`}>
      {e.label}
    </span>
  );
}
