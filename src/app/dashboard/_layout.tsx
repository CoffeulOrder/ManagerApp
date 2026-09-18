import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/app-context';
import { Colors, Radius, SidebarWidth, Spacing } from '@/constants/theme';
import type { StoreStatus } from '@/types';

const NAV_ITEMS: {
  href: '/dashboard' | '/dashboard/menu' | '/dashboard/sales';
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
}[] = [
  { href: '/dashboard', label: '주문 관리', ios: 'list.bullet.clipboard.fill', android: 'receipt_long' },
  { href: '/dashboard/menu', label: '메뉴 관리', ios: 'cup.and.saucer.fill', android: 'local_cafe' },
  { href: '/dashboard/sales', label: '매출 조회', ios: 'chart.bar.fill', android: 'bar_chart' },
];

const STATUS_OPTIONS: { status: StoreStatus; label: string }[] = [
  { status: 'OPEN', label: '영업중' },
  { status: 'PAUSED', label: '일시정지' },
  { status: 'CLOSED', label: '마감' },
];

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { merchant, currentStore, logout, setStoreStatus } = useApp();

  if (!merchant) return <Redirect href="/login" />;
  if (!currentStore) return <Redirect href="/store-select" />;

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.sidebar}>
        <SafeAreaView edges={['left', 'top', 'bottom']} style={styles.sidebarInner}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <SymbolView
                name={{ ios: 'cup.and.saucer.fill', android: 'coffee', web: 'coffee' }}
                tintColor={Colors.accentText}
                size={18}
              />
            </View>
            <ThemedText type="subtitle" style={styles.brandText}>
              Coffeul
            </ThemedText>
          </View>

          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Pressable
                  key={item.href}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => router.replace(item.href)}>
                  <SymbolView
                    name={{ ios: item.ios, android: item.android, web: item.android }}
                    tintColor={active ? Colors.accentText : Colors.textSecondary}
                    size={18}
                  />
                  <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Pressable style={styles.changeStoreButton} onPress={() => router.replace('/store-select')}>
              <ThemedText type="small" color="textSecondary">
                지점 변경
              </ThemedText>
            </Pressable>
            <Pressable style={styles.changeStoreButton} onPress={handleLogout}>
              <ThemedText type="small" color="danger">
                로그아웃
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.contentArea}>
        <SafeAreaView edges={['top', 'right']} style={styles.topBar}>
          <View>
            <ThemedText type="subtitle">{currentStore.name}</ThemedText>
            <ThemedText type="small" color="textSecondary">
              {currentStore.school}
            </ThemedText>
          </View>

          <View style={styles.statusGroup}>
            {STATUS_OPTIONS.map((opt) => {
              const active = currentStore.status === opt.status;
              return (
                <Pressable
                  key={opt.status}
                  style={[styles.statusOption, active && styles.statusOptionActive]}
                  onPress={() => setStoreStatus(currentStore.id, opt.status)}>
                  <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <Slot />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SidebarWidth,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  sidebarInner: {
    flex: 1,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.five,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'ui-serif',
  },
  navList: {
    gap: Spacing.one,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  navItemActive: {
    backgroundColor: Colors.accent,
  },
  sidebarFooter: {
    gap: Spacing.one,
  },
  changeStoreButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  contentArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  statusOption: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  statusOptionActive: {
    backgroundColor: Colors.accent,
  },
  body: {
    flex: 1,
  },
});
