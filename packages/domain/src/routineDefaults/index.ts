// Species routine templates (spec 001). Template keys feed i18n labels: task.<species>.<name>.
import type { LocalDate } from '../day';

export type Species = 'dog' | 'cat';
export type TaskKind = 'meal' | 'walk' | 'water' | 'litter' | 'med' | 'custom';

export interface TaskTemplate {
  template_key: string;
  kind: TaskKind;
  time_of_day: string | null; // 'HH:mm'
  every_n_days: number;
}

export const ROUTINE_DEFAULTS: Record<Species, TaskTemplate[]> = {
  dog: [
    { template_key: 'task.dog.meal.morning', kind: 'meal', time_of_day: '07:30', every_n_days: 1 },
    { template_key: 'task.dog.walk.morning', kind: 'walk', time_of_day: '08:00', every_n_days: 1 },
    { template_key: 'task.dog.walk.evening', kind: 'walk', time_of_day: '18:00', every_n_days: 1 },
    { template_key: 'task.dog.meal.evening', kind: 'meal', time_of_day: '19:00', every_n_days: 1 },
  ],
  cat: [
    { template_key: 'task.cat.meal.morning', kind: 'meal', time_of_day: '07:30', every_n_days: 1 },
    { template_key: 'task.cat.water.fresh', kind: 'water', time_of_day: null, every_n_days: 1 },
    { template_key: 'task.cat.litter.scoop', kind: 'litter', time_of_day: null, every_n_days: 1 },
    { template_key: 'task.cat.meal.evening', kind: 'meal', time_of_day: '19:00', every_n_days: 1 },
  ],
};

/** Mirrors the server seed trigger (backend-sync.md 3.2). The server value wins. */
export function isStreakCritical(species: Species, kind: TaskKind): boolean {
  if (species === 'dog') return kind === 'meal' || kind === 'med' || kind === 'walk';
  return kind === 'meal' || kind === 'med' || kind === 'water';
}

export type NewTask = TaskTemplate & { anchor_date: LocalDate; streak_critical: boolean };
export function defaultRoutine(species: Species, today: LocalDate): NewTask[] {
  return ROUTINE_DEFAULTS[species].map((t) => ({ ...t, anchor_date: today, streak_critical: isStreakCritical(species, t.kind) }));
}
