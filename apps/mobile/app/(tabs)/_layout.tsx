import { Tabs } from 'expo-router';
import { useT } from '../../src/i18n';
import { useTheme } from '../../src/ui/theme';

export default function TabsLayout() {
  const t = useT();
  const th = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: th.accent, tabBarStyle: { backgroundColor: th.bg } }}>
      <Tabs.Screen name="today" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="routine" options={{ title: t('tabs.routine') }} />
      <Tabs.Screen name="health" options={{ title: t('tabs.health') }} />
      <Tabs.Screen name="pet" options={{ title: t('tabs.pet') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}
