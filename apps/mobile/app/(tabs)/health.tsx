import { Screen, Text } from '../../src/ui/primitives';
import { useT } from '../../src/i18n';

export default function HealthTab() {
  const t = useT();
  return (
    <Screen>
      <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{t('tabs.health')}</Text>
    </Screen>
  );
}
