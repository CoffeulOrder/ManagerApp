import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  WEEKDAY_LABELS,
  addMonths,
  daysInMonth,
  formatMonth,
  startOfMonth,
  toDateKey,
  todayKey,
} from '@/lib/date';

interface CalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: string | null;
  onSelect: (dateKey: string) => void;
  maxDate?: string;
  renderCaption?: (dateKey: string) => string | undefined;
  cellHeight?: number;
}

const ROOMY_CELL_HEIGHT = 72;

export function Calendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  maxDate,
  renderCaption,
  cellHeight = 58,
}: CalendarProps) {
  const roomy = cellHeight >= ROOMY_CELL_HEIGHT;
  const first = startOfMonth(month);
  const total = daysInMonth(first);
  const today = todayKey();

  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: total }, (_, index) => toDateKey(new Date(first.getFullYear(), first.getMonth(), index + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const nextDisabled = maxDate !== undefined && toDateKey(addMonths(first, 1)) > maxDate;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={() => onMonthChange(addMonths(first, -1))} hitSlop={8}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={Colors.text}
            size={18}
          />
        </Pressable>
        <ThemedText type="subtitle">{formatMonth(first)}</ThemedText>
        <Pressable
          style={[styles.navButton, nextDisabled && styles.navButtonDisabled]}
          disabled={nextDisabled}
          onPress={() => onMonthChange(addMonths(first, 1))}
          hitSlop={8}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={Colors.text}
            size={18}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={label} style={styles.weekCell}>
            <ThemedText type="label" color={index === 0 ? 'danger' : 'textMuted'}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, cellIndex) => {
            if (key === null) return <View key={cellIndex} style={[styles.cell, { height: cellHeight }]} />;
            const disabled = maxDate !== undefined && key > maxDate;
            const isSelected = key === selected;
            const caption = renderCaption?.(key);
            return (
              <Pressable
                key={key}
                disabled={disabled}
                style={[
                  styles.cell,
                  styles.dayCell,
                  { height: cellHeight },
                  key === today && styles.todayCell,
                  isSelected && styles.selectedCell,
                  disabled && styles.disabledCell,
                ]}
                onPress={() => onSelect(key)}>
                <ThemedText
                  type={roomy ? 'subtitle' : 'smallBold'}
                  color={isSelected ? 'accentText' : cellIndex === 0 ? 'danger' : 'text'}>
                  {Number(key.slice(8))}
                </ThemedText>
                {caption !== undefined && (
                  <ThemedText
                    type="label"
                    color={isSelected ? 'accentText' : 'accent'}
                    style={roomy ? styles.captionRoomy : styles.caption}>
                    {caption}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  cell: {
    flex: 1,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.backgroundElement,
  },
  todayCell: {
    borderColor: Colors.accent,
  },
  selectedCell: {
    backgroundColor: Colors.accent,
  },
  disabledCell: {
    opacity: 0.3,
  },
  caption: {
    fontSize: 10,
    lineHeight: 12,
  },
  captionRoomy: {
    fontSize: 13,
    lineHeight: 16,
  },
});
