import { api } from '../../api/client';
import type { SaveUserEventPayload, UserEventView } from './types';

export async function fetchAllEvents(): Promise<UserEventView[]> {
  const { data } = await api.get<UserEventView[]>('/events');
  return data;
}

export async function fetchEventsRange(from: string, to: string): Promise<UserEventView[]> {
  const { data } = await api.get<UserEventView[]>('/events', { params: { from, to } });
  return data;
}

export async function createEvent(payload: SaveUserEventPayload): Promise<UserEventView> {
  const { data } = await api.post<UserEventView>('/events', payload);
  return data;
}

export async function updateEvent(
  id: number,
  payload: SaveUserEventPayload,
): Promise<UserEventView> {
  const { data } = await api.patch<UserEventView>(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`);
}
