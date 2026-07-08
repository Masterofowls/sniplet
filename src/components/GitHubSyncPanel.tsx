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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import * as github from "../lib/githubSync";
import type { AuthStatus } from "../lib/types";
import { useSnippetStore } from "../store/snippetStore";

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
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (open) {
      refreshAuth();
    }
  }, [open, refreshAuth]);

  const startOAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const flow = await github.startDeviceFlow();
      setUserCode(flow.user_code);
      setVerificationUri(flow.verification_uri);
      setPolling(true);

      const poll = async () => {
        try {
          const status = await github.pollDeviceFlow();
          setPolling(false);
          useSnippetStore.setState({ auth: status });
          setUserCode(null);
        } catch (err) {
          const message = String(err);
          if (message.includes("authorization_pending") || message.includes("slow_down")) {
            const delay = message.includes("slow_down")
              ? flow.interval * 2000
              : flow.interval * 1000;
            setTimeout(poll, delay);
            return;
          }
          setPolling(false);
          setError(message);
        }
      };

      setTimeout(poll, flow.interval * 1000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
    setUserCode(null);
    setVerificationUri(null);
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
                Connect with GitHub OAuth device flow. Snippets sync to a private Gist.
              </Typography>
              {userCode ? (
                <Alert severity="info">
                  Enter code <strong>{userCode}</strong> at{" "}
                  <Typography component="span" variant="body2">
                    {verificationUri}
                  </Typography>
                  {polling && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Waiting for authorization...</Typography>
                    </Stack>
                  )}
                </Alert>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<GitHubIcon />}
                  onClick={startOAuth}
                  disabled={loading}
                >
                  Connect GitHub
                </Button>
              )}
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
