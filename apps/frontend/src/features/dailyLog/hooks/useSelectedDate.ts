import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';

const DATE_FORMAT = 'YYYY-MM-DD';

export function useSelectedDate() {
  const today = useMemo(() => dayjs().format(DATE_FORMAT), []);
  const [selectedDate, setSelectedDate] = useState(today);

  const isToday = selectedDate === today;
  const isFuture = dayjs(selectedDate).isAfter(today, 'day');

  const shiftDay = useCallback(
    (delta: number) => {
      setSelectedDate((current) => dayjs(current).add(delta, 'day').format(DATE_FORMAT));
    },
    [],
  );

  const selectDate = useCallback(
    (value: string) => {
      if (!value) return;
      if (dayjs(value).isAfter(today, 'day')) return;
      setSelectedDate(value);
    },
    [today],
  );

  const goToToday = useCallback(() => {
    setSelectedDate(today);
  }, [today]);

  return {
    today,
    selectedDate,
    isToday,
    isFuture,
    shiftDay,
    selectDate,
    goToToday,
  };
}
