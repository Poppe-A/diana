import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar, { type SnackbarOrigin } from '@mui/material/Snackbar';

export type AutoDismissSnackbarProps = {
  open: boolean;
  /** Texte affiché dans la bulle */
  message: string;
  severity?: AlertColor;
  /** Durée en ms avant fermeture automatique. `null` = pas de fermeture auto (fermeture manuelle uniquement). */
  autoHideDuration?: number | null;
  onClose: () => void;
  anchorOrigin?: SnackbarOrigin;
};

/**
 * Toast MUI : Snackbar + Alert, fermeture automatique optionnelle (comportement type toaster).
 */
export function AutoDismissSnackbar({
  open,
  message,
  severity = 'success',
  autoHideDuration = 3000,
  onClose,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
}: AutoDismissSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration === null ? null : autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{ width: '100%', alignItems: 'center' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
