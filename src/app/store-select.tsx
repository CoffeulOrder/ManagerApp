import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function StoreSelectScreen() {
  const router = useRouter();
  const { stores, merchant, logout, selectStore } = useApp();

  function handleSelect(storeId: string) {
    selectStore(storeId);
    router.replace('/dashboard');
  }

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">지점 선택</ThemedText>
            <ThemedText type="small" color="textSecondary" style={styles.subtitle}>
              {merchant?.businessName} · 관리하실 지점을 선택해 주세요
            </ThemedText>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText type="smallBold" color="textSecondary">
              로그아웃
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {stores.map((store) => (
            <Pressable key={store.id} style={styles.card} onPress={() => handleSelect(store.id)}>
              <View style={styles.iconCircle}>
                <SymbolView
                  name={{ ios: 'building.2.fill', android: 'storefront', web: 'storefront' }}
                  tintColor={Colors.accentText}
                  size={24}
                />
              </View>
              <ThemedText type="subtitle">{store.name}</ThemedText>
              <ThemedText type="small" color="textSecondary">
                {store.school}
              </ThemedText>
              <View
                style={[
                  styles.statusPill,
                  store.status !== 'OPEN' && styles.statusPillMuted,
                ]}>
                <ThemedText type="label" color={store.status === 'OPEN' ? 'success' : 'textMuted'}>
                  {store.status === 'OPEN' ? '영업중' : store.status === 'PAUSED' ? '일시정지' : '마감'}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.five,
  },
  subtitle: {
    marginTop: Spacing.one,
  },
  logoutButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  card: {
    width: 220,
    padding: Spacing.four,
    borderRadius: Radius.large,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  statusPill: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.successBg,
  },
  statusPillMuted: {
    backgroundColor: Colors.backgroundSelected,
  },
});
