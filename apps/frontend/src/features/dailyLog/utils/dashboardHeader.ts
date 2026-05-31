import dayjs from 'dayjs';
import type { TodayOnboardingPhase } from '../hooks/useTodayOnboarding';

type Params = {
  selectedDate: string;
  isToday: boolean;
  todayPhase: TodayOnboardingPhase | null;
};

export function getDashboardHeader({ selectedDate, isToday, todayPhase }: Params) {
  const d = dayjs(selectedDate);
  const title = isToday ? d.format('dddd D MMMM') : d.format('dddd D MMMM YYYY');

  if (!isToday) {
    return { title, subtitle: 'Mets à jour les données de ce jour' };
  }

  switch (todayPhase) {
    case 'wizard':
      return { title, subtitle: 'On avance étape par étape' };
    case 'prompt':
    case 'loading':
      return { title, subtitle: 'Prends un instant pour toi' };
    default:
      return { title, subtitle: 'Comment tu te sens aujourd’hui ?' };
  }
}
