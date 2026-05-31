import { Stack, Tab, Tabs } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { PhysicalPainCard } from '../features/physicalPain/components/PhysicalPainCard';
import type { PhysicalPainView } from '../features/physicalPain/types';

export type JournalPainTab = 'journal' | 'pain';

type Props = {
  date: string;
  journal: ReactNode;
  /** Réinitialise sur « Journal » quand la date change (défaut : oui). */
  resetTabOnDateChange?: boolean;
  /** Liste renvoyée par le PUT (mise à jour du graphe sans reload). */
  onPainsUpdated?: (pains: PhysicalPainView[]) => void;
};

export function JournalPainTabs({
  date,
  journal,
  resetTabOnDateChange = true,
  onPainsUpdated,
}: Props) {
  const [tab, setTab] = useState<JournalPainTab>('journal');

  useEffect(() => {
    if (resetTabOnDateChange) setTab('journal');
  }, [date, resetTabOnDateChange]);

  return (
    <Stack spacing={2.5}>
      <Tabs
        value={tab}
        onChange={(_event, value: JournalPainTab) => setTab(value)}
        variant="fullWidth"
        aria-label="Sections de saisie du jour"
      >
        <Tab value="journal" label="Journal" />
        <Tab value="pain" label="Douleurs" />
      </Tabs>

      {tab === 'journal' ? (
        journal
      ) : (
        <PhysicalPainCard key={date} date={date} onPainsUpdated={onPainsUpdated} />
      )}
    </Stack>
  );
}
