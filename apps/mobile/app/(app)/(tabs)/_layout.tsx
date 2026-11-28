import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useT } from '../../../src/i18n';
import { useTheme } from '../../../src/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const icon = (on: IconName, off: IconName) =>
  ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={focused ? on : off} color={color as string} size={size} />;

// The session and household gate lives one level up, in (app)/_layout.
export default function TabsLayout() {
  const t = useT();
  const th = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: th.accent, tabBarInactiveTintColor: th.textMuted,
                           tabBarStyle: { backgroundColor: th.bg, borderTopColor: th.border } }}>
      <Tabs.Screen name="today" options={{ title: t('tabs.today'), tabBarIcon: icon('checkmark-circle', 'checkmark-circle-outline') }} />
      <Tabs.Screen name="routine" options={{ title: t('tabs.routine'), tabBarIcon: icon('list', 'list-outline') }} />
      <Tabs.Screen name="health" options={{ title: t('tabs.health'), tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen name="pet" options={{ title: t('tabs.pet'), tabBarIcon: icon('paw', 'paw-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: icon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
