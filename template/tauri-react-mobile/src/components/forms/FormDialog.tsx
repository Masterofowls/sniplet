import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import type { ReactNode } from "react";

interface FormDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function FormDialog({
  open,
  title,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  onSubmit,
  onClose,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
