import {
  Alert,
  Box,
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
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLOR_OPTIONS,
  type EventColor,
} from '../eventColors';
import type { UserEventView } from '../types';

export type EventFormValues = {
  title: string;
  comment: string;
  startDate: string;
  endDate: string;
  color: EventColor;
};

type Props = {
  open: boolean;
  initial?: UserEventView | null;
  onClose: () => void;
  onSubmit: (values: EventFormValues) => Promise<void>;
};

export function EventFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<EventColor>(DEFAULT_EVENT_COLOR);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = initial != null;

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setComment(initial?.comment ?? '');
    setStartDate(initial?.startDate ?? dayjs().format('YYYY-MM-DD'));
    setEndDate(
      initial && initial.endDate !== initial.startDate ? initial.endDate : '',
    );
    setColor(initial?.color ?? DEFAULT_EVENT_COLOR);
    setError(null);
    setSaving(false);
  }, [open, initial]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!startDate) {
      setError('La date de début est obligatoire.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('La date de fin doit être après la date de début.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: trimmedTitle,
        comment: comment.trim(),
        startDate,
        endDate: endDate || startDate,
        color,
      });
      onClose();
    } catch {
      setError('Enregistrement impossible. Réessaie plus tard.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Modifier l’événement' : 'Ajouter un événement'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            autoFocus
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Date de fin (optionnel)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            helperText="Laisse vide pour un événement sur une seule journée."
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel id="event-color-label">Couleur</InputLabel>
            <Select
              labelId="event-color-label"
              label="Couleur"
              value={color}
              onChange={(e) => setColor(e.target.value as EventColor)}
              renderValue={(value) => {
                const option = EVENT_COLOR_OPTIONS.find((o) => o.value === value);
                return option ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: option.hex,
                        flexShrink: 0,
                      }}
                    />
                    <span>{option.label}</span>
                  </Stack>
                ) : (
                  value
                );
              }}
            >
              {EVENT_COLOR_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: option.hex,
                        flexShrink: 0,
                      }}
                    />
                    {option.label}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
