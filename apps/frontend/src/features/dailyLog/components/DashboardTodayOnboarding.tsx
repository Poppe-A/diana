import { Skeleton, Stack } from '@mui/material';
import type { TodayOnboardingPhase } from '../hooks/useTodayOnboarding';
import { DailyLogStartPrompt } from './DailyLogStartPrompt';
import { DailyLogWizard } from './DailyLogWizard';
import { DashboardDayPanel } from './DashboardDayPanel';
import type { DailyLogView } from '../types';

type Props = {
  phase: TodayOnboardingPhase;
  today: string;
  log: DailyLogView | null;
  loading: boolean;
  onStartWizard: () => void;
  onWizardComplete: () => void;
  onLogUpdated: (log: DailyLogView) => void;
};

export function DashboardTodayOnboarding({
  phase,
  today,
  log,
  loading,
  onStartWizard,
  onWizardComplete,
  onLogUpdated,
}: Props) {
  if (loading || phase === 'loading') {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    );
  }

  if (phase === 'prompt') {
    return <DailyLogStartPrompt onStart={onStartWizard} />;
  }

  if (phase === 'wizard') {
    return <DailyLogWizard date={today} onComplete={onWizardComplete} />;
  }

  return <DashboardDayPanel date={today} log={log} onLogUpdated={onLogUpdated} />;
}
