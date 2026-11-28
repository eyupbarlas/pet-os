// Household (spec 001 need 2, ADR 0019, backend-sync S9): members, invite links, and the owner's
// controls. Owner-only controls are hidden for members. Invites, removal, hand-over, leaving and
// deleting are online RPCs; the result reaches every phone with the next sync. Rename is a local
// write like any other edit.
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { minTouch, radius, spacing } from '@petos/tokens';
import { config } from '../../config';
import { useAuth } from '../../data/auth/AuthProvider';
import { renameHousehold } from '../../data/mutations';
import { useHousehold, useMembers, useMembership, useOpenInvites, usePets, type InviteRow, type MemberRow } from '../../data/queries';
import { parseTimestamp } from '../../data/queries/time';
import {
  createInvite, deleteHousehold, leaveHousehold, removeMember, revokeInvite, transferOwnership, type RpcError,
} from '../../data/rpc/household';
import { deviceLocale, useT } from '../../i18n';
import { Button, Field, Screen, Text } from '../../ui/primitives';
import { useTheme } from '../../ui/theme';
import { inviteUrl } from './inviteLink';

const MAX_MEMBERS = 6;
const bcp47 = deviceLocale === 'pl_PL' ? 'pl-PL' : 'en-US';
const fmtDate = (iso: string | null) => {
  if (!iso) return '';
  try { return new Date(parseTimestamp(iso)).toLocaleDateString(bcp47, { day: 'numeric', month: 'short' }); } catch { return ''; }
};

export function HouseholdScreen() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const me = session?.user.id;
  const { membership } = useMembership(me);
  const householdId = membership?.household_id;
  const household = useHousehold(householdId);
  const members = useMembers(householdId);
  const invites = useOpenInvites(householdId);
  const pets = usePets(householdId);
  const isOwner = !!me && household?.owner_id === me;
  const owner = members.find((m) => m.user_id === household?.owner_id);
  const others = members.filter((m) => m.user_id !== me);

  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shownName = name ?? household?.name ?? '';
  const householdName = household?.name ?? '';
  const memberName = (m: MemberRow | undefined) => m?.display_name || t('today.formerMember');

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      return await fn();
    } catch (e) {
      setError((e as RpcError).code ?? 'unknown');
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const share = async (token: string) => {
    const url = inviteUrl(config.webUrl, token);
    await Share.share({ message: t('household.inviteMessage', { household: householdName, url }) });
  };

  const invite = () => run('invite', async () => {
    const res = await createInvite(householdId!);
    await share(res.token);
  });

  const confirm = (title: string, body: string, action: string, onYes: () => void, destructive = true) =>
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: destructive ? 'destructive' : 'default', onPress: onYes },
    ]);

  const remove = (m: MemberRow) => confirm(
    t('household.removeTitle', { name: memberName(m) }), t('household.removeBody', { name: memberName(m) }), t('household.remove'),
    () => void run(`remove:${m.id}`, async () => {
      await removeMember(m.id);
      setNotice(t('household.removed', { name: memberName(m) }));
    }),
  );

  const makeOwner = (m: MemberRow) => confirm(
    t('household.makeOwnerTitle', { name: memberName(m) }), t('household.makeOwnerBody', { name: memberName(m) }), t('household.makeOwner'),
    () => void run(`owner:${m.id}`, () => transferOwnership(householdId!, m.id)), false,
  );

  const nextOwner = useMemo(() => members.find((m) => m.user_id !== me), [members, me]);
  const leave = () => confirm(
    t('household.leaveTitle', { name: householdName }),
    others.length === 0 ? t('household.leaveLastBody')
      : isOwner ? t('household.leaveOwnerBody', { next: memberName(nextOwner) }) : t('household.leaveBody'),
    t('household.leave'),
    () => void run('leave', async () => {
      await leaveHousehold(householdId!);
      router.replace('/');
    }),
  );

  const remove_ = () => confirm(
    t('household.deleteTitle', { name: householdName }),
    t('household.deleteBody', {
      pets: pets.map((p) => p.name).join(', ') || t('household.noPets'),
      members: members.map((m) => (m.user_id === me ? t('household.you') : memberName(m))).join(', '),
    }),
    t('household.deleteConfirm'),
    () => void run('delete', async () => {
      await deleteHousehold(householdId!);
      router.replace('/');
    }),
  );

  if (!session) return <Redirect href="/" />;
  if (!membership) {
    // Left, removed or deleted: the gate decides where to go next.
    return <Redirect href="/" />;
  }

  return (
    <Screen bottomInset style={{ backgroundColor: th.surface, paddingHorizontal: 0, paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: spacing.xl, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()}
            style={{ minWidth: minTouch, minHeight: minTouch, justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={26} color={th.text} />
          </Pressable>
          <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '800', flex: 1 }} numberOfLines={1}>
            {householdName || t('household.title')}
          </Text>
        </View>

        {notice ? <Text accessibilityRole="alert" muted>{notice}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={{ color: th.accent }}>{t(`error.${error}`)}</Text> : null}

        {isOwner ? (
          <View style={{ gap: 10 }}>
            <Field label={t('household.name')} value={shownName} onChangeText={setName} maxLength={60} />
            {name !== null && name.trim() && name.trim() !== householdName ? (
              <Button secondary label={t('household.rename')} onPress={() => {
                void renameHousehold(householdId!, name.trim().slice(0, 60)).then(() => { setName(null); setNotice(t('household.renamed')); });
              }} />
            ) : null}
          </View>
        ) : null}

        <Section title={t('household.members')}>
          {members.map((m) => (
            <View key={m.id} style={{ backgroundColor: th.bg, borderRadius: radius.md, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={m.user_id === household?.owner_id ? 'star' : 'person-outline'} size={20} color={th.text} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800' }}>
                    {memberName(m)}{m.user_id === me ? ` (${t('household.you')})` : ''}
                  </Text>
                  <Text muted style={{ fontSize: 13 }}>
                    {[m.user_id === household?.owner_id ? t('household.owner') : null, t('household.joined', { date: fmtDate(m.joined_at) })]
                      .filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {busy === `remove:${m.id}` || busy === `owner:${m.id}` ? <ActivityIndicator color={th.accent} /> : null}
              </View>
              {isOwner && m.user_id !== me ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SmallButton label={t('household.makeOwner')} disabled={!!busy} onPress={() => makeOwner(m)} />
                  <SmallButton label={t('household.remove')} disabled={!!busy} onPress={() => remove(m)} />
                </View>
              ) : null}
            </View>
          ))}
        </Section>

        {isOwner ? (
          <Section title={t('household.invite')}>
            {members.length >= MAX_MEMBERS ? <Text muted>{t('household.inviteFull')}</Text> : (
              <>
                <Text muted>{t('household.inviteHint')}</Text>
                <Button label={busy === 'invite' ? '…' : t('household.invite')} disabled={!!busy} onPress={() => void invite()} />
              </>
            )}
            {invites.length ? <Text style={{ fontWeight: '800', marginTop: 8 }}>{t('household.openInvites')}</Text> : null}
            {invites.map((i: InviteRow) => (
              <View key={i.id} style={{ backgroundColor: th.bg, borderRadius: radius.md, padding: 14, gap: 10 }}>
                <Text>{t('household.inviteExpires', { date: fmtDate(i.expires_at) })}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SmallButton label={t('household.share')} disabled={!!busy} onPress={() => void share(i.token)} />
                  <SmallButton label={t('household.inviteOff')} disabled={!!busy}
                    onPress={() => void run(`revoke:${i.id}`, () => revokeInvite(i.id))} />
                </View>
              </View>
            ))}
          </Section>
        ) : owner ? (
          <Text muted>{t('household.ownerOnly', { name: memberName(owner) })}</Text>
        ) : null}

        <View style={{ gap: 12, marginTop: 8 }}>
          <Button secondary label={t('household.leave')} disabled={!!busy} onPress={leave} />
          {isOwner ? <Button secondary label={t('household.delete')} disabled={!!busy} onPress={remove_} /> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '800' }}>{title}</Text>
      {children}
    </View>
  );
}

function SmallButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const th = useTheme();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({
        minHeight: minTouch, paddingHorizontal: 14, borderRadius: radius.md, justifyContent: 'center',
        borderWidth: 2, borderColor: th.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}>
      <Text style={{ fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}
