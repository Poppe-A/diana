export type BodyZoneView = 'front' | 'back';

export type BodyZone = {
  code: string;
  label: string;
  view: BodyZoneView;
  sortOrder: number;
};

export type PainEntry = {
  zoneCode: string;
  intensity: number; // 1..10
  comment?: string;
};

export type PhysicalPainView = {
  id: number;
  date: string;
  zoneCode: string;
  intensity: number;
  comment: string | null;
};

