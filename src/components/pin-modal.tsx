import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

const PIN_LENGTH = 4;
const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['cancel', '0', 'back'],
] as const;

interface PinModalProps {
  visible: boolean;
  title?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PinModal({ visible, title = '2차 비밀번호', onSuccess, onCancel }: PinModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <PinPad title={title} onSuccess={onSuccess} onCancel={onCancel} />
      </View>
    </Modal>
  );
}

function PinPad({ title, onSuccess, onCancel }: Omit<PinModalProps, 'visible'>) {
  const { verifySecondaryPassword } = useApp();
  const [digits, setDigits] = useState('');
  const [failed, setFailed] = useState(false);

  function press(digit: string) {
    if (digits.length >= PIN_LENGTH) return;
    const next = digits + digit;
    setDigits(next);
    setFailed(false);
    if (next.length < PIN_LENGTH) return;

    if (verifySecondaryPassword(next)) {
      onSuccess();
    } else {
      setFailed(true);
      setTimeout(() => setDigits(''), 250);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.lockIcon}>
        <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor={Colors.accentText} size={20} />
      </View>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="small" color="textSecondary">
        2차 비밀번호 숫자 4자리를 입력해 주세요
      </ThemedText>

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[styles.dot, index < digits.length && styles.dotFilled, failed && styles.dotFailed]}
          />
        ))}
      </View>
      <ThemedText type="small" color="danger" style={styles.error}>
        {failed ? '2차 비밀번호가 올바르지 않습니다' : ' '}
      </ThemedText>

      <View style={styles.keypad}>
        {KEY_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((key) => {
              if (key === 'cancel') {
                return (
                  <Pressable key={key} style={styles.keyPlain} onPress={onCancel}>
                    <ThemedText type="smallBold" color="textSecondary">
                      취소
                    </ThemedText>
                  </Pressable>
                );
              }
              if (key === 'back') {
                return (
                  <Pressable key={key} style={styles.keyPlain} onPress={() => setDigits(digits.slice(0, -1))}>
                    <SymbolView
                      name={{ ios: 'delete.left', android: 'backspace', web: 'backspace' }}
                      tintColor={Colors.textSecondary}
                      size={22}
                    />
                  </Pressable>
                );
              }
              return (
                <Pressable key={key} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} onPress={() => press(key)}>
                  <ThemedText type="title">{key}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 340,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
  },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  dotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dotFailed: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger,
  },
  error: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  keypad: {
    gap: Spacing.two,
  },
  keyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  key: {
    width: 76,
    height: 60,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: Colors.backgroundSelected,
  },
  keyPlain: {
    width: 76,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
