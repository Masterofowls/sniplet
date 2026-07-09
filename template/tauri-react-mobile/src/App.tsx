import { Snackbar, ThemeProvider } from "@mui/material";
import { useEffect } from "react";
import { AppProviders, AppShell } from "./components/layout/AppShell";
import { useToast } from "./hooks/useToast";
import { HomePage } from "./pages/HomePage";
import { useAppStore } from "./store/appStore";
import { theme } from "./theme/theme";
import "./App.css";

function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const { message, show, clear } = useToast();

  useEffect(() => {
    void hydrate().catch((err) => show(String(err)));
  }, [hydrate, show]);

  return (
    <ThemeProvider theme={theme}>
      <AppProviders>
        <AppShell title="{{APP_NAME}}">
          <HomePage />
        </AppShell>
        <Snackbar
          open={Boolean(message)}
          autoHideDuration={2600}
          onClose={clear}
          message={message}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </AppProviders>
    </ThemeProvider>
  );
}

export default App;
