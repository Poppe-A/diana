import { Stack } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { DailyLogDatePicker } from './components/DailyLogDatePicker';
import { DashboardDayPanel } from './components/DashboardDayPanel';
import { DashboardLoadingSkeleton } from './components/DashboardLoadingSkeleton';
import { DashboardTodayOnboarding } from './components/DashboardTodayOnboarding';
import { useDailyLog } from './hooks/useDailyLog';
import { useSelectedDate } from './hooks/useSelectedDate';
import { useTodayOnboarding } from './hooks/useTodayOnboarding';
import { getDashboardHeader } from './utils/dashboardHeader';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

export function DashboardPage() {
  const { today, selectedDate, isToday, isFuture, shiftDay, selectDate, goToToday } =
    useSelectedDate();
  const { log, loading, reload, applyLog } = useDailyLog(selectedDate);
  const onboarding = useTodayOnboarding({ today, isToday, logLoading: loading, log });

  const header = useMemo(
    () =>
      getDashboardHeader({
        selectedDate,
        isToday,
        todayPhase: isToday ? onboarding.phase : null,
      }),
    [selectedDate, isToday, onboarding.phase],
  );

  const handleWizardComplete = () => {
    void reload().then(() => onboarding.completeWizard());
  };

  const handleLogUpdated = (updated: Parameters<typeof applyLog>[0]) => {
    applyLog(updated);
  };

  return (
    <AppLayout title={header.title} subtitle={header.subtitle}>
      <Stack spacing={3}>
        {onboarding.showDatePicker && (
          <DailyLogDatePicker
            selectedDate={selectedDate}
            today={today}
            isToday={isToday}
            isFuture={isFuture}
            onShiftDay={shiftDay}
            onSelectDate={selectDate}
            onGoToToday={goToToday}
          />
        )}

        {isToday ? (
          <DashboardTodayOnboarding
            phase={onboarding.phase}
            today={today}
            log={log}
            loading={loading}
            onStartWizard={onboarding.startWizard}
            onWizardComplete={handleWizardComplete}
            onLogUpdated={handleLogUpdated}
          />
        ) : loading ? (
          <DashboardLoadingSkeleton />
        ) : (
          <DashboardDayPanel date={selectedDate} log={log} onLogUpdated={handleLogUpdated} />
        )}
      </Stack>
    </AppLayout>
  );
}
