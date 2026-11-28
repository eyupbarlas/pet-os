// Removed, left, or the household was deleted (mobile.md 4.4). Neutral copy; the person can start
// a new household or open an invite link they were sent.
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../data/auth/AuthProvider';
import { signOut } from '../../data/auth/signIn';
import { useMembership } from '../../data/queries';
import { useT } from '../../i18n';
import { Button, Screen, Text } from '../../ui/primitives';

export function NoHouseholdScreen() {
  const t = useT();
  const router = useRouter();
  const { session, loading } = useAuth();
  const { membership } = useMembership(session?.user.id);
  if (!loading && !session) return <Redirect href="/" />;
  if (membership) return <Redirect href="/today" />; // joined from a link in the meantime
  return (
    <Screen bottomInset style={{ justifyContent: 'center', gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '700' }}>{t('noHousehold.title')}</Text>
      <Text muted>{t('noHousehold.body')}</Text>
      <View style={{ gap: 10 }}>
        <Button label={t('noHousehold.create')} onPress={() => router.replace('/setup')} />
        <Text muted style={{ textAlign: 'center' }}>{t('noHousehold.joinHint')}</Text>
        <Button secondary label={t('auth.signOut')} onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}
