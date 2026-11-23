import { Screen, Text } from '../../src/ui/primitives';
import { useT } from '../../src/i18n';

export default function TodayTab() {
  const t = useT();
  return (
    <Screen style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('tabs.today')}</Text>
      <Text muted>{t('today.empty')}</Text>
      <Text muted>{t('today.streak', { count: 0 })}</Text>
    </Screen>
  );
}
