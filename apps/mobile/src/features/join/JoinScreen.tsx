// Join a household from an invite link (spec 001 need 2, ADR 0019, mobile.md 4.2): preview what
// will happen, confirm a name, then accept. Works for a brand-new user (no household yet) and for
// someone who already has one: a sole member brings their pets, otherwise they leave the old
// household and its pets stay there. Needs a connection; the new household arrives by sync.
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { spacing } from '@petos/tokens';
import { useAuth } from '../../data/auth/AuthProvider';
import { suggestedName } from '../../data/auth/suggestedName';
import { useMembership, useMyDisplayName } from '../../data/queries';
import { acceptInvite, previewInvite, type InvitePreview, type RpcError } from '../../data/rpc/household';
import { useAsyncAction } from '../../data/rpc/useAsyncAction';
import { useT } from '../../i18n';
import { Button, Card, Field, Screen, Text } from '../../ui/primitives';
import { useTheme } from '../../ui/theme';
import { useCurrentPetStore } from '../../data/currentPet';
import { usePendingInvite } from './pendingInvite';

const list = (xs: string[] | undefined) => (xs ?? []).filter(Boolean).join(', ');

export function JoinScreen() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { session, loading } = useAuth();
  const userId = session?.user.id;
  const { token, loaded, clear } = usePendingInvite();
  const { membership } = useMembership(userId);
  const savedName = useMyDisplayName(userId);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const { busy: joining, error: joinError, run } = useAsyncAction();
  const error = joinError ?? previewError;
  const [joinedId, setJoinedId] = useState<string | null>(null);

  useEffect(() => {
    if (!name) setName(savedName ?? suggestedName(session?.user.user_metadata));
  }, [savedName, session]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token || !session) return;
    let live = true;
    setPreviewError(null);
    previewInvite(token)
      .then((p) => { if (live) setPreview(p); })
      .catch((e) => { if (live) setPreviewError((e as RpcError).code ?? 'unknown'); });
    return () => { live = false; };
  }, [token, session]);

  // After accepting, wait until the new household has synced, then go to Today.
  const arrived = joinedId && membership?.household_id === joinedId;
  useEffect(() => {
    if (arrived) {
      useCurrentPetStore.setState({ petId: null });
      clear();
    }
  }, [arrived, clear]);

  if (!loading && !session) return <Redirect href="/" />;
  if (arrived) return <Redirect href="/today" />;
  if (loaded && !token && !joinedId) return <Redirect href="/" />;

  const leave = () => { clear(); router.replace('/'); };

  const join = async () => {
    if (!token || !preview) return;
    const outcome = preview.my_current?.outcome;
    const res = await run('join', () => acceptInvite(token, name.trim().slice(0, 60), outcome === 'leave_pets_stay'));
    if (res) setJoinedId(res.household_id);
  };

  const status = preview?.status;
  const blocked = status && status !== 'ok';
  const household = preview?.household_name ?? '';
  const mine = preview?.my_current;

  let body;
  if (joinedId) {
    body = (
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
        <ActivityIndicator color={th.accent} />
        <Text muted>{t('common.loading')}</Text>
      </View>
    );
  } else if (blocked || (error && !preview)) {
    const key = blocked ? (status === 'already_member' ? 'join.alreadyMember' : `app.error.${status}`) : `app.error.${error}`;
    body = (
      <View style={{ gap: 16 }}>
        <Text accessibilityRole="alert">{t(key)}</Text>
        <Button label={t('join.ok')} onPress={leave} />
      </View>
    );
  } else if (!preview) {
    body = <ActivityIndicator color={th.accent} style={{ paddingTop: 40 }} />;
  } else {
    body = (
      <View style={{ gap: 20 }}>
        <Card style={{ gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '800' }}>
            {preview.inviter_name ? t('join.invitedBy', { name: preview.inviter_name, household }) : t('join.invited', { household })}
          </Text>
          {preview.member_names?.length ? <Text muted>{t('join.members', { names: list(preview.member_names) })}</Text> : null}
          {preview.pet_names?.length ? <Text muted>{t('join.pets', { names: list(preview.pet_names) })}</Text> : null}
        </Card>
        {preview.full ? (
          <>
            <Text accessibilityRole="alert">{t('join.full')}</Text>
            <Button label={t('join.ok')} onPress={leave} />
          </>
        ) : (
          <>
            <Field label={t('join.yourName')} hint={t('join.yourNameHint')} value={name} onChangeText={setName}
              maxLength={60} autoCapitalize="words" textContentType="givenName" />
            {mine ? (
              <View style={{ gap: 6 }}>
                <Text>
                  {mine.outcome === 'pets_come_along'
                    ? t('join.petsComeAlong', { current: mine.household_name ?? '', pets: list(mine.pets.map((p) => p.name)) || '—' })
                    : t('join.leaveOld', { current: mine.household_name ?? '', others: list(mine.other_member_names) })}
                </Text>
                {mine.new_owner_name ? <Text muted>{t('join.newOwner', { name: mine.new_owner_name, current: mine.household_name ?? '' })}</Text> : null}
              </View>
            ) : null}
            {error ? <Text accessibilityRole="alert" style={{ color: th.accent }}>{t(`app.error.${error}`)}</Text> : null}
            <Button label={joining ? t('join.joining') : t('join.join', { household })} disabled={!!joining || !name.trim()} onPress={join} />
            <Button secondary label={t('join.notNow')} disabled={!!joining} onPress={leave} />
          </>
        )}
      </View>
    );
  }

  return (
    <Screen bottomInset style={{ backgroundColor: th.surface, paddingHorizontal: 24 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '800' }}>{t('join.title')}</Text>
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
