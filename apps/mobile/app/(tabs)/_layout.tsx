import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStatus } from '@powersync/react';
import { useAuth } from '../../src/data/auth/AuthProvider';
import { useMembership } from '../../src/data/queries';
import { usePendingInvite } from '../../src/features/household/pendingInvite';
import { useT } from '../../src/i18n';
import { Screen, Text } from '../../src/ui/primitives';
import { useTheme } from '../../src/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
const icon = (on: IconName, off: IconName) =>
  ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) =>
    <Ionicons name={focused ? on : off} color={color as string} size={size} />;

// Gate for everything behind sign-in (mobile.md 4.1/4.4): no session → Welcome; signed in without
// a household → onboarding, but only after the first sync, so a second phone never creates a
// duplicate household while the existing one is still downloading.
export default function TabsLayout() {
  const t = useT();
  const th = useTheme();
  const { session, loading } = useAuth();
  const status = useStatus();
  const { membership, isLoading } = useMembership(session?.user.id);
  const { token: pendingInvite, loaded: inviteLoaded } = usePendingInvite();

  if (!loading && !session) return <Redirect href="/" />;
  if (!membership) {
    // Invited: join that household instead of creating a new one.
    if (inviteLoaded && pendingInvite) return <Redirect href="/join" />;
    if (!loading && !isLoading && inviteLoaded && status.hasSynced) return <Redirect href="/onboarding" />;
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text muted>{t('common.loading')}</Text>
      </Screen>
    );
  }

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
