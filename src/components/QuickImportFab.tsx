import AddIcon from "@mui/icons-material/Add";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { detectLanguage } from "../lib/languages";

interface QuickImportFabProps {
  onCreate: () => void;
  onImportClipboard: () => Promise<void>;
  onImportText: (text: string) => Promise<void>;
}

export function QuickImportFab({ onCreate, onImportClipboard, onImportText }: QuickImportFabProps) {
  const [openPasteDialog, setOpenPasteDialog] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  const handleClipboardImport = async () => {
    setImporting(true);
    try {
      await onImportClipboard();
    } finally {
      setImporting(false);
    }
  };

  const handleTextImport = async () => {
    if (!pasteText.trim()) return;
    setImporting(true);
    try {
      await onImportText(pasteText);
      setPasteText("");
      setOpenPasteDialog(false);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          right: 20,
          bottom: 24,
          zIndex: (theme) => theme.zIndex.speedDial,
        }}
      >
        <SpeedDial ariaLabel="Quick actions" icon={<SpeedDialIcon />}>
          <SpeedDialAction icon={<AddIcon />} title="New snippet" onClick={onCreate} />
          <SpeedDialAction
            icon={<ContentPasteGoIcon />}
            title="Import clipboard"
            onClick={handleClipboardImport}
          />
          <SpeedDialAction
            icon={<ContentPasteGoIcon />}
            title="Paste import"
            onClick={() => setOpenPasteDialog(true)}
          />
        </SpeedDial>
      </Box>

      <Dialog
        open={openPasteDialog}
        onClose={() => setOpenPasteDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Quick import</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={8}
            fullWidth
            placeholder="Paste code or JSON snippet array..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            helperText={
              pasteText.trim()
                ? `Detected language: ${detectLanguage(pasteText)}`
                : "Supports raw code or JSON"
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasteDialog(false)}>Cancel</Button>
          <Button onClick={handleTextImport} variant="contained" disabled={importing}>
            Import
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="Create snippet"
        onClick={onCreate}
        sx={{
          position: "fixed",
          left: 20,
          bottom: 24,
          display: { xs: "flex", sm: "none" },
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
