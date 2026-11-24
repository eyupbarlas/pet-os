// Deterministic ids for "one per key" rows (mobile.md 3.1). Two offline devices that create
// the same tick produce the same id, so the server collapses them into one row.
import { v5 as uuidv5, v7 as uuidv7 } from 'uuid';

// Namespace constants. Never change them: they are baked into rows already synced.
export const NS_TICK = '6f1d5c2e-8f0a-5b7e-9a11-2c4d7e0b1a01';
export const NS_REST_DAY = '6f1d5c2e-8f0a-5b7e-9a11-2c4d7e0b1a02';
export const NS_PET_PLACE = '6f1d5c2e-8f0a-5b7e-9a11-2c4d7e0b1a03';
export const NS_REMINDER_PREF = '6f1d5c2e-8f0a-5b7e-9a11-2c4d7e0b1a04';

const key = (...parts: Array<string | number>) => parts.join('|');

export const newId = (): string => uuidv7();
export const tickId = (taskId: string, localDate: string, slot = 0) =>
  uuidv5(key(taskId, localDate, slot), NS_TICK);
export const restDayId = (petId: string, localDate: string) =>
  uuidv5(key(petId, localDate), NS_REST_DAY);
export const petPlaceId = (petId: string, kind: 'food' | 'groomer') =>
  uuidv5(key(petId, kind), NS_PET_PLACE);
export const reminderPrefId = (userId: string, taskId: string) =>
  uuidv5(key(userId, taskId), NS_REMINDER_PREF);
