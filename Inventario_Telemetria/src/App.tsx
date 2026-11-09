import AppShell from "./components/layout/AppShell";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { DataProvider } from "./hooks/useData";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./hooks/useToast";
import { supabaseConfigurado } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import { Carregando, ConfigFaltando, SemAcesso } from "./pages/TelasEspeciais";

function Gate() {
  const { user, loading } = useAuth();

  if (!supabaseConfigurado) return <ConfigFaltando />;
  if (loading) return <Carregando />;
  if (!user) return <LoginPage />;
  if (!user.isModerador && !user.mainRole) return <SemAcesso />;

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
