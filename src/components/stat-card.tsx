import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  compact?: boolean;
  emphasis?: boolean;
  caption?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ label, value, compact, emphasis, caption, style }: StatCardProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <ThemedText type="small" color="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={compact ? 'subtitle' : 'title'} color={emphasis ? 'accent' : 'text'} style={styles.value}>
        {value}
      </ThemedText>
      {caption && (
        <ThemedText type="small" color="textMuted">
          {caption}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    padding: Spacing.three,
  },
  value: {
    marginTop: Spacing.one,
  },
});
