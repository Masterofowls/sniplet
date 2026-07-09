import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import GitHubIcon from "@mui/icons-material/GitHub";
import LogoutIcon from "@mui/icons-material/Logout";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import * as github from "../lib/githubSync";
import type { AuthStatus } from "../lib/types";
import { useSnippetStore } from "../store/snippetStore";

const PAT_DOCS_URL = "https://github.com/settings/tokens/new?scopes=gist&description=Sniplet";

interface GitHubSyncPanelProps {
  open: boolean;
  onClose: () => void;
}

export function GitHubSyncPanel({ open, onClose }: GitHubSyncPanelProps) {
  const auth = useSnippetStore((s) => s.auth);
  const refreshAuth = useSnippetStore((s) => s.refreshAuth);
  const pushSync = useSnippetStore((s) => s.pushSync);
  const pullSync = useSnippetStore((s) => s.pullSync);
  const logout = useSnippetStore((s) => s.logout);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (open) {
      refreshAuth();
      setError(null);
      setToken("");
    }
  }, [open, refreshAuth]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await github.connectWithToken(token);
      useSnippetStore.setState({ auth: status });
      setToken("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    setError(null);
    try {
      await pushSync();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    setError(null);
    try {
      await pullSync();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToken("");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <GitHubIcon />
          <span>GitHub Sync</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {auth?.authenticated ? (
            <AuthenticatedPanel auth={auth} />
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste a GitHub personal access token with the <strong>gist</strong> scope. Snippets
                sync to a private Gist stored on your device.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Personal access token"
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="ghp_..."
                  fullWidth
                  autoComplete="off"
                  disabled={loading}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && token.trim()) {
                      void handleConnect();
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Create a token at{" "}
                  <Link href={PAT_DOCS_URL} target="_blank" rel="noopener noreferrer">
                    github.com/settings/tokens
                  </Link>{" "}
                  (classic token with <strong>gist</strong> scope).
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<GitHubIcon />}
                  onClick={handleConnect}
                  disabled={loading || !token.trim()}
                >
                  Connect
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {auth?.authenticated && (
          <>
            <Button startIcon={<LogoutIcon />} onClick={handleLogout}>
              Disconnect
            </Button>
            <Button startIcon={<CloudDownloadIcon />} onClick={handlePull} disabled={loading}>
              Pull
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handlePush}
              disabled={loading}
            >
              Push
            </Button>
          </>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function AuthenticatedPanel({ auth }: { auth: AuthStatus }) {
  return (
    <Stack spacing={1}>
      <Chip icon={<GitHubIcon />} label={`@${auth.username ?? "connected"}`} color="success" />
      {auth.gist_id && (
        <Typography variant="caption" color="text.secondary">
          Gist: {auth.gist_id}
        </Typography>
      )}
      {auth.last_sync_at && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SyncIcon fontSize="small" />
          <Typography variant="caption" color="text.secondary">
            Last sync: {new Date(auth.last_sync_at).toLocaleString()}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
