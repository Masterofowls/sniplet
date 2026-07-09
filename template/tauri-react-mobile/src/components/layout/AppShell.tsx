import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  children: ReactNode;
  onMenuClick?: () => void;
  actions?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  bottomPadding?: number;
}

export function AppShell({
  title,
  children,
  onMenuClick,
  actions,
  maxWidth = "lg",
  bottomPadding = 4,
}: AppShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          {onMenuClick && (
            <IconButton edge="start" aria-label="menu" onClick={onMenuClick} color="inherit">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
            {title}
          </Typography>
          {actions}
        </Toolbar>
      </AppBar>
      <Container maxWidth={maxWidth} sx={{ py: 2, pb: bottomPadding }}>
        {children}
      </Container>
    </Box>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <CssBaseline />
      {children}
    </>
  );
}
