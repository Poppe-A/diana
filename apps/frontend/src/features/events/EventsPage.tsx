import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { createEvent, deleteEvent, fetchAllEvents, updateEvent } from './api';
import { EventFormDialog, type EventFormValues } from './components/EventFormDialog';
import type { UserEventView } from './types';
import { eventColorHex } from './eventColors';
import { formatEventRange } from './utils/formatEventRange';

export function EventsPage() {
  const [events, setEvents] = useState<UserEventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserEventView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserEventView | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAllEvents();
      setEvents(data);
    } catch {
      setError('Impossible de charger les événements.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (event: UserEventView) => {
    setEditing(event);
    setFormOpen(true);
  };

  const handleSubmit = async (values: EventFormValues) => {
    const payload = {
      title: values.title,
      comment: values.comment || undefined,
      startDate: values.startDate,
      endDate: values.endDate === values.startDate ? undefined : values.endDate,
      color: values.color,
    };

    if (editing) {
      await updateEvent(editing.id, payload);
    } else {
      await createEvent(payload);
    }
    await load();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setError('Suppression impossible.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout
      title="Événements"
      subtitle="Marqueurs pour relier des faits à ton historique"
      maxWidth="md"
    >
      <Stack spacing={2}>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Ajouter un événement
          </Button>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={72} />
          </Stack>
        ) : events.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Aucun événement créé.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {events.map((event) => (
              <Card key={event.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: eventColorHex(event.color),
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {event.title}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventRange(event.startDate, event.endDate)}
                      </Typography>
                      {event.comment?.trim() ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5, whiteSpace: 'pre-line' }}
                        >
                          {event.comment.trim()}
                        </Typography>
                      ) : null}
                    </Box>
                    <IconButton
                      aria-label="Modifier"
                      size="small"
                      onClick={() => handleOpenEdit(event)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="Supprimer"
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(event)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      <EventFormDialog
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Supprimer cet événement ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `« ${deleteTarget.title} » sera définitivement supprimé.`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmDelete()} disabled={deleting}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
