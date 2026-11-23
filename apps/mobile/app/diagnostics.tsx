// Week-one checks (docs/week-one-checks.md). Dev builds only. Run on a real iPhone and a real
// Android phone, then paste the output into the checklist. Nothing here is verified in CI.
import { useState } from 'react';
import { ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { localDate } from '@petos/domain';
import { Button, Screen, Text } from '../src/ui/primitives';
import { useT } from '../src/i18n';

type Line = { name: string; ok: boolean; detail: string };

async function runChecks(): Promise<Line[]> {
  const out: Line[] = [];
  const add = (name: string, ok: boolean, detail: string) => out.push({ name, ok, detail });
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false });
    const spring = localDate(Date.UTC(2027, 2, 28, 22, 0), 'Europe/Warsaw');
    add('Hermes Intl time zones', fmt.format(Date.UTC(2027, 2, 28, 22, 0)) === '00:00' && spring === '2027-03-29', `00:00 CEST=${fmt.format(Date.UTC(2027, 2, 28, 22, 0))}, local date ${spring}`);
  } catch (e) { add('Hermes Intl time zones', false, String(e)); }
  try {
    const pr = new Intl.PluralRules('pl');
    const got = [1, 2, 5, 22, 25].map((n) => pr.select(n)).join(',');
    add('Hermes Intl.PluralRules (pl)', got === 'one,few,many,few,many', got);
  } catch (e) { add('Hermes Intl.PluralRules (pl)', false, String(e)); }
  try {
    const { powerSync } = await import('../src/data/powersync/system');
    const r = await powerSync.get<{ v: string }>('select sqlite_version() as v');
    add('op-sqlite + PowerSync open', true, `sqlite ${r.v}`);
  } catch (e) { add('op-sqlite + PowerSync open', false, String(e)); }
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) throw new Error('notification permission denied');
    for (let i = 0; i < 70; i++) {
      await Notifications.scheduleNotificationAsync({ content: { title: `test ${i}` }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3600 + i * 60 } });
    }
    const n = (await Notifications.getAllScheduledNotificationsAsync()).length;
    await Notifications.cancelAllScheduledNotificationsAsync();
    add('Scheduled notification cap', true, `scheduled 70, OS kept ${n} (iOS is expected to keep 64)`);
  } catch (e) { add('Scheduled notification cap', false, String(e)); }
  return out;
}

export default function Diagnostics() {
  const t = useT();
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <Screen style={{ gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('diagnostics.title')}</Text>
      <Button label={busy ? '...' : t('diagnostics.run')} onPress={async () => { setBusy(true); setLines(await runChecks()); setBusy(false); }} />
      <ScrollView>
        {lines.map((l) => (
          <Text key={l.name} style={{ marginBottom: 8 }}>{l.ok ? 'PASS' : 'FAIL'} · {l.name}{'\n'}<Text muted>{l.detail}</Text></Text>
        ))}
      </ScrollView>
    </Screen>
  );
}
