import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export function formatEventRange(startDate: string, endDate: string): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (startDate === endDate) {
    return start.format('D MMMM YYYY');
  }
  if (start.year() === end.year()) {
    return `${start.format('D MMMM')} – ${end.format('D MMMM YYYY')}`;
  }
  return `${start.format('D MMMM YYYY')} – ${end.format('D MMMM YYYY')}`;
}
