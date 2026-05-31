import { api } from '../../api/client';
import type { DailyLogHistoryDay, DailyLogView, PeriodFlowLevel } from './types';

export type SaveDailyLogPayload = {
  sensation: number;
  comment?: string;
  isPeriodDay: boolean;
  periodFlow?: PeriodFlowLevel;
  anxietyLevel: number;
  sleepQuality?: number;
};

export async function fetchTodayLog(): Promise<DailyLogView | null> {
  const { data } = await api.get<DailyLogView | null>('/daily-logs/today');
  return data;
}

export async function fetchLogByDate(date: string): Promise<DailyLogView | null> {
  const { data } = await api.get<DailyLogView | null>(`/daily-logs/${date}`);
  return data;
}

export async function saveDailyLog(
  date: string,
  payload: SaveDailyLogPayload,
): Promise<DailyLogView> {
  const { data } = await api.put<DailyLogView>(`/daily-logs/${date}`, payload);
  return data;
}

export async function fetchLogsRange(from: string, to: string): Promise<DailyLogHistoryDay[]> {
  const { data } = await api.get<DailyLogHistoryDay[]>('/daily-logs', { params: { from, to } });
  return data;
}
