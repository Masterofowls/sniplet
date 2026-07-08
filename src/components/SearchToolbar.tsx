import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import {
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { Snippet } from "../lib/types";
import { collectTags } from "../store/snippetStore";

interface SearchToolbarProps {
  snippets: Snippet[];
  search: string;
  selectedTag: string | null;
  showFavoritesOnly: boolean;
  onSearchChange: (value: string) => void;
  onTagChange: (tag: string | null) => void;
  onToggleFavorites: () => void;
}

export function SearchToolbar({
  snippets,
  search,
  selectedTag,
  showFavoritesOnly,
  onSearchChange,
  onTagChange,
  onToggleFavorites,
}: SearchToolbarProps) {
  const tags = collectTags(snippets);

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        placeholder="Search snippets..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <ToggleButtonGroup size="small" exclusive value={showFavoritesOnly ? "fav" : "all"}>
          <ToggleButton value="all" onClick={() => showFavoritesOnly && onToggleFavorites()}>
            All
          </ToggleButton>
          <ToggleButton value="fav" onClick={() => !showFavoritesOnly && onToggleFavorites()}>
            <StarIcon fontSize="small" sx={{ mr: 0.5 }} />
            Favorites
          </ToggleButton>
        </ToggleButtonGroup>

        {tags.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <FilterAltIcon fontSize="small" color="action" />
            <Chip
              size="small"
              label="All tags"
              color={selectedTag === null ? "primary" : "default"}
              onClick={() => onTagChange(null)}
            />
            {tags.map((tag) => (
              <Chip
                key={tag}
                size="small"
                label={tag}
                color={selectedTag === tag ? "primary" : "default"}
                onClick={() => onTagChange(selectedTag === tag ? null : tag)}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
