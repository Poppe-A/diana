import type { UserEventView } from '../types';

export function clipEventToTimeline(
  event: UserEventView,
  timelineStart: string,
  timelineEnd: string,
): UserEventView | null {
  if (event.endDate < timelineStart || event.startDate > timelineEnd) {
    return null;
  }
  return {
    ...event,
    startDate: event.startDate < timelineStart ? timelineStart : event.startDate,
    endDate: event.endDate > timelineEnd ? timelineEnd : event.endDate,
  };
}
