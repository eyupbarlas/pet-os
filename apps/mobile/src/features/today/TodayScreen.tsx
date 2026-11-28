// Today (spec 001 needs 4–6, mobile.md 3.5–3.6): the current pet's due tasks with tick buttons,
// "Done by" names, and the streak card. All reads are local queries, so ticks show instantly and
// another phone's ticks appear as soon as they sync.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useStatus } from '@powersync/react';
import { isDue, streakView } from '@petos/domain';
import { minTouch, radius, spacing } from '@petos/tokens';
import { useAuth } from '../../data/auth/AuthProvider';
import { tickTask, untickTask } from '../../data/mutations';
import { useMembers, usePetDay, usePets, type Membership, type TodayTask } from '../../data/queries';
import { parseTimestamp } from '../../data/queries/time';
import { deviceLocale, useT } from '../../i18n';
import { Button, Screen, Text } from '../../ui/primitives';
import { useTheme } from '../../ui/theme';
import { useCurrentPet, useCurrentPetStore } from '../pets/currentPet';
import { kindIcon } from './kindIcon';
import { useHouseholdToday } from './useHouseholdToday';

const bcp47 = deviceLocale === 'pl_PL' ? 'pl-PL' : 'en-US';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function formatTime(iso: string | null, timeZone: string) {
  if (!iso) return '';
  try {
    return new Date(parseTimestamp(iso)).toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', timeZone });
  } catch {
    return '';
  }
}

export function TodayScreen({ membership }: { membership: Membership }) {
  const t = useT();
  const th = useTheme();
  const { session } = useAuth();
  const me = session?.user.id ?? '';
  const status = useStatus();
  const router = useRouter();
  const members = useMembers(membership.household_id);
  const reduceMotion = useReduceMotion();
  const tz = membership.timezone;
  const today = useHouseholdToday(tz);
  const pets = usePets(membership.household_id);
  const pet = useCurrentPet(pets);
  const setPetId = useCurrentPetStore((s) => s.setPetId);
  const { tasks, streakInput } = usePetDay(pet, tz, today);

  const due = useMemo(() => tasks.filter((x) => isDue(x, today)), [tasks, today]);
  const streak = useMemo(() => streakView(streakInput), [streakInput]);
  const pending = due.filter((x) => !x.tick);
  const done = due.filter((x) => x.tick);
  const [showDone, setShowDone] = useState(true);

  const title = (x: TodayTask) => (x.template_key ? t(x.template_key) : x.title ?? '');
  const doneBy = (x: TodayTask) =>
    x.tick?.actor_id === me ? t('today.you') : x.tick?.actor_name ?? t('today.formerMember');

  const toggle = (x: TodayTask) => {
    if (!x.tick) {
      void tickTask(x, today, me);
      return;
    }
    const tickId = x.tick.id;
    if (!x.tick.actor_id || x.tick.actor_id === me) {
      void untickTask(tickId);
      return;
    }
    // Someone else's tick: confirm, so a stale screen can't cause a double feed (PO M-2).
    Alert.alert(t('today.undoOtherTitle'), t('today.undoOtherBody', { name: doneBy(x), time: formatTime(x.tick.client_at, tz) }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('today.undoOtherConfirm'), style: 'destructive', onPress: () => void untickTask(tickId) },
    ]);
  };

  const dateLine = useMemo(() => {
    try {
      return new Date().toLocaleDateString(bcp47, { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz });
    } catch {
      return today;
    }
    // `today` changes at household midnight, which is when this line must change.
  }, [today, tz]);

  if (!pet) {
    return (
      <Screen style={{ backgroundColor: th.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text muted>{t('common.loading')}</Text>
      </Screen>
    );
  }

  const fill = streak.todayDue ? streak.todayDone / streak.todayDue : 0;

  return (
    <Screen style={{ backgroundColor: th.surface, paddingHorizontal: 0, paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: spacing.xl, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image source={require('../../../assets/icon-small.png')} style={{ width: 28, height: 28 }} accessibilityLabel={t('app.name')} />
          <Text muted style={{ fontSize: 13, fontWeight: '700' }}>{status.connected ? t('today.syncConnected') : t('today.syncOffline')}</Text>
        </View>

        {pets.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('today.switchPet')}
            contentContainerStyle={{ gap: 8 }}>
            {pets.map((p) => {
              const on = p.id === pet.id;
              return (
                <Pressable key={p.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setPetId(p.id)}
                  style={{ minHeight: minTouch, paddingHorizontal: 16, borderRadius: minTouch / 2, justifyContent: 'center',
                           borderWidth: 2, borderColor: on ? th.text : th.border, backgroundColor: on ? th.bg : 'transparent' }}>
                  <Text style={{ fontWeight: '800', fontSize: 15 }}>{p.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={{ gap: 4 }}>
          <Text muted style={{ fontSize: 14, fontWeight: '800' }}>{dateLine}</Text>
          <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: '700', lineHeight: 36 }}>{t('today.title', { name: pet.name })}</Text>
        </View>

        <View style={{ backgroundColor: th.hero, borderRadius: radius.lg, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ color: th.onHero, fontSize: 18, fontWeight: '700', flexShrink: 1 }}>
              {streak.todayDue ? t('today.progress', { done: streak.todayDone, count: streak.todayDue }) : t('today.noStreakTasks')}
            </Text>
            <StreakChip count={streak.shown} label={t('today.streak', { count: streak.shown })} bump={streak.todayComplete} reduceMotion={reduceMotion} />
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: th.heroTrack, overflow: 'hidden' }}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={{ height: 12, width: `${Math.round(fill * 100)}%`, borderRadius: 6, backgroundColor: th.done }} />
          </View>
          {streak.todayDue ? (
            <Text style={{ color: th.onHeroMuted, fontSize: 14, fontWeight: '700' }}>
              {streak.todayComplete ? t('today.streakSafe') : t('today.streakLeft', { count: streak.todayDue - streak.todayDone })}
            </Text>
          ) : null}
        </View>

        {due.length === 0 ? <Text muted>{t('today.empty')}</Text> : null}

        {pending.length ? (
          <>
            <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700' }}>{t('today.todo')}</Text>
            <View style={{ gap: 10 }}>
              {pending.map((x) => (
                <TaskRow key={x.id} task={x} title={title(x)} subtitle={x.time_of_day ?? t('onboarding.anyTime')}
                  onToggle={() => toggle(x)} reduceMotion={reduceMotion} streakLabel={t('onboarding.countsForStreak')}
                  a11yLabel={t('today.markDone', { title: title(x) })} />
              ))}
            </View>
          </>
        ) : due.length ? (
          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: th.bg }}>
            <Text style={{ fontWeight: '800', textAlign: 'center' }}>{t('today.allDone')}</Text>
          </View>
        ) : null}

        {done.length ? (
          <>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDone }} onPress={() => setShowDone(!showDone)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: th.bg }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: th.done, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={16} color={th.onDone} />
              </View>
              <Text style={{ flex: 1, fontWeight: '800' }}>{t('today.done')} · {done.length}</Text>
              <Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={18} color={th.text} />
            </Pressable>
            {showDone ? (
              <View style={{ gap: 10 }}>
                {done.map((x) => (
                  <TaskRow key={x.id} task={x} title={title(x)} subtitle={t('today.doneBy', { name: doneBy(x) })}
                    onToggle={() => toggle(x)} reduceMotion={reduceMotion} streakLabel={t('onboarding.countsForStreak')}
                    a11yLabel={t('today.markNotDone', { title: title(x) })} />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        {members.length === 1 ? (
          <View style={{ backgroundColor: th.bg, borderRadius: radius.lg, padding: 18, gap: 10 }}>
            <Text style={{ fontWeight: '800', fontSize: 17 }}>{t('today.inviteTitle')}</Text>
            <Text muted>{t('today.inviteBody')}</Text>
            <Button secondary label={t('today.inviteCta')} onPress={() => router.push('/household')} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function StreakChip({ count, label, bump, reduceMotion }: { count: number; label: string; bump: boolean; reduceMotion: boolean }) {
  const th = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current && bump && !reduceMotion) {
      scale.setValue(1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 40, bounciness: 14 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      ]).start();
    }
    prev.current = count;
  }, [count, bump, reduceMotion, scale]);
  return (
    <Animated.View accessible accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: minTouch, paddingHorizontal: 12, borderRadius: 14,
               backgroundColor: th.highlight, transform: [{ scale }] }}>
      <Ionicons name="flame" size={16} color={th.onHighlight} />
      <Text style={{ color: th.onHighlight, fontWeight: '800', fontSize: 14 }}>{label}</Text>
    </Animated.View>
  );
}

function TaskRow({ task, title, subtitle, onToggle, reduceMotion, a11yLabel, streakLabel }: {
  task: TodayTask; title: string; subtitle: string; onToggle: () => void; reduceMotion: boolean; a11yLabel: string; streakLabel: string;
}) {
  const th = useTheme();
  const isDone = !!task.tick;
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    if (!isDone && !reduceMotion) {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 16 }).start();
    }
    onToggle();
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.lg,
                   backgroundColor: th.bg, borderWidth: 2, borderColor: isDone ? th.surface : th.border }}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: isDone }} accessibilityLabel={a11yLabel} onPress={press}
        hitSlop={6}>
        <Animated.View style={{ width: minTouch, height: minTouch, borderRadius: minTouch / 2, borderWidth: 2.5,
                                borderColor: isDone ? th.onDone : th.textMuted, backgroundColor: isDone ? th.done : th.bg,
                                alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
          {isDone ? <Ionicons name="checkmark" size={22} color={th.onDone} /> : <Ionicons name={kindIcon(task.kind)} size={18} color={th.textMuted} />}
        </Animated.View>
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDone ? th.textMuted : th.text, textDecorationLine: isDone ? 'line-through' : 'none', flexShrink: 1 }}>
            {title}
          </Text>
          {task.streak_critical ? <Ionicons name="flame" size={14} color={th.accent} accessibilityLabel={streakLabel} /> : null}
        </View>
        <Text muted style={{ fontSize: 13, fontWeight: '600' }}>{subtitle}</Text>
      </View>
    </View>
  );
}
