import { useCallback, useEffect, useState } from 'react';
import type { DailyLogView } from '../types';
import { isSubstantiveDailyLog } from '../utils/isSubstantiveDailyLog';
import {
  isTodayOnboardingDone,
  markTodayOnboardingDone,
} from '../utils/todayOnboardingStorage';

export type TodayOnboardingPhase = 'loading' | 'prompt' | 'wizard' | 'dashboard';

type Params = {
  today: string;
  isToday: boolean;
  logLoading: boolean;
  log: DailyLogView | null;
};

function shouldShowTodayDashboard(today: string, log: DailyLogView | null): boolean {
  if (isTodayOnboardingDone(today)) return true;
  return isSubstantiveDailyLog(log);
}

export function useTodayOnboarding({ today, isToday, logLoading, log }: Params) {
  const [phase, setPhase] = useState<TodayOnboardingPhase>('loading');

  useEffect(() => {
    if (!isToday) return;

    if (logLoading) {
      setPhase('loading');
      return;
    }

    setPhase((current) => {
      if (current === 'wizard') return 'wizard';
      return shouldShowTodayDashboard(today, log) ? 'dashboard' : 'prompt';
    });
  }, [isToday, logLoading, log, today]);

  const startWizard = useCallback(() => {
    setPhase('wizard');
  }, []);

  const completeWizard = useCallback(() => {
    markTodayOnboardingDone(today);
    setPhase('dashboard');
  }, [today]);

  const showDatePicker = !isToday || phase === 'dashboard';

  return {
    phase,
    startWizard,
    completeWizard,
    showDatePicker,
  };
}
