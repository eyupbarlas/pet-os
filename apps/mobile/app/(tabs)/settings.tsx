import { View } from 'react-native';
import { Button, Screen, Text } from '../../src/ui/primitives';
import { useT } from '../../src/i18n';
import { useAuth } from '../../src/data/auth/AuthProvider';
import { signOut } from '../../src/data/auth/signIn';

// Settings proper is a later slice; sign-out moved here from the old Today placeholder.
export default function SettingsTab() {
  const t = useT();
  const { session } = useAuth();
  return (
    <Screen style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('tabs.settings')}</Text>
      {session?.user.email ? <Text muted>{t('settings.signedInAs', { email: session.user.email })}</Text> : null}
      <View style={{ flex: 1 }} />
      <Button secondary label={t('auth.signOut')} onPress={() => void signOut()} />
    </Screen>
  );
}
