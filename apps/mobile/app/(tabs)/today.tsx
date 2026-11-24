import { useQuery, useStatus } from '@powersync/react';
import { Screen, Text } from '../../src/ui/primitives';
import { useT } from '../../src/i18n';
import { signOut } from '../../src/data/auth/signIn';
import { Button } from '../../src/ui/primitives';

// First synced screen: proves sign-in, replication and the local database work end to end.
// The real Today list (ticks, streak) replaces this.
export default function TodayTab() {
  const t = useT();
  const status = useStatus();
  const { data: pets } = useQuery<{ id: string; name: string; species: string }>('select id, name, species from pet order by sort_order');
  return (
    <Screen style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('tabs.today')}</Text>
      <Text muted>{status.connected ? t('today.syncConnected') : t('today.syncOffline')}</Text>
      {pets.length === 0 ? <Text muted>{t('today.empty')}</Text> : pets.map((p) => <Text key={p.id}>{p.name} · {p.species}</Text>)}
      <Button secondary label={t('auth.signOut')} onPress={() => void signOut()} />
    </Screen>
  );
}
