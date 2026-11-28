import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '../../ui/primitives';
import { useT } from '../../i18n';
import { useTheme } from '../../ui/theme';
import { requestEmailCode, signInWithApple, signInWithGoogle, verifyEmailCode } from '../../data/auth/signIn';

export function SignInScreen({ invited }: { invited?: boolean }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ error: { message: string } | null } | unknown>) => {
    setError(null);
    try {
      const res = (await fn()) as { error?: { message: string } | null } | undefined;
      if (res?.error) setError(res.error.message);
      else if (sent || res !== undefined) router.replace('/');
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') setError(String(e?.message ?? e)); // user cancelled: no error
    }
  };
  const input = { borderWidth: 1, borderColor: th.border, color: th.text, borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: th.surface } as const;

  return (
    <Screen bottomInset style={{ gap: 12, justifyContent: 'center' }}>
      <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700' }}>{t('auth.title')}</Text>
      {invited ? <Text muted>{t('join.signInFirst')}</Text> : null}
      <TextInput value={email} onChangeText={setEmail} placeholder={t('auth.email')} placeholderTextColor={th.textMuted}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={input} accessibilityLabel={t('auth.email')} />
      {!sent ? (
        <Button label={t('auth.sendCode')} onPress={async () => {
          setError(null);
          const { error: e } = await requestEmailCode(email.trim());
          if (e) setError(e.message); else setSent(true);
        }} />
      ) : (
        <View style={{ gap: 12 }}>
          <Text muted>{t('auth.codeSent')}</Text>
          <TextInput value={code} onChangeText={setCode} placeholder={t('auth.code')} placeholderTextColor={th.textMuted}
            keyboardType="number-pad" maxLength={8} style={input} accessibilityLabel={t('auth.code')} />
          <Button label={t('auth.verify')} onPress={() => run(() => verifyEmailCode(email.trim(), code.trim()))} />
        </View>
      )}
      <Button secondary label={t('auth.google')} onPress={() => run(signInWithGoogle)} />
      {Platform.OS === 'ios' && <Button secondary label={t('auth.apple')} onPress={() => run(signInWithApple)} />}
      {error && <Text accessibilityRole="alert" style={{ color: th.accent }}>{error}</Text>}
    </Screen>
  );
}
