import { useState } from "react";

export function useNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pilotMode, setPilotMode] = useState(false);
  const [showPilotMap, setShowPilotMap] = useState(false);
  const [activeTab, setActiveTab] = useState("Resumo");

  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isPilotMapFullscreen, setIsPilotMapFullscreen] = useState(false);

  const [showOnlineMenu, setShowOnlineMenu] = useState<{ top: number; left: number } | null>(null);
  return {
    sidebarOpen,
    setSidebarOpen,
    pilotMode,
    setPilotMode,
    showPilotMap,
    setShowPilotMap,
    activeTab,
    setActiveTab,
    isMapFullscreen,
    setIsMapFullscreen,
    isPilotMapFullscreen,
    setIsPilotMapFullscreen,
    showOnlineMenu,
    setShowOnlineMenu,

  };
}

export type UseNavigation = ReturnType<typeof useNavigation>;
