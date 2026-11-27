import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { TaskKind } from '@petos/domain';

type IconName = ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<TaskKind, IconName> = {
  meal: 'restaurant-outline', walk: 'paw-outline', water: 'water-outline',
  litter: 'sparkles-outline', med: 'medkit-outline', custom: 'ellipse-outline',
};
export const kindIcon = (k: TaskKind): IconName => ICONS[k] ?? 'ellipse-outline';
