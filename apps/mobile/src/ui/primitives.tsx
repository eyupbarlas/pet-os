import { Pressable, Text as RNText, TextInput, View, type TextInputProps, type TextProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { minTouch, radius, spacing } from '@petos/tokens';
import { useTheme } from './theme';

/**
 * Full-screen container. Pads the top by the status bar / notch inset so headers never sit under
 * it. Screens outside the tab bar pass `bottomInset` (the tab bar handles the bottom inside tabs).
 */
export function Screen({ style, bottomInset, ...p }: ViewProps & { bottomInset?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View {...p}
      style={[{ flex: 1, backgroundColor: t.bg, padding: spacing.md, paddingTop: insets.top + spacing.md,
                paddingBottom: (bottomInset ? insets.bottom : 0) + spacing.md }, style]} />
  );
}
export function Text({ muted, style, ...p }: TextProps & { muted?: boolean }) {
  const t = useTheme();
  return <RNText {...p} style={[{ color: muted ? t.textMuted : t.text, fontSize: 16 }, style]} />;
}
export function Button({ label, onPress, secondary, disabled }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({
        minHeight: minTouch + 8, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md,
        backgroundColor: secondary ? t.surface : t.accent, paddingHorizontal: spacing.lg,
        opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
      })}>
      <RNText style={{ color: secondary ? t.text : t.onAccent, fontWeight: '700', fontSize: 17 }}>{label}</RNText>
    </Pressable>
  );
}
export function Field({ label, hint, ...p }: TextInputProps & { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 15, fontWeight: '800' }}>{label}</Text>
      <TextInput placeholderTextColor={t.textMuted} accessibilityLabel={label} {...p}
        style={{ minHeight: 50, borderWidth: 2, borderColor: t.border, borderRadius: radius.md, paddingHorizontal: 16,
                 fontSize: 16, fontWeight: '600', color: t.text, backgroundColor: t.bg }} />
      {hint ? <Text muted style={{ fontSize: 13 }}>{hint}</Text> : null}
    </View>
  );
}
/** Single-choice pill (species, yes/no, time presets). */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}
      style={{ minHeight: minTouch, paddingHorizontal: 18, borderRadius: radius.md, justifyContent: 'center',
               borderWidth: 2.5, borderColor: selected ? t.text : t.border, backgroundColor: selected ? t.surface : t.bg }}>
      <RNText style={{ color: t.text, fontWeight: '800', fontSize: 15 }}>{label}</RNText>
    </Pressable>
  );
}
/** Rounded surface for grouped content (list rows, previews, nudges). */
export function Card({ style, ...p }: ViewProps) {
  const t = useTheme();
  return <View {...p} style={[{ backgroundColor: t.bg, borderRadius: radius.md, padding: 14, gap: 10 }, style]} />;
}
/** Compact outlined action for rows (remove, share again). */
export function SmallButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({
        minHeight: minTouch, paddingHorizontal: 14, borderRadius: radius.md, justifyContent: 'center',
        borderWidth: 2, borderColor: t.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}>
      <RNText style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{label}</RNText>
    </Pressable>
  );
}
