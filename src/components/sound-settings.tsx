import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ALERT_SOUND_IDS, ALERT_SOUNDS, type AlertSoundId } from '@/constants/alert-sounds';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useDeviceSettings } from '@/context/device-settings';
import { useAlertPlayer } from '@/hooks/use-alert-player';

export function SoundSettings() {
  const { soundEnabled, soundId, setSoundEnabled, setSoundId } = useDeviceSettings();
  const { simulateIncomingOrder } = useApp();

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">알림음</ThemedText>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <ThemedText type="default">새 주문 알림음</ThemedText>
          <ThemedText type="small" color="textSecondary">
            새 주문이 접수 대기에 들어오면 소리로 알려줍니다.
          </ThemedText>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: Colors.border, true: Colors.accent }}
          thumbColor={Colors.white}
        />
      </View>

      <ThemedText type="smallBold" color="textSecondary" style={styles.listTitle}>
        알림음 선택
      </ThemedText>
      <View style={[styles.list, !soundEnabled && styles.listOff]}>
        {ALERT_SOUND_IDS.map((id) => (
          <SoundRow key={id} id={id} selected={id === soundId} onSelect={() => setSoundId(id)} />
        ))}
      </View>

      <ThemedText type="small" color="textMuted">
        이 설정은 이 기기에만 저장되며, 소리 크기는 기기 볼륨을 따릅니다. 알림음은 앞으로 더 추가될 예정입니다.
      </ThemedText>

      {__DEV__ && (
        <View style={styles.devBox}>
          <ThemedText type="label" color="textMuted">
            개발용 (앱 배포 시 표시되지 않음)
          </ThemedText>
          <Button label="테스트 주문 받기" variant="secondary" size="small" onPress={simulateIncomingOrder} />
        </View>
      )}
    </View>
  );
}

function SoundRow({ id, selected, onSelect }: { id: AlertSoundId; selected: boolean; onSelect: () => void }) {
  const play = useAlertPlayer(id);

  return (
    <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={onSelect}>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
      <ThemedText type="default" style={styles.rowLabel}>
        {ALERT_SOUNDS[id].label}
      </ThemedText>
      <Button label="미리 듣기" variant="secondary" size="small" onPress={() => void play()} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 520,
    gap: Spacing.three,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleText: {
    flex: 1,
    gap: Spacing.half,
  },
  listTitle: {
    marginTop: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  listOff: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowSelected: {
    borderColor: Colors.accent,
  },
  rowLabel: {
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  devBox: {
    gap: Spacing.two,
    alignItems: 'flex-start',
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
