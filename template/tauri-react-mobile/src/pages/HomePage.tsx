import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { readClipboard, writeClipboard } from "../lib/clipboard";
import { isTauri } from "../lib/platform";
import { useAppStore } from "../store/appStore";

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function HomePage() {
  const { hydrated, notes, hydrate, setNotes } = useAppStore();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) setDraft(notes);
  }, [hydrated, notes]);

  if (!hydrated) {
    return <LoadingState label="Preparing app..." />;
  }

  const handleSave = async () => {
    setBusy(true);
    try {
      await setNotes(draft);
    } finally {
      setBusy(false);
    }
  };

  const handleClipboard = async () => {
    setBusy(true);
    try {
      if (isTauri()) {
        const text = await readClipboard();
        setDraft(text);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!isTauri()) return;
    setBusy(true);
    try {
      await writeClipboard(draft);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Starter screen"
        subtitle="Replace this page with your app. Storage, clipboard, HTTP, and layout components are ready."
      />

      {!notes && !draft ? (
        <EmptyState
          title="Blank canvas"
          description="Add your first screen, list, or form here."
          icon={<RocketLaunchIcon fontSize="large" />}
        />
      ) : null}

      <motion.div variants={cardMotion} initial="hidden" animate="visible">
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Example persisted field (app.json via plugin-store)
              </Typography>
              <TextField
                label="Notes"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                multiline
                minRows={4}
                fullWidth
              />
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button variant="contained" onClick={handleSave} disabled={busy}>
                  Save locally
                </Button>
                {isTauri() && (
                  <>
                    <Button onClick={handleClipboard} disabled={busy}>
                      Paste clipboard
                    </Button>
                    <Button onClick={handleCopy} disabled={busy}>
                      Copy to clipboard
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </Stack>
  );
}
