import type { UserEventView } from '../types';

export function eventsOnDay(events: UserEventView[], date: string): UserEventView[] {
  return events.filter((e) => e.startDate <= date && e.endDate >= date);
}
