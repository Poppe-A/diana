import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AutoDismissSnackbar } from '../../../components/AutoDismissSnackbar';
import { fetchBodyZones, fetchPainsByDate, savePainsForDate } from '../api';
import type { BodyZone, BodyZoneView, PainEntry, PhysicalPainView } from '../types';
import { BodyMap } from './BodyMap';
import { PainEditorModal } from './PainEditorModal';

type Props = {
  date: string;
};

function normalizeZones(input: BodyZone[]): BodyZone[] {
  const zonesByCode = new Map(input.map((zone) => [zone.code, zone]));
  const hasLegacyGroupedLimbs =
    zonesByCode.has('arms_front') ||
    zonesByCode.has('arms_back') ||
    zonesByCode.has('legs_front') ||
    zonesByCode.has('legs_back');

  // If backend already returns left/right zones, do nothing.
  const hasSplit =
    zonesByCode.has('left_arm_front') ||
    zonesByCode.has('right_arm_front') ||
    zonesByCode.has('left_leg_front') ||
    zonesByCode.has('right_leg_front') ||
    zonesByCode.has('left_arm_back') ||
    zonesByCode.has('right_arm_back') ||
    zonesByCode.has('left_leg_back') ||
    zonesByCode.has('right_leg_back');

  if (!hasLegacyGroupedLimbs || hasSplit) {
    return input;
  }

  const normalizedZones = input.filter(
    (zone) => !['arms_front', 'arms_back', 'legs_front', 'legs_back'].includes(zone.code),
  );

  function createBodyZone(
    code: string,
    label: string,
    view: BodyZoneView,
    sortOrder: number,
  ): BodyZone {
    return {
      code,
      label,
      view,
      sortOrder,
    };
  }

  normalizedZones.push(
    createBodyZone('left_arm_front', 'Bras gauche (avant)', 'front', 18),
    createBodyZone('right_arm_front', 'Bras droit (avant)', 'front', 19),
    createBodyZone('left_arm_back', 'Bras gauche (dos)', 'back', 22),
    createBodyZone('right_arm_back', 'Bras droit (dos)', 'back', 23),
    createBodyZone('left_leg_front', 'Jambe gauche (avant)', 'front', 38),
    createBodyZone('right_leg_front', 'Jambe droite (avant)', 'front', 39),
    createBodyZone('left_leg_back', 'Jambe gauche (dos)', 'back', 42),
    createBodyZone('right_leg_back', 'Jambe droite (dos)', 'back', 43),
  );

  normalizedZones.sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
  return normalizedZones;
}

function painsToDraft(rows: PhysicalPainView[]): Record<string, PainEntry> {
  const entriesByZoneCode: Record<string, PainEntry> = {};
  for (const row of rows) {
    entriesByZoneCode[row.zoneCode] = {
      zoneCode: row.zoneCode,
      intensity: row.intensity,
      comment: row.comment ?? undefined,
    };
  }
  return entriesByZoneCode;
}

export function PhysicalPainCard({ date }: Props) {
  const [zones, setZones] = useState<BodyZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draftByZone, setDraftByZone] = useState<Record<string, PainEntry>>({});
  const intensityByZoneCode = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [zoneCode, entry] of Object.entries(draftByZone)) {
      result[zoneCode] = entry.intensity;
    }
    return result;
  }, [draftByZone]);

  const [view, setView] = useState<BodyZoneView>('front');
  const [activeZoneCode, setActiveZoneCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuccessToast(null);
    void (async () => {
      try {
        const [bodyZonesFromApi, painsForDate] = await Promise.all([
          fetchBodyZones(),
          fetchPainsByDate(date),
        ]);
        if (cancelled) return;
        setZones(normalizeZones(bodyZonesFromApi));
        setDraftByZone(painsToDraft(painsForDate));
      } catch {
        if (!cancelled) {
          setError('Impossible de charger les douleurs pour le moment.');
          setZones([]);
          setDraftByZone({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const zonesByCode = useMemo(() => new Map(zones.map((zone) => [zone.code, zone])), [zones]);

  const activeZone = activeZoneCode ? (zonesByCode.get(activeZoneCode) ?? null) : null;
  const activeEntry = activeZoneCode ? (draftByZone[activeZoneCode] ?? null) : null;

  const summaryItems = useMemo(() => {
    const itemsWithZone = Object.values(draftByZone)
      .map((painEntry) => ({
        entry: painEntry,
        zone: zonesByCode.get(painEntry.zoneCode) ?? null,
      }))
      .filter((item): item is { entry: PainEntry; zone: BodyZone } => item.zone !== null);
    itemsWithZone.sort(
      (first, second) => (first.zone.sortOrder ?? 0) - (second.zone.sortOrder ?? 0),
    );
    return itemsWithZone;
  }, [draftByZone, zonesByCode]);

  const handleZoneClick = (zoneCode: string) => {
    const bodyZone = zonesByCode.get(zoneCode);
    if (!bodyZone) return;
    setView(bodyZone.view);
    setActiveZoneCode(zoneCode);
  };

  const handleModalSave = (entry: PainEntry) => {
    setDraftByZone((currentDraft) => ({ ...currentDraft, [entry.zoneCode]: entry }));
    setSuccessToast(null);
  };

  const handleModalRemove = (zoneCode: string) => {
    setDraftByZone((currentDraft) => {
      const nextDraft = { ...currentDraft };
      delete nextDraft[zoneCode];
      return nextDraft;
    });
    setSuccessToast(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const pains = Object.values(draftByZone);
      const saved = await savePainsForDate(date, pains);
      setDraftByZone(painsToDraft(saved));
      setSuccessToast(`Enregistré à ${new Date().toLocaleTimeString('fr-FR')}.`);
    } catch {
      setError('Impossible d’enregistrer pour le moment. Réessaie plus tard.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Douleurs physiques</Typography>
            <Typography variant="body2" color="text.secondary">
              Clique sur une zone douloureuse pour décrire ce que tu ressens.
            </Typography>
          </Stack>

          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={740} />
              <Skeleton variant="rounded" height={48} />
            </Stack>
          ) : (
            <>
              <Stack spacing={1} alignItems="center">
                <ToggleButtonGroup
                  value={view}
                  exclusive
                  onChange={(_event, newBodyView) => {
                    if (newBodyView) setView(newBodyView);
                  }}
                  size="small"
                  aria-label="Vue du corps"
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 2,
                      py: 0.75,
                    },
                  }}
                >
                  <ToggleButton value="front">Avant</ToggleButton>
                  <ToggleButton value="back">Dos</ToggleButton>
                </ToggleButtonGroup>

                <BodyMap
                  view={view}
                  zones={zones}
                  intensityByZoneCode={intensityByZoneCode}
                  onZoneClick={handleZoneClick}
                />
              </Stack>

              {summaryItems.length ? (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {summaryItems.map(({ entry, zone }) => (
                    <Chip
                      key={zone.code}
                      label={`${zone.label} · ${entry.intensity}/10`}
                      color="error"
                      variant="outlined"
                      onClick={() => handleZoneClick(zone.code)}
                      size="small"
                    />
                  ))}
                </Stack>
              ) : null}

              {error && <Alert severity="error">{error}</Alert>}

              <AutoDismissSnackbar
                open={successToast !== null}
                message={successToast ?? ''}
                onClose={() => setSuccessToast(null)}
              />

              <Button
                variant="contained"
                size="medium"
                onClick={() => void handleSaveAll()}
                disabled={saving}
                fullWidth
              >
                Enregistrer
              </Button>
            </>
          )}
        </Stack>
      </CardContent>

      <PainEditorModal
        open={activeZoneCode !== null}
        zone={activeZone}
        initialEntry={activeEntry}
        onClose={() => setActiveZoneCode(null)}
        onSave={handleModalSave}
        onRemove={handleModalRemove}
      />
    </Card>
  );
}
