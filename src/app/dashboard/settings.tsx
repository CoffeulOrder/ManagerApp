import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { SoundSettings } from '@/components/sound-settings';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useApp, type ActionResult } from '@/context/app-context';
import { DISCARD_MINUTES_MAX, DISCARD_MINUTES_MIN } from '@/constants/order';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePinGate } from '@/hooks/use-pin-gate';
import { isValidPin, isValidTime } from '@/lib/validation';

type Section = 'sound' | 'password' | 'secondary' | 'hours' | 'discard';

interface SectionItem {
  key: Section;
  label: string;
  // Locked sections need the 2차 비밀번호; the sound option does not (any staff may change it).
  locked: boolean;
}

const GROUPS: { title: string; items: SectionItem[] }[] = [
  { title: '이 기기', items: [{ key: 'sound', label: '알림음', locked: false }] },
  {
    title: '계정 · 매장',
    items: [
      { key: 'password', label: '비밀번호 변경', locked: true },
      { key: 'secondary', label: '2차 비밀번호 변경', locked: true },
      { key: 'hours', label: '영업시간 수정', locked: true },
      { key: 'discard', label: '자체 폐기 시간', locked: true },
    ],
  },
];

export default function SettingsScreen() {
  const { requirePin, pinModal } = usePinGate();
  const [unlocked, setUnlocked] = useState(false);
  const [section, setSection] = useState<Section>('sound');

  function select(item: SectionItem) {
    if (item.locked && !unlocked) {
      requirePin(() => {
        setUnlocked(true);
        setSection(item.key);
      }, item.label);
      return;
    }
    setSection(item.key);
  }

  return (
    <View style={[styles.screen, styles.layout]}>
      <View style={styles.menu}>
        {GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <ThemedText type="label" color="textMuted" style={styles.groupTitle}>
              {group.title}
            </ThemedText>
            {group.items.map((item) => {
              const active = item.key === section;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => select(item)}>
                  <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'} style={styles.menuLabel}>
                    {item.label}
                  </ThemedText>
                  {item.locked && !unlocked && (
                    <SymbolView
                      name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                      tintColor={Colors.textMuted}
                      size={14}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
        {section === 'sound' && <SoundSettings />}
        {section === 'password' && <PasswordForm />}
        {section === 'secondary' && <SecondaryPasswordForm />}
        {section === 'hours' && <HoursForm />}
        {section === 'discard' && <DiscardForm />}
      </ScrollView>

      {pinModal}
    </View>
  );
}

function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <ThemedText type="small" color={result.ok ? 'success' : 'danger'}>
      {result.message}
    </ThemedText>
  );
}

function PasswordForm() {
  const { changePassword } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSave() {
    if (!current || !next || !confirm) {
      setResult({ ok: false, message: '모든 항목을 입력해 주세요.' });
      return;
    }
    if (next !== confirm) {
      setResult({ ok: false, message: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    const response = changePassword(current, next);
    setResult(response.ok ? { ok: true, message: '비밀번호가 변경되었습니다.' } : response);
    if (response.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle">비밀번호 변경</ThemedText>
      <TextField label="현재 비밀번호" secureTextEntry value={current} onChangeText={setCurrent} />
      <TextField label="새 비밀번호 (6자 이상)" secureTextEntry value={next} onChangeText={setNext} />
      <TextField label="새 비밀번호 확인" secureTextEntry value={confirm} onChangeText={setConfirm} />
      <FormMessage result={result} />
      <Button label="변경하기" onPress={handleSave} />
    </View>
  );
}

function SecondaryPasswordForm() {
  const { changeSecondaryPassword } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);

  const digitsOnly = (value: string) => value.replace(/\D/g, '');

  function handleSave() {
    if (!isValidPin(current) || !isValidPin(next) || !isValidPin(confirm)) {
      setResult({ ok: false, message: '2차 비밀번호는 숫자 4자리로 입력해 주세요.' });
      return;
    }
    if (next !== confirm) {
      setResult({ ok: false, message: '새 2차 비밀번호가 일치하지 않습니다.' });
      return;
    }
    const response = changeSecondaryPassword(current, next);
    setResult(response.ok ? { ok: true, message: '2차 비밀번호가 변경되었습니다.' } : response);
    if (response.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle">2차 비밀번호 변경</ThemedText>
      <TextField
        label="현재 2차 비밀번호"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={current}
        onChangeText={(value) => setCurrent(digitsOnly(value))}
      />
      <TextField
        label="새 2차 비밀번호 (숫자 4자리)"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={next}
        onChangeText={(value) => setNext(digitsOnly(value))}
      />
      <TextField
        label="새 2차 비밀번호 확인"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        value={confirm}
        onChangeText={(value) => setConfirm(digitsOnly(value))}
      />
      <FormMessage result={result} />
      <Button label="변경하기" onPress={handleSave} />
    </View>
  );
}

function HoursForm() {
  const { currentStore, updateStoreHours } = useApp();
  const [openTime, setOpenTime] = useState(currentStore?.openTime ?? '');
  const [closeTime, setCloseTime] = useState(currentStore?.closeTime ?? '');
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSave() {
    if (!isValidTime(openTime) || !isValidTime(closeTime)) {
      setResult({ ok: false, message: '시간은 24시간 형식(HH:MM)으로 입력해 주세요. 예) 09:00' });
      return;
    }
    if (openTime >= closeTime) {
      setResult({ ok: false, message: '마감 시간은 오픈 시간보다 늦어야 합니다.' });
      return;
    }
    updateStoreHours(openTime, closeTime);
    setResult({ ok: true, message: '영업시간이 수정되었습니다.' });
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle">영업시간 수정</ThemedText>
      <ThemedText type="small" color="textSecondary">
        {currentStore?.name} 영업시간 (24시간 형식)
      </ThemedText>
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <TextField
            label="오픈 시간"
            placeholder="09:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            value={openTime}
            onChangeText={setOpenTime}
          />
        </View>
        <ThemedText type="default" color="textSecondary" style={styles.timeSeparator}>
          ~
        </ThemedText>
        <View style={styles.timeField}>
          <TextField
            label="마감 시간"
            placeholder="18:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            value={closeTime}
            onChangeText={setCloseTime}
          />
        </View>
      </View>
      <FormMessage result={result} />
      <Button label="저장" onPress={handleSave} />
    </View>
  );
}

function DiscardForm() {
  const { currentStore, updateDiscardMinutes } = useApp();
  const closed = currentStore?.status === 'CLOSED';
  const [minutes, setMinutes] = useState(String(currentStore?.discardAfterMinutes ?? ''));
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSave() {
    const response = updateDiscardMinutes(Number(minutes));
    setResult(response.ok ? { ok: true, message: '자체 폐기 시간이 저장되었습니다.' } : response);
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle">자체 폐기 시간</ThemedText>
      <ThemedText type="small" color="textSecondary">
        조리 완료 후 이 시간이 지나도 찾아가지 않은 음료는 '자체 폐기'로 처리할 수 있습니다. 저장한 시간은 학생 앱에
        "조리 완료 후 N분 안에 픽업해 주세요"로 안내됩니다.
      </ThemedText>

      {!closed && (
        <View style={styles.notice}>
          <ThemedText type="small" color="warning">
            영업 종료(마감) 상태에서만 수정할 수 있습니다. 상단에서 '마감'으로 바꾼 뒤 수정해 주세요.
          </ThemedText>
        </View>
      )}

      <TextField
        label="조리 완료 후 (분)"
        keyboardType="number-pad"
        maxLength={3}
        editable={closed}
        value={minutes}
        onChangeText={(value) => setMinutes(value.replace(/\D/g, ''))}
        style={!closed && styles.disabledInput}
      />
      <ThemedText type="small" color="textMuted">
        {DISCARD_MINUTES_MIN}분 ~ {DISCARD_MINUTES_MAX}분 사이로 설정할 수 있습니다.
      </ThemedText>
      <FormMessage result={result} />
      <Button label="저장" disabled={!closed} onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  layout: {
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  menu: {
    width: 240,
    gap: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
  groupTitle: {
    paddingHorizontal: Spacing.one,
  },
  menuLabel: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItemActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  detail: {
    flex: 1,
  },
  detailContent: {
    alignItems: 'flex-start',
  },
  form: {
    width: '100%',
    maxWidth: 440,
    gap: Spacing.three,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundSelected,
  },
  disabledInput: {
    opacity: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  timeField: {
    flex: 1,
  },
  timeSeparator: {
    paddingBottom: Spacing.three,
  },
});
