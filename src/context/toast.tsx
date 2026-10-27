import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

const DEFAULT_VISIBLE_MS = 2200;
const FADE_MS = 220;
const MAX_STACK = 3;

interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-(MAX_STACK - 1)), { id, message, ...options }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View style={styles.host}>
          {toasts.map((toast) => (
            <ToastView key={toast.id} toast={toast} onDone={dismiss} />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastItem; onDone: (id: number) => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { id, message, actionLabel, onAction, durationMs = DEFAULT_VISIBLE_MS } = toast;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const enter = Animated.timing(progress, { toValue: 1, duration: FADE_MS, useNativeDriver });
    const leave = Animated.timing(progress, { toValue: 0, duration: FADE_MS, useNativeDriver });
    enter.start();
    // Removal runs on timers so it never depends on the animation finishing.
    const leaveTimer = setTimeout(() => leave.start(), durationMs);
    const doneTimer = setTimeout(() => onDone(id), durationMs + FADE_MS + 30);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
      enter.stop();
      leave.stop();
    };
  }, [progress, id, durationMs, onDone]);

  return (
    <Animated.View
      style={[
        styles.toast,
        // Only toasts with a button take touches; the others never block what is underneath.
        { pointerEvents: actionLabel ? 'auto' : 'none' },
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}>
      <SymbolView
        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
        tintColor={Colors.accent}
        size={20}
      />
      <ThemedText type="default" color="white">
        {message}
      </ThemedText>
      {actionLabel && (
        <Pressable
          style={styles.action}
          hitSlop={8}
          onPress={() => {
            onAction?.();
            onDone(id);
          }}>
          <ThemedText type="smallBold" color="accent">
            {actionLabel}
          </ThemedText>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    backgroundColor: Colors.text,
  },
  action: {
    marginLeft: Spacing.two,
    paddingLeft: Spacing.three,
    borderLeftWidth: 1,
    borderLeftColor: Colors.textSecondary,
  },
});
