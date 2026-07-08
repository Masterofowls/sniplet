import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LANGUAGES } from "../lib/languages";
import type { Snippet, SnippetDraft } from "../lib/types";

interface SnippetEditorProps {
  open: boolean;
  snippet?: Snippet | null;
  onClose: () => void;
  onSave: (draft: SnippetDraft, id?: string) => Promise<void>;
}

export function SnippetEditor({ open, snippet, onClose, onSave }: SnippetEditorProps) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setCode(snippet.code);
      setLanguage(snippet.language);
      setTagsInput(snippet.tags.join(", "));
    } else {
      setTitle("");
      setCode("");
      setLanguage("typescript");
      setTagsInput("");
    }
  }, [snippet]);

  const handleSave = async () => {
    if (!title.trim() || !code.trim()) return;
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({ title: title.trim(), code, language, tags }, snippet?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{snippet ? "Edit snippet" : "New snippet"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel id="language-label">Language</InputLabel>
            <Select
              labelId="language-label"
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.id} value={lang.id}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Tags (comma separated)"
            fullWidth
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <TextField
            label="Code"
            fullWidth
            multiline
            minRows={12}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ fontFamily: "monospace" }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
