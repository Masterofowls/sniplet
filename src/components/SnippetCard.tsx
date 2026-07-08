import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { languageLabel } from "../lib/languages";
import type { Snippet } from "../lib/types";

interface SnippetCardProps {
  snippet: Snippet;
  variant: "grid" | "list";
  onCopy: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
  onDuplicate: (snippet: Snippet) => void;
  onToggleFavorite: (snippet: Snippet) => void;
}

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function SnippetCard({
  snippet,
  variant,
  onCopy,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: SnippetCardProps) {
  const preview = snippet.code
    .split("\n")
    .slice(0, variant === "list" ? 8 : 5)
    .join("\n");

  return (
    <motion.div variants={cardMotion} layout initial="hidden" animate="visible">
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          },
        }}
      >
        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontSize: "1.05rem" }}>
                {snippet.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}>
                <Chip size="small" label={languageLabel(snippet.language)} color="primary" />
                {snippet.tags.map((tag) => (
                  <Chip key={tag} size="small" label={tag} variant="outlined" />
                ))}
              </Stack>
            </Box>
            <IconButton
              aria-label={snippet.favorite ? "Remove favorite" : "Add favorite"}
              onClick={() => onToggleFavorite(snippet)}
              size="small"
            >
              {snippet.favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
            </IconButton>
          </Stack>

          <Box
            sx={{
              mt: 1.5,
              borderRadius: 2,
              overflow: "hidden",
              maxHeight: variant === "list" ? 220 : 160,
              fontSize: "0.78rem",
            }}
          >
            <SyntaxHighlighter
              language={snippet.language === "plaintext" ? "text" : snippet.language}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: "12px",
                background: "#0b0d12",
                fontSize: "0.78rem",
              }}
              wrapLongLines
            >
              {preview}
            </SyntaxHighlighter>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(snippet.updated_at).toLocaleString()}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Quick copy">
              <IconButton aria-label="Quick copy" onClick={() => onCopy(snippet)} color="primary">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate">
              <IconButton aria-label="Duplicate" onClick={() => onDuplicate(snippet)}>
                <FileCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton aria-label="Edit" onClick={() => onEdit(snippet)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton aria-label="Delete" onClick={() => onDelete(snippet)} color="error">
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      </Card>
    </motion.div>
  );
}
