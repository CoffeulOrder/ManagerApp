import { useNetworkState } from 'expo-network';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { useOrderAlert } from '@/hooks/use-order-alert';

export function NewOrderBanner() {
  const { pendingCount, acknowledge } = useOrderAlert();
  if (pendingCount === 0) return null;

  return (
    <View style={[styles.banner, styles.newOrder]}>
      <SymbolView
        name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
        tintColor={Colors.white}
        size={20}
      />
      <ThemedText type="smallBold" color="white" style={styles.message}>
        새 주문 {pendingCount}건이 도착했습니다
      </ThemedText>
      <Pressable style={styles.acknowledge} onPress={acknowledge}>
        <ThemedText type="smallBold" color="accent">
          확인
        </ThemedText>
      </Pressable>
    </View>
  );
}

export function ConnectionBanner() {
  const { isConnected, isInternetReachable } = useNetworkState();
  const { showToast } = useToast();
  const wasOffline = useRef(false);
  // The values are undefined until the first reading, which must not flash a warning.
  const offline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    if (offline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      showToast('인터넷 연결이 복구되었습니다');
    }
  }, [offline, showToast]);

  if (!offline) return null;

  return (
    <View style={[styles.banner, styles.offline]}>
      <SymbolView
        name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }}
        tintColor={Colors.white}
        size={20}
      />
      <ThemedText type="smallBold" color="white" style={styles.message}>
        인터넷 연결이 끊겼습니다. 새 주문을 받을 수 없으니 와이파이를 확인해 주세요.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  newOrder: {
    backgroundColor: Colors.accent,
  },
  offline: {
    backgroundColor: Colors.danger,
  },
  message: {
    flex: 1,
  },
  acknowledge: {
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
