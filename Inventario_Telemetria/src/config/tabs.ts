import {
  AlertTriangle,
  BadgeDollarSign,
  BookOpen,
  FileSpreadsheet,
  HandCoins,
  LayoutDashboard,
  Package,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type TabId =
  | "Resumo"
  | "Inventário"
  | "Alertas"
  | "Diário de Bordo"
  | "Empréstimos"
  | "Orçamento"
  | "Melhores Preços"
  | "Importar/Exportar"
  | "Equipe";

export interface TabConfig {
  id: TabId;
  icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { id: "Resumo", icon: LayoutDashboard },
  { id: "Inventário", icon: Package },
  { id: "Alertas", icon: AlertTriangle },
  { id: "Diário de Bordo", icon: BookOpen },
  { id: "Empréstimos", icon: HandCoins },
  { id: "Orçamento", icon: Wallet },
  { id: "Melhores Preços", icon: BadgeDollarSign },
  { id: "Importar/Exportar", icon: FileSpreadsheet },
  { id: "Equipe", icon: Users },
];
