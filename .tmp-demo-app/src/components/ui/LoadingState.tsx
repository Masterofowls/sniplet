import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <Box sx={{ py: 6, display: "grid", placeItems: "center", gap: 2 }}>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
