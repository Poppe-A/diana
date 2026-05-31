import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { saveDailyLog } from '../api';
import {
  draftFromLog,
  draftToSavePayload,
  draftToWizardSavePayload,
  type DailyLogDraft,
  type WizardSaveStep,
} from '../dailyLogPayload';
import {
  SENSATION_MAX,
  SENSATION_MIN,
  SLEEP_QUALITY_MAX,
  SLEEP_QUALITY_MIN,
} from '../types';
import { AnxietySlider } from './AnxietySlider';
import { PhysicalPainCard } from '../../physicalPain/components/PhysicalPainCard';
import { SensationSlider } from './SensationSlider';
import { SleepSlider } from './SleepSlider';
import { WizardPeriodStep } from './WizardPeriodStep';

const STEPS = ['sensation', 'anxiety', 'sleep', 'period', 'pains', 'comment'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  sensation: 'Ressenti global',
  anxiety: 'Niveau d’anxiété',
  sleep: 'Sommeil',
  period: 'Règles',
  pains: 'Douleurs physiques',
  comment: 'Commentaire',
};

type Props = {
  date: string;
  onComplete: () => void;
  /** Masquera l’étape règles quand le profil utilisateur le permettra. */
  showPeriodStep?: boolean;
};

function stepIndexOf(step: Step): number {
  return STEPS.indexOf(step);
}

function isWizardSaveStep(step: Step): step is WizardSaveStep {
  return step !== 'pains';
}

function buildActiveSteps(showPeriodStep: boolean): Step[] {
  return showPeriodStep ? [...STEPS] : STEPS.filter((s) => s !== 'period');
}

export function DailyLogWizard({ date, onComplete, showPeriodStep = true }: Props) {
  const activeSteps = useMemo(() => buildActiveSteps(showPeriodStep), [showPeriodStep]);
  const [stepIndex, setStepIndex] = useState(0);
  const [maxSavedStepIndex, setMaxSavedStepIndex] = useState(-1);
  const [draft, setDraft] = useState<DailyLogDraft>({
    sensation: 5,
    anxietyLevel: 0,
    sleepQuality: 0,
    comment: '',
    isPeriodDay: false,
    periodFlow: '',
  });
  const [periodAnswered, setPeriodAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = activeSteps[stepIndex];
  const stepNumber = stepIndex + 1;
  const canGoPrevious = stepIndex > 0;
  const hasCompletedLaterSteps = stepIndex < maxSavedStepIndex;

  useEffect(() => {
    if (step === 'period' && maxSavedStepIndex >= STEPS.indexOf('period')) {
      setPeriodAnswered(true);
    }
  }, [step, maxSavedStepIndex]);

  const updateDraft = (update: Partial<DailyLogDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
  };

  const persistStep = async (completedStep: WizardSaveStep, nextDraft: DailyLogDraft) => {
    const completedIndex = stepIndexOf(completedStep);
    const useFullPayload = maxSavedStepIndex > completedIndex;

    setSaving(true);
    setError(null);
    try {
      const saved = await saveDailyLog(
        date,
        useFullPayload
          ? draftToSavePayload(nextDraft)
          : draftToWizardSavePayload(completedStep, nextDraft),
      );
      setDraft(draftFromLog(saved));
      setMaxSavedStepIndex((prev) => Math.max(prev, completedIndex));
      return true;
    } catch {
      setError('Impossible d’enregistrer pour le moment. Réessaie plus tard.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (index: number) => {
    setError(null);
    setStepIndex(index);
  };

  const goPrevious = () => {
    if (!canGoPrevious) return;
    goToStep(stepIndex - 1);
  };

  const goNext = async () => {
    if (!isWizardSaveStep(step)) return;
    const ok = await persistStep(step, draft);
    if (!ok) return;
    goToStep(stepIndex + 1);
  };

  const finishCommentStep = async () => {
    const ok = await persistStep('comment', draft);
    if (!ok) return;
    onComplete();
  };

  const renderNavButtons = (nextLabel: string, onNext: () => void, nextDisabled = false) => (
    <Stack direction="row" spacing={1.5}>
      {canGoPrevious ? (
        <Button
          variant="outlined"
          size="large"
          disabled={saving}
          onClick={goPrevious}
          sx={{ flex: 1 }}
        >
          Précédent
        </Button>
      ) : null}
      <Button
        variant="contained"
        size="large"
        disabled={saving || nextDisabled}
        onClick={() => void onNext()}
        sx={{ flex: 1 }}
      >
        {nextLabel}
      </Button>
    </Stack>
  );

  const renderStepHeader = () => (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        Étape {stepNumber} sur {activeSteps.length}
      </Typography>
      <Typography variant="h6" id="daily-log-wizard-title" textAlign="center">
        {STEP_LABELS[step]}
      </Typography>
    </Stack>
  );

  if (step === 'pains') {
    return (
      <Stack spacing={2}>
        {renderStepHeader()}
        <PhysicalPainCard date={date} />
        <Stack spacing={2} sx={{ mt: 2 }}>
          {renderNavButtons(
            hasCompletedLaterSteps ? 'Étape suivante' : 'Suivant',
            () => goToStep(stepIndex + 1),
          )}
        </Stack>
      </Stack>
    );
  }

  if (step === 'comment') {
    return (
      <Card variant="outlined" component="section" aria-labelledby="daily-log-wizard-title">
        <CardContent>
          <Stack spacing={3}>
            {renderStepHeader()}
            <TextField
              label="Commentaire (optionnel)"
              multiline
              minRows={4}
              placeholder="Comment se sent ton corps aujourd’hui ?"
              value={draft.comment}
              onChange={(e) => updateDraft({ comment: e.target.value })}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            {renderNavButtons('Terminer mon bilan', finishCommentStep)}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (step === 'period') {
    return (
      <Card variant="outlined" component="section" aria-labelledby="daily-log-wizard-title">
        <CardContent>
          <Stack spacing={3}>
            {renderStepHeader()}
            <WizardPeriodStep
              draft={draft}
              periodAnswered={periodAnswered}
              visible={showPeriodStep}
              onChange={(update) => {
                setPeriodAnswered(true);
                updateDraft(update);
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Stack spacing={2} sx={{ mt: 2 }}>
              {renderNavButtons(
                hasCompletedLaterSteps ? 'Étape suivante' : 'Suivant',
                goNext,
                !periodAnswered,
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" component="section" aria-labelledby="daily-log-wizard-title">
      <CardContent>
        <Stack spacing={3}>
          {renderStepHeader()}

          <Box>
            {step === 'sensation' && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Échelle de {SENSATION_MIN} (mal-être) à {SENSATION_MAX} (bien-être). 5 = neutre.
                </Typography>
                <SensationSlider
                  value={draft.sensation}
                  onChange={(sensation) => updateDraft({ sensation })}
                />
              </Stack>
            )}
            {step === 'anxiety' && (
              <AnxietySlider
                value={draft.anxietyLevel}
                onChange={(anxietyLevel) => updateDraft({ anxietyLevel })}
              />
            )}
            {step === 'sleep' && (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Échelle de {SLEEP_QUALITY_MIN} (très mauvais) à {SLEEP_QUALITY_MAX} (excellent).
                </Typography>
                <SleepSlider
                  value={draft.sleepQuality}
                  onChange={(sleepQuality) => updateDraft({ sleepQuality })}
                />
              </Stack>
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {renderNavButtons(hasCompletedLaterSteps ? 'Étape suivante' : 'Suivant', goNext)}
        </Stack>
      </CardContent>
    </Card>
  );
}
