import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c9cff" },
    secondary: { main: "#b388ff" },
    background: {
      default: "#0f1117",
      paper: "#171b24",
    },
    success: { main: "#4ade80" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(145deg, #171b24 0%, #12151d 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
  },
});
