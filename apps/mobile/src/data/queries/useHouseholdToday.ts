import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDate, nextMidnight } from '@petos/domain';

const safeToday = (tz: string) => {
  try { return localDate(Date.now(), tz); } catch { return localDate(Date.now(), 'Europe/Warsaw'); }
};

/** The household's calendar day (ADR 0015). Re-evaluates at household midnight and on foreground. */
export function useHouseholdToday(timezone: string) {
  const [today, setToday] = useState(() => safeToday(timezone));
  useEffect(() => {
    const refresh = () => setToday(safeToday(timezone));
    refresh();
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      let at: number;
      try { at = nextMidnight(Date.now(), timezone); } catch { at = nextMidnight(Date.now(), 'Europe/Warsaw'); }
      timer = setTimeout(() => { refresh(); schedule(); }, Math.max(1000, at - Date.now() + 500));
    };
    schedule();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => { clearTimeout(timer); sub.remove(); };
  }, [timezone]);
  return today;
}
