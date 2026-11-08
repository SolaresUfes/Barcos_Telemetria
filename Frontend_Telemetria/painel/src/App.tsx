import type { ComponentType } from "react";
import { useToast } from "./hooks/useToast";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { useNavigation } from "./hooks/useNavigation";
import { useClock } from "./hooks/useClock";
import { useMemberAdmin } from "./hooks/useMemberAdmin";
import { useDiary } from "./hooks/useDiary";
import { useRecording } from "./hooks/useRecording";
import { useSavedRuns } from "./hooks/useSavedRuns";
import { useTelemetry } from "./hooks/useTelemetry";
import { usePresence } from "./hooks/usePresence";
import { useGraphs } from "./hooks/useGraphs";
import { deriveMetrics } from "./utils/deriveMetrics";
import type { AppContext } from "./types/appContext";
import { BatteriesView } from "./components/views/BatteriesView";
import { SettingsView } from "./components/views/SettingsView";
import { SummaryView } from "./components/views/SummaryView";
import { LogsView } from "./components/views/LogsView";
import { AnalysisView } from "./components/views/AnalysisView";
import { MapView } from "./components/views/MapView";
import { PowerView } from "./components/views/PowerView";
import { DiaryView } from "./components/views/DiaryView";
import { LoadingScreen } from "./components/screens/LoadingScreen";
import { LoginScreen } from "./components/screens/LoginScreen";
import { AccessDeniedScreen } from "./components/screens/AccessDeniedScreen";
import { PilotMode } from "./components/screens/PilotMode";
import { PrintStyles } from "./components/layout/PrintStyles";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { FinalizeModal } from "./components/overlays/FinalizeModal";
import { Toast } from "./components/overlays/Toast";
import { SavedRunsModal } from "./components/overlays/SavedRunsModal";
import { ExpandedGraphModal } from "./components/overlays/ExpandedGraphModal";
import { OverlayModal } from "./components/overlays/OverlayModal";
import { InfoModal } from "./components/overlays/InfoModal";
import { PokeNotice } from "./components/overlays/PokeNotice";
import { OnlineMenu } from "./components/overlays/OnlineMenu";

/** Abas do painel de engenharia: nome no menu lateral -> componente. */
const VIEWS: Record<string, ComponentType<AppContext>> = {
  Baterias: BatteriesView,
  Configurações: SettingsView,
  Resumo: SummaryView,
  "Logs de Dados": LogsView,
  Análise: AnalysisView,
  Mapa: MapView,
  Potência: PowerView,
  "Diário de Bordo": DiaryView,
};

export default function App() {
  // --- Estado e lógica (cada hook cuida de uma área) ---
  const toastApi = useToast();
  const auth = useAuth();
  const theme = useTheme(auth.currentUser);
  const nav = useNavigation();
  const clock = useClock();
  const memberAdmin = useMemberAdmin(auth.members, auth.setMembers);
  const diary = useDiary(auth.currentUser, toastApi.dispararToast);
  const recording = useRecording(toastApi.dispararToast);
  const savedRuns = useSavedRuns(toastApi.dispararToast);
  const telemetry = useTelemetry(auth.currentUser, recording.provaAtivaRef, recording.setRecordingData);
  const presence = usePresence(auth.currentUser, auth.setMembers, toastApi.dispararToast);
  const graphs = useGraphs(recording.provaAtiva, recording.recordingData, telemetry.idleData);
  const metrics = deriveMetrics({
    battery: telemetry.battery,
    batteryHistoryRate: telemetry.batteryHistoryRate,
    cells: telemetry.cells,
    members: auth.members,
    currentTime: clock.currentTime,
    mainData: telemetry.mainData,
    rpm: telemetry.rpm,
    S1_power: telemetry.S1_power,
    tensaoReal: telemetry.tensaoReal,
    correnteRealBateria: telemetry.correnteRealBateria,
    batteryPowerHistory: telemetry.batteryPowerHistory,
    currentUser: auth.currentUser,
  });

  const ctx: AppContext = {
    ...toastApi, ...auth, ...theme, ...nav, ...clock, ...memberAdmin, ...diary,
    ...recording, ...savedRuns, ...telemetry, ...presence, ...graphs, ...metrics,
  };
  const { currentUser, darkMode, activeTab } = ctx;

  // --- Telas que ocupam a janela inteira ---
  if (ctx.isLoadingSession) return <LoadingScreen />;
  if (!ctx.isLogged) return <LoginScreen {...ctx} />;
  if (currentUser && !currentUser.isModerador && currentUser.mainRole === "") {
    return <AccessDeniedScreen {...ctx} />;
  }
  if (ctx.pilotMode) return <PilotMode {...ctx} />;

  // --- Painel de engenharia ---
  const ActiveView = VIEWS[activeTab];

  return (
    <div
      className={`flex h-[100dvh] w-full transition-colors duration-300 font-sans overflow-hidden ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`}
    >
      <PrintStyles />
      <Sidebar {...ctx} />

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0">
        <Header {...ctx} />

        <div className="flex-1 overflow-hidden p-2 md:p-6 flex flex-col min-h-0 relative">
          {ActiveView ? (
            <ActiveView {...ctx} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              <p className="text-xl">Área de {activeTab} em desenvolvimento.</p>
            </div>
          )}
        </div>
      </main>

      <FinalizeModal {...ctx} />
      <Toast {...ctx} />
      <SavedRunsModal {...ctx} />
      <ExpandedGraphModal {...ctx} />
      <OverlayModal {...ctx} />
      <InfoModal {...ctx} />
      <PokeNotice {...ctx} />
      <OnlineMenu {...ctx} />
    </div>
  );
}
