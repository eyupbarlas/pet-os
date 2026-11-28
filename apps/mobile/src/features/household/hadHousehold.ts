// Remembers, per user and device, that this person has been in a household. It tells "never had
// one" (first run: set one up) from "had one and lost it" (removed, left, deleted: no-household
// screen, mobile.md 4.4), because after a removal the household is gone from the local copy.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: string) => `hadHousehold:${userId}`;

export const markHadHousehold = (userId: string) => AsyncStorage.setItem(key(userId), '1').catch(() => {});

/** null while loading. */
export function useHadHousehold(userId: string | undefined) {
  const [had, setHad] = useState<boolean | null>(null);
  useEffect(() => {
    if (!userId) { setHad(null); return; }
    let live = true;
    AsyncStorage.getItem(key(userId)).then((v) => live && setHad(v === '1')).catch(() => live && setHad(false));
    return () => { live = false; };
  }, [userId]);
  return had;
}
