import type { UseToast } from "../hooks/useToast";
import type { UseAuth } from "../hooks/useAuth";
import type { UseTheme } from "../hooks/useTheme";
import type { UseNavigation } from "../hooks/useNavigation";
import type { UseClock } from "../hooks/useClock";
import type { UseMemberAdmin } from "../hooks/useMemberAdmin";
import type { UseDiary } from "../hooks/useDiary";
import type { UseRecording } from "../hooks/useRecording";
import type { UseSavedRuns } from "../hooks/useSavedRuns";
import type { UseTelemetry } from "../hooks/useTelemetry";
import type { UsePresence } from "../hooks/usePresence";
import type { UseGraphs } from "../hooks/useGraphs";
import type { DerivedMetrics } from "../utils/deriveMetrics";

/** Tudo que os hooks do App expõem, num tipo só. Componentes escolhem o que precisam com Pick<>. */
export type AppContext =
  UseToast
  & UseAuth
  & UseTheme
  & UseNavigation
  & UseClock
  & UseMemberAdmin
  & UseDiary
  & UseRecording
  & UseSavedRuns
  & UseTelemetry
  & UsePresence
  & UseGraphs
  & DerivedMetrics;
