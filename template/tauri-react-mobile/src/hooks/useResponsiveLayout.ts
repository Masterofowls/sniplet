import { useMediaQuery, useTheme } from "@mui/material";

export function useResponsiveLayout() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isWide = useMediaQuery(theme.breakpoints.up("md"));

  const columns = isWide ? 3 : isTablet ? 2 : 1;

  return {
    isCompact,
    isTablet,
    isWide,
    columns,
    cardVariant: isCompact ? ("list" as const) : ("grid" as const),
  };
}
