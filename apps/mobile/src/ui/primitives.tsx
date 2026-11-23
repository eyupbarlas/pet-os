import { Pressable, Text as RNText, View, type TextProps, type ViewProps } from 'react-native';
import { minTouch, radius, spacing } from '@petos/tokens';
import { useTheme } from './theme';

export function Screen({ style, ...p }: ViewProps) {
  const t = useTheme();
  return <View {...p} style={[{ flex: 1, backgroundColor: t.bg, padding: spacing.md }, style]} />;
}
export function Text({ muted, style, ...p }: TextProps & { muted?: boolean }) {
  const t = useTheme();
  return <RNText {...p} style={[{ color: muted ? t.textMuted : t.text, fontSize: 16 }, style]} />;
}
export function Button({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={{ minHeight: minTouch, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md,
               backgroundColor: secondary ? t.surface : t.accent, paddingHorizontal: spacing.lg }}>
      <RNText style={{ color: secondary ? t.text : t.onAccent, fontWeight: '600', fontSize: 16 }}>{label}</RNText>
    </Pressable>
  );
}
