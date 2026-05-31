import type { EventColor } from './eventColors';

export type UserEventView = {
  id: number;
  title: string;
  comment: string | null;
  startDate: string;
  endDate: string;
  color: EventColor;
};

export type SaveUserEventPayload = {
  title: string;
  comment?: string;
  startDate: string;
  endDate?: string;
  color?: EventColor;
};
