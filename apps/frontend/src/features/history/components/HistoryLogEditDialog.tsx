import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { DailyLogForm } from '../../dailyLog/components/DailyLogForm';
import { SENSATION_MAX, SENSATION_MIN, type DailyLogView } from '../../dailyLog/types';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

type Props = {
  open: boolean;
  date: string | null;
  initialLog: DailyLogView | null | undefined;
  onClose: () => void;
  onSaved: () => void;
};

export function HistoryLogEditDialog({ open, date, initialLog, onClose, onSaved }: Props) {
  if (!date) return null;

  const title = dayjs(date).format('dddd D MMMM YYYY');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Fermer"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Échelle de {SENSATION_MIN} (douleur / mal-être) à {SENSATION_MAX} (bien-être). 0 = neutre.
          </Typography>
          <DailyLogForm
            key={date}
            date={date}
            initial={initialLog ?? null}
            onSaved={() => {
              onSaved();
              onClose();
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
