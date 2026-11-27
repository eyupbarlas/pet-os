// First run after sign-in (spec 001 need 1, mobile.md 4.1 adapted): name the household, add a dog
// or cat, confirm its default routine. Everything is written in one local transaction, so it
// works offline and syncs when the phone is back online.
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getCalendars } from 'expo-localization';
import { ROUTINE_DEFAULTS, isStreakCritical, type Species } from '@petos/domain';
import { minTouch, radius } from '@petos/tokens';
import { useAuth } from '../../data/auth/AuthProvider';
import { createHousehold } from '../../data/mutations';
import { useMembership } from '../../data/queries';
import { useT } from '../../i18n';
import { Button, Chip, Field, Screen, Text } from '../../ui/primitives';
import { useTheme } from '../../ui/theme';
import { useHouseholdToday } from '../today/useHouseholdToday';
import { kindIcon } from '../today/kindIcon';

const deviceZone = () => getCalendars()[0]?.timeZone ?? 'Europe/Warsaw';

function suggestedName(meta: Record<string, unknown> | undefined) {
  const v = meta?.given_name ?? meta?.first_name ?? meta?.full_name ?? meta?.name ?? meta?.display_name;
  return typeof v === 'string' ? v.split(' ')[0]!.slice(0, 60) : '';
}

export function OnboardingScreen() {
  const t = useT();
  const th = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { membership } = useMembership(userId);
  const timezone = useMemo(deviceZone, []);
  const today = useHouseholdToday(timezone);

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(() => suggestedName(session?.user.user_metadata));
  const [householdName, setHouseholdName] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [hasMed, setHasMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('19:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/" />;
  // Already in a household (second phone, or just created): straight to Today.
  if (membership) return <Redirect href="/(tabs)/today" />;

  const name = displayName.trim();
  const pet = petName.trim();
  const householdDefault = name ? t('onboarding.householdDefault', { name }) : '';
  const templates = ROUTINE_DEFAULTS[species];

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await createHousehold({
        userId: session.user.id, displayName: name, timezone, today,
        householdName: (householdName.trim() || householdDefault).slice(0, 60),
        pet: { name: pet.slice(0, 40), species },
        tasks: templates.filter((x) => !removed.has(x.template_key)),
        med: hasMed && medName.trim() ? { name: medName.trim().slice(0, 60), time_of_day: medTime } : null,
      });
      // The new member row makes `membership` non-null, which redirects to Today.
    } catch (e) {
      console.warn('[onboarding] save failed:', e);
      setError(__DEV__ ? `${t('onboarding.saveFailed')} (${String((e as Error)?.message ?? e)})` : t('onboarding.saveFailed'));
      setSaving(false);
    }
  };

  const canNext = step === 1 ? name.length > 0 : step === 2 ? pet.length > 0 : !saving && (!hasMed || medName.trim().length > 0);

  return (
    <Screen bottomInset style={{ backgroundColor: th.surface, paddingHorizontal: 24 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {step > 1 ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => setStep(step - 1)}
              style={{ width: minTouch, height: minTouch, borderRadius: minTouch / 2, borderWidth: 2, borderColor: th.border,
                       backgroundColor: th.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={20} color={th.text} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {[1, 2, 3].map((n) => (
              <View key={n} style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: n <= step ? th.text : th.border }} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4 }}>
            <Text muted style={{ fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('onboarding.step', { n: step })}
            </Text>
            <Text accessibilityRole="header" style={{ fontSize: 30, fontWeight: '700', lineHeight: 34 }}>
              {step === 1 ? t('onboarding.householdTitle') : step === 2 ? t('onboarding.petTitle') : t('onboarding.routineTitle', { name: pet })}
            </Text>
            {step === 3 ? <Text muted>{t('onboarding.routineSubtitle')}</Text> : null}
          </View>

          {step === 1 ? (
            <>
              <Field label={t('onboarding.yourName')} hint={t('onboarding.yourNameHint')} value={displayName}
                onChangeText={setDisplayName} maxLength={60} autoComplete="given-name" textContentType="givenName" autoFocus={!displayName} />
              <Field label={t('onboarding.householdName')} value={householdName} onChangeText={setHouseholdName}
                placeholder={householdDefault} maxLength={60} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label={t('onboarding.petName')} value={petName} onChangeText={setPetName} maxLength={40} autoFocus autoCapitalize="words" />
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '800' }}>{t('onboarding.species')}</Text>
                <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
                  {(['dog', 'cat'] as const).map((s) => (
                    <Chip key={s} label={t(`onboarding.${s}`)} selected={species === s} onPress={() => { setSpecies(s); setRemoved(new Set()); }} />
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={{ backgroundColor: th.bg, borderRadius: radius.lg, padding: 8 }}>
                {templates.map((x) => {
                  const on = !removed.has(x.template_key);
                  const label = t(x.template_key);
                  return (
                    <Pressable key={x.template_key} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label}
                      onPress={() => setRemoved((prev) => { const n = new Set(prev); if (on) n.add(x.template_key); else n.delete(x.template_key); return n; })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 8, opacity: on ? 1 : 0.55 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: th.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={kindIcon(x.kind)} size={20} color={th.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: '700', textDecorationLine: on ? 'none' : 'line-through' }}>{label}</Text>
                        <Text muted style={{ fontSize: 13, fontWeight: '600' }}>
                          {x.time_of_day ?? t('onboarding.anyTime')}
                          {isStreakCritical(species, x.kind) ? ` · ${t('onboarding.countsForStreak')}` : ''}
                        </Text>
                      </View>
                      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={th.text} />
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ backgroundColor: th.bg, borderRadius: radius.lg, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="medkit-outline" size={20} color={th.text} />
                  <Text style={{ flex: 1, fontSize: 17, fontWeight: '700' }}>{t('onboarding.medsQuestion')}</Text>
                  <Chip label={t('onboarding.no')} selected={!hasMed} onPress={() => setHasMed(false)} />
                  <Chip label={t('onboarding.yes')} selected={hasMed} onPress={() => setHasMed(true)} />
                </View>
                {hasMed ? (
                  <>
                    <Field label={t('onboarding.medName')} placeholder={t('onboarding.medNamePlaceholder')} value={medName} onChangeText={setMedName} maxLength={60} />
                    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 10 }}>
                      <Chip label={`${t('onboarding.morning')} · 08:00`} selected={medTime === '08:00'} onPress={() => setMedTime('08:00')} />
                      <Chip label={`${t('onboarding.evening')} · 19:00`} selected={medTime === '19:00'} onPress={() => setMedTime('19:00')} />
                    </View>
                  </>
                ) : null}
              </View>
            </>
          ) : null}
          {error ? <Text style={{ color: th.accent }}>{error}</Text> : null}
        </ScrollView>

        <Button disabled={!canNext} label={step < 3 ? t('common.next') : t('onboarding.save', { name: pet })}
          onPress={() => (step < 3 ? setStep(step + 1) : void save())} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
