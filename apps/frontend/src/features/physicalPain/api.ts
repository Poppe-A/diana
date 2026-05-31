import { api } from '../../api/client';
import type { BodyZone, PainEntry, PhysicalPainView } from './types';

export async function fetchBodyZones(): Promise<BodyZone[]> {
  const { data } = await api.get<BodyZone[]>('/body-zones');
  return data;
}

export async function fetchPainsByDate(date: string): Promise<PhysicalPainView[]> {
  const { data } = await api.get<PhysicalPainView[]>(`/physical-pains/${date}`);
  return data;
}

export async function fetchPainsRange(from: string, to: string): Promise<PhysicalPainView[]> {
  const { data } = await api.get<PhysicalPainView[]>('/physical-pains', { params: { from, to } });
  return data;
}

export async function savePainsForDate(date: string, pains: PainEntry[]): Promise<PhysicalPainView[]> {
  const { data } = await api.put<PhysicalPainView[]>(`/physical-pains/${date}`, { pains });
  return data;
}

