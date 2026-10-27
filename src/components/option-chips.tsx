import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { OrderLineOption } from '@/types';

export function OptionChips({ options, size = 'default' }: { options: OrderLineOption[]; size?: 'default' | 'large' }) {
  if (options.length === 0) return null;
  const large = size === 'large';

  return (
    <View style={[styles.row, large && styles.rowLarge]}>
      {options.map((option) => {
        const hot = option.group === 'TEMPERATURE' && option.name === 'HOT';
        const ice = option.group === 'TEMPERATURE' && option.name === 'ICE';
        return (
          <View key={`${option.group}-${option.name}`} style={[styles.chip, large && styles.chipLarge, hot && styles.hot]}>
            <ThemedText
              type="label"
              color={hot ? 'danger' : ice ? 'accent' : 'textSecondary'}
              style={large && styles.labelLarge}>
              {option.name}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  rowLarge: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Radius.pill,
    paddingVertical: 1,
    paddingHorizontal: Spacing.two,
  },
  chipLarge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.three,
  },
  labelLarge: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  hot: {
    backgroundColor: Colors.dangerBg,
  },
});
