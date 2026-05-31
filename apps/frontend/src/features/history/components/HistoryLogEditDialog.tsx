import {
  Button,
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
import { useEffect, useState } from 'react';
import { JournalPainTabs } from '../../../components/JournalPainTabs';
import { DailyLogForm } from '../../dailyLog/components/DailyLogForm';
import type { DailyLogView } from '../../dailyLog/types';
import { HistoryDialogDatePicker } from './HistoryDialogDatePicker';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

type Props = {
  open: boolean;
  date: string | null;
  minDate: string;
  maxDate: string;
  filled: boolean;
  initialLog: DailyLogView | null;
  onDateChange: (date: string) => void;
  onClose: () => void;
  onSaved: () => void;
};

export function HistoryLogEditDialog({
  open,
  date,
  minDate,
  maxDate,
  filled,
  initialLog,
  onDateChange,
  onClose,
  onSaved,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setShowForm(false);
  }, [date]);

  if (!date) return null;

  const title = dayjs(date).format('dddd D MMMM YYYY');
  const canEdit = filled || showForm;

  const handleClose = () => {
    setShowForm(false);
    onClose();
  };

  const handleSaved = () => {
    setShowForm(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      scroll="body"
      TransitionProps={{
        onExited: () => setShowForm(false),
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Fermer"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <HistoryDialogDatePicker
            date={date}
            minDate={minDate}
            maxDate={maxDate}
            onDateChange={onDateChange}
          />

          <JournalPainTabs
            date={date}
            journal={
              canEdit ? (
                <DailyLogForm
                  key={date}
                  date={date}
                  initial={initialLog}
                  onSaved={handleSaved}
                />
              ) : (
                <Stack spacing={2.5} sx={{ py: 0.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    Ce jour n’a pas été renseigné.
                  </Typography>
                  <Button variant="contained" size="large" onClick={() => setShowForm(true)} fullWidth>
                    Renseigner ce jour
                  </Button>
                </Stack>
              )
            }
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
