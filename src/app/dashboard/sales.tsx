import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PinModal } from '@/components/pin-modal';
import { DailyView } from '@/components/sales/daily-view';
import { MonthlyView } from '@/components/sales/monthly-view';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { startOfMonth, todayKey } from '@/lib/date';
import { groupByDay } from '@/lib/sales';

type Mode = 'daily' | 'monthly';

const MODES: { key: Mode; label: string }[] = [
  { key: 'daily', label: '일별' },
  { key: 'monthly', label: '월별' },
];

export default function SalesScreen() {
  const router = useRouter();
  const { orders, currentStore } = useApp();

  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState<Mode>('daily');
  const [dateKey, setDateKey] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [calendarSelected, setCalendarSelected] = useState<string | null>(null);

  const ordersByDay = useMemo(
    () => groupByDay(orders.filter((order) => order.storeId === currentStore?.id)),
    [orders, currentStore]
  );

  if (!unlocked) {
    return (
      <View style={styles.screen}>
        <PinModal
          visible
          title="매출 조회"
          onCancel={() => router.replace('/dashboard')}
          onSuccess={() => setUnlocked(true)}
        />
      </View>
    );
  }

  function openDay(key: string) {
    setDateKey(key);
    setCalendarSelected(null);
    setMode('daily');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.modeRow}>
        {MODES.map((item) => {
          const active = item.key === mode;
          return (
            <Pressable
              key={item.key}
              style={[styles.modePill, active && styles.modePillActive]}
              onPress={() => setMode(item.key)}>
              <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {mode === 'daily' ? (
        <DailyView ordersByDay={ordersByDay} dateKey={dateKey} onChangeDate={setDateKey} />
      ) : (
        <MonthlyView
          ordersByDay={ordersByDay}
          month={calendarMonth}
          onMonthChange={(month) => {
            setCalendarMonth(month);
            setCalendarSelected(null);
          }}
          selected={calendarSelected}
          onSelect={setCalendarSelected}
          onOpenDay={openDay}
          commissionRate={currentStore?.commissionRate ?? 0}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modeRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  modePill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
  },
  modePillActive: {
    backgroundColor: Colors.accent,
  },
});
