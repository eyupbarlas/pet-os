import { Image, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button, Screen, Text } from '../src/ui/primitives';
import { useT } from '../src/i18n';
import { useAuth } from '../src/data/auth/AuthProvider';
import { usePendingInvite } from '../src/features/household/pendingInvite';

export default function Welcome() {
  const t = useT();
  const router = useRouter();
  const { session, loading } = useAuth();
  const { token: pendingInvite, loaded } = usePendingInvite();
  // A tapped invite link wins over everything else once signed in (it survives the sign-in trip).
  if (!loading && session && loaded) return <Redirect href={pendingInvite ? '/join' : '/(tabs)/today'} />;
  return (
    <Screen bottomInset style={{ justifyContent: 'center', gap: 16 }}>
      <Image source={require('../assets/lockup.png')} resizeMode="contain" style={{ height: 120, width: '100%' }} accessibilityLabel={t('app.name')} />
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '700' }}>{t('welcome.title')}</Text>
        <Text muted>{t('welcome.subtitle')}</Text>
      </View>
      <Button label={t('welcome.start')} onPress={() => router.push('/sign-in')} />
      {__DEV__ && <Button secondary label={t('diagnostics.title')} onPress={() => router.push('/diagnostics')} />}
    </Screen>
  );
}
