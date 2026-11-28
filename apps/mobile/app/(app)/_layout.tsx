import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useStatus } from '@powersync/react';
import { useAuth } from '../../src/data/auth/AuthProvider';
import { useMembership } from '../../src/data/queries';
import { markHadHousehold, useHadHousehold } from '../../src/features/household/hadHousehold';
import { usePendingInvite } from '../../src/features/join/pendingInvite';
import { useT } from '../../src/i18n';
import { Screen, Text } from '../../src/ui/primitives';

// Gate for everything behind sign-in with a household (mobile.md 2.3, 4.1, 4.4):
// - no session: Welcome (or the invited path when a link is waiting);
// - a tapped invite link: the join screen;
// - no household after the first sync: first run sets one up, but someone who had one (removed,
//   left, deleted) sees "no household". Waiting for the first sync means a second phone never
//   creates a duplicate while the real household is still downloading.
export default function AppLayout() {
  const t = useT();
  const { session, loading } = useAuth();
  const status = useStatus();
  const userId = session?.user.id;
  const { membership, isLoading } = useMembership(userId);
  const { token: pendingInvite, loaded: inviteLoaded } = usePendingInvite();
  const had = useHadHousehold(userId);

  useEffect(() => {
    if (userId && membership) void markHadHousehold(userId);
  }, [userId, membership]);

  if (!loading && !session) return <Redirect href={pendingInvite ? '/join-account' : '/welcome'} />;
  if (!membership) {
    if (inviteLoaded && pendingInvite) return <Redirect href="/confirm" />;
    if (!loading && !isLoading && inviteLoaded && status.hasSynced && had !== null) {
      return <Redirect href={had ? '/no-household' : '/setup'} />;
    }
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text muted>{t('common.loading')}</Text>
      </Screen>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="household" />
      <Stack.Screen name="invite" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.45], sheetGrabberVisible: true }} />
    </Stack>
  );
}
