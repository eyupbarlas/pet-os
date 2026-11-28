import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Screen, Text } from '../../../src/ui/primitives';
import { useT } from '../../../src/i18n';
import { useAuth } from '../../../src/data/auth/AuthProvider';
import { signOut } from '../../../src/data/auth/signIn';
import { useTheme } from '../../../src/ui/theme';

// Settings proper is a later slice; sign-out moved here from the old Today placeholder.
export default function SettingsTab() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  return (
    <Screen style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('tabs.settings')}</Text>
      {session?.user.email ? <Text muted>{t('settings.signedInAs', { email: session.user.email })}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => router.push('/household')}
        style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: th.surface }}>
        <Ionicons name="people-outline" size={24} color={th.text} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800' }}>{t('settings.household')}</Text>
          <Text muted style={{ fontSize: 13 }}>{t('settings.householdHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={th.textMuted} />
      </Pressable>
      <View style={{ flex: 1 }} />
      <Button secondary label={t('auth.signOut')} onPress={() => void signOut()} />
    </Screen>
  );
}
