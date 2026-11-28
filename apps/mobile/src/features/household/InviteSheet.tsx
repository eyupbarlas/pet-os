// Share sheet for a new invite link (mobile.md 2.3 `invite.tsx`, owner only). One tap creates the
// link on the server and opens the OS share sheet; no code to type (ruling 6).
import { Share, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { config } from '../../config';
import { useAuth } from '../../data/auth/AuthProvider';
import { useHousehold, useMembership } from '../../data/queries';
import { createInvite } from '../../data/rpc/household';
import { useAsyncAction } from '../../data/rpc/useAsyncAction';
import { inviteUrl } from '../../services/links/invite';
import { useT } from '../../i18n';
import { Button, Screen, Text } from '../../ui/primitives';
import { useTheme } from '../../ui/theme';

export function InviteSheet() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { membership } = useMembership(session?.user.id);
  const household = useHousehold(membership?.household_id);
  const { busy, error, run } = useAsyncAction();
  const isOwner = !!household && household.owner_id === session?.user.id;
  if (!membership || (household && !isOwner)) return <Redirect href="/household" />;

  const create = async () => {
    const res = await run('invite', () => createInvite(membership.household_id));
    if (!res) return;
    await Share.share({
      message: t('household.inviteMessage', { household: household?.name ?? '', url: inviteUrl(config.webUrl, res.token) }),
    });
    router.back();
  };

  return (
    <Screen bottomInset style={{ backgroundColor: th.surface, gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '800' }}>{t('household.invite')}</Text>
      <Text muted>{t('household.inviteSheetBody')}</Text>
      {error ? <Text accessibilityRole="alert" style={{ color: th.accent }}>{t(`app.error.${error}`)}</Text> : null}
      <View style={{ gap: 10 }}>
        <Button label={t('household.inviteShare')} disabled={!!busy} onPress={() => void create()} />
        <Button secondary label={t('common.cancel')} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
