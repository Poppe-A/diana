import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { BodyZone, PainEntry } from '../types';

type Props = {
  open: boolean;
  zone: BodyZone | null;
  initialEntry: PainEntry | null;
  onClose: () => void;
  onSave: (entry: PainEntry) => void;
  onRemove: (zoneCode: string) => void;
};

export function PainEditorModal({ open, zone, initialEntry, onClose, onSave, onRemove }: Props) {
  const zoneCode = zone?.code ?? null;

  const effectiveInitial = useMemo(() => {
    if (!zoneCode) return null;
    return (
      initialEntry ?? {
        zoneCode,
        intensity: 5,
        comment: '',
      }
    );
  }, [initialEntry, zoneCode]);

  const [intensity, setIntensity] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    if (!effectiveInitial) return;
    setIntensity(effectiveInitial.intensity);
    setComment(effectiveInitial.comment ?? '');
  }, [open, effectiveInitial]);

  const handleSave = () => {
    if (!zoneCode) return;
    onSave({
      zoneCode,
      intensity,
      comment: comment.trim().length ? comment.trim() : undefined,
    });
    onClose();
  };

  const handleRemove = () => {
    if (!zoneCode) return;
    onRemove(zoneCode);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{zone?.label ?? 'Zone'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Intensité</Typography>
            <Slider
              value={intensity}
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="on"
              onChange={(_, v) => setIntensity(v as number)}
              aria-label="Intensité de la douleur"
            />
          </Stack>

          <TextField
            label="Commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex. douleur au biceps"
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        {zoneCode && initialEntry ? (
          <Button color="error" onClick={handleRemove}>
            Retirer
          </Button>
        ) : null}
        <Button variant="contained" onClick={handleSave} disabled={!zoneCode}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

