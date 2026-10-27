import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { ConnectionBanner, NewOrderBanner } from '@/components/banners';
import { OrderTimeoutWatcher } from '@/components/order-timeout-watcher';
import { StoreSchedule } from '@/components/store-schedule';
import { StoreStatusControl } from '@/components/store-status-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/app-context';
import { useStayAwake } from '@/hooks/use-stay-awake';
import { Colors, Radius, SidebarWidth, Spacing } from '@/constants/theme';

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

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { account, currentStore, logout } = useApp();
  // The tablet must never sleep while orders can arrive.
  useStayAwake();

  if (!account || !currentStore) return <Redirect href="/login" />;

  const settingsActive = pathname === '/dashboard/settings';

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.screen}>
      <OrderTimeoutWatcher />
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
              ORMO
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
            <Pressable
              style={[styles.navItem, settingsActive && styles.navItemActive]}
              onPress={() => router.replace('/dashboard/settings')}>
              <SymbolView
                name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                tintColor={settingsActive ? Colors.accentText : Colors.textSecondary}
                size={18}
              />
              <ThemedText type="smallBold" color={settingsActive ? 'accentText' : 'textSecondary'}>
                설정
              </ThemedText>
            </Pressable>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <ThemedText type="small" color="danger">
                로그아웃
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.contentArea}>
        <ConnectionBanner />
        <SafeAreaView edges={['top', 'right']} style={styles.topBar}>
          <View>
            <ThemedText type="subtitle">{currentStore.name}</ThemedText>
            <ThemedText type="small" color="textSecondary">
              {currentStore.school} · 영업시간 {currentStore.openTime} ~ {currentStore.closeTime}
            </ThemedText>
          </View>

          <StoreStatusControl />
        </SafeAreaView>

        <NewOrderBanner />
        <StoreSchedule />

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
    fontWeight: '900',
    letterSpacing: 1,
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
  logoutButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
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
  body: {
    flex: 1,
  },
});
