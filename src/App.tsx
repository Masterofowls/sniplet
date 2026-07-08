import GitHubIcon from "@mui/icons-material/GitHub";
import {
  Alert,
  AppBar,
  Box,
  Container,
  CssBaseline,
  IconButton,
  Snackbar,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GitHubSyncPanel } from "./components/GitHubSyncPanel";
import { QuickImportFab } from "./components/QuickImportFab";
import { SearchToolbar } from "./components/SearchToolbar";
import { SnippetCard } from "./components/SnippetCard";
import { SnippetEditor } from "./components/SnippetEditor";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import type { Snippet, SnippetDraft } from "./lib/types";
import { filterSnippets, useSnippetStore } from "./store/snippetStore";
import { theme } from "./theme/theme";
import "./App.css";

const listMotion = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

function App() {
  const {
    snippets,
    loading,
    error,
    search,
    selectedTag,
    showFavoritesOnly,
    loadSnippets,
    setSearch,
    setSelectedTag,
    toggleFavoritesOnly,
    upsertSnippet,
    deleteSnippet,
    importFromClipboard,
    importFromText,
    copySnippet,
    duplicate,
    refreshAuth,
  } = useSnippetStore();

  const { columns, cardVariant } = useResponsiveLayout();
  const [editorOpen, setEditorOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadSnippets();
    refreshAuth();
  }, [loadSnippets, refreshAuth]);

  const filtered = useMemo(
    () => filterSnippets(snippets, search, selectedTag, showFavoritesOnly),
    [snippets, search, selectedTag, showFavoritesOnly],
  );

  const handleSave = useCallback(
    async (draft: SnippetDraft, id?: string) => {
      if (id) {
        const existing = snippets.find((s) => s.id === id);
        if (!existing) return;
        await upsertSnippet({
          ...existing,
          ...draft,
          updated_at: new Date().toISOString(),
        });
        setToast("Snippet updated");
        return;
      }
      await useSnippetStore
        .getState()
        .addSnippet(draft.title, draft.code, draft.language, draft.tags);
      setToast("Snippet created");
    },
    [snippets, upsertSnippet],
  );

  const handleCopy = async (snippet: Snippet) => {
    await copySnippet(snippet.code);
    setToast("Copied to clipboard");
  };

  const handleToggleFavorite = async (snippet: Snippet) => {
    await upsertSnippet({
      ...snippet,
      favorite: !snippet.favorite,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
              Sniplet
            </Typography>
            <IconButton aria-label="GitHub sync" onClick={() => setSyncOpen(true)} color="inherit">
              <GitHubIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 2, pb: 12 }}>
          <Stack spacing={2}>
            <SearchToolbar
              snippets={snippets}
              search={search}
              selectedTag={selectedTag}
              showFavoritesOnly={showFavoritesOnly}
              onSearchChange={setSearch}
              onTagChange={setSelectedTag}
              onToggleFavorites={toggleFavoritesOnly}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {loading && <Alert severity="info">Loading snippets...</Alert>}

            {!loading && filtered.length === 0 && (
              <Alert severity="info">
                No snippets yet. Create one or use quick import from the clipboard.
              </Alert>
            )}

            <motion.div variants={listMotion} initial="hidden" animate="visible">
              <Grid container spacing={2}>
                {filtered.map((snippet) => (
                  <Grid key={snippet.id} size={{ xs: 12, sm: 6, md: 12 / columns }}>
                    <SnippetCard
                      snippet={snippet}
                      variant={cardVariant}
                      onCopy={handleCopy}
                      onEdit={(s) => {
                        setEditingSnippet(s);
                        setEditorOpen(true);
                      }}
                      onDelete={async (s) => {
                        await deleteSnippet(s.id);
                        setToast("Snippet deleted");
                      }}
                      onDuplicate={async (s) => {
                        await duplicate(s.id);
                        setToast("Snippet duplicated");
                      }}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Stack>
        </Container>

        <QuickImportFab
          onCreate={() => {
            setEditingSnippet(null);
            setEditorOpen(true);
          }}
          onImportClipboard={async () => {
            await importFromClipboard();
            setToast("Imported from clipboard");
          }}
          onImportText={async (text) => {
            await importFromText(text);
            setToast("Imported snippet");
          }}
        />

        <SnippetEditor
          open={editorOpen}
          snippet={editingSnippet}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
        />

        <GitHubSyncPanel open={syncOpen} onClose={() => setSyncOpen(false)} />

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={2400}
          onClose={() => setToast(null)}
          message={toast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
