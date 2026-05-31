import { useMemo } from 'react';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TodayIcon from '@mui/icons-material/Today';
import TimelineIcon from '@mui/icons-material/Timeline';

export type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

export function useNavItems(): NavItem[] {
  return useMemo(
    () => [
      { to: '/', label: 'Aujourd’hui', icon: <TodayIcon /> },
      { to: '/history', label: 'Historique', icon: <TimelineIcon /> },
      { to: '/events', label: 'Événements', icon: <EventNoteIcon /> },
    ],
    [],
  );
}
