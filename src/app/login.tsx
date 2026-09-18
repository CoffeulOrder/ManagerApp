import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [representative, setRepresentative] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleSubmit() {
    setError(null);
    if (mode === 'login') {
      const result = login(email.trim(), password);
      if (!result.ok) return setError(result.message ?? '로그인에 실패했습니다.');
      router.replace('/store-select');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    const result = signup({
      businessName: businessName.trim(),
      representative: representative.trim(),
      email: email.trim(),
      password,
    });
    if (!result.ok) return setError(result.message ?? '회원가입에 실패했습니다.');
    router.replace('/store-select');
  }

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SafeAreaView style={styles.card}>
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <SymbolView
                  name={{ ios: 'cup.and.saucer.fill', android: 'coffee', web: 'coffee' }}
                  tintColor={Colors.accentText}
                  size={28}
                />
              </View>
              <ThemedText type="title" style={styles.brand}>
                Coffeul
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                매장 관리자 시스템
              </ThemedText>
            </View>

            <View style={styles.tabRow}>
              <Pressable
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => {
                  setMode('login');
                  setError(null);
                }}>
                <ThemedText type="smallBold" color={mode === 'login' ? 'accentText' : 'textSecondary'}>
                  로그인
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => {
                  setMode('signup');
                  setError(null);
                }}>
                <ThemedText type="smallBold" color={mode === 'signup' ? 'accentText' : 'textSecondary'}>
                  회원가입
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.form}>
              {mode === 'signup' && (
                <>
                  <TextField
                    label="상호명"
                    placeholder="커풀 을지대점"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                  <TextField
                    label="대표자명"
                    placeholder="홍길동"
                    value={representative}
                    onChangeText={setRepresentative}
                  />
                </>
              )}
              <TextField
                label="이메일"
                placeholder="brew@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                label="비밀번호"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {mode === 'signup' && (
                <TextField
                  label="비밀번호 확인"
                  placeholder="••••••••"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              )}

              {error && (
                <ThemedText type="small" color="danger">
                  {error}
                </ThemedText>
              )}

              <Button label={mode === 'login' ? '로그인' : '회원가입'} onPress={handleSubmit} style={styles.submit} />

              {mode === 'login' ? (
                <ThemedText type="small" color="textSecondary" style={styles.footer}>
                  계정이 없으신가요?{' '}
                  <ThemedText type="smallBold" color="accent" onPress={() => setMode('signup')}>
                    회원가입
                  </ThemedText>
                </ThemedText>
              ) : (
                <ThemedText type="small" color="textSecondary" style={styles.footer}>
                  이미 계정이 있으신가요?{' '}
                  <ThemedText type="smallBold" color="accent" onPress={() => setMode('login')}>
                    로그인
                  </ThemedText>
                </ThemedText>
              )}
            </View>

            <ThemedText type="small" color="textMuted" style={styles.demoHint}>
              데모 계정: brew@example.com / password
            </ThemedText>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  logoWrap: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  brand: {
    fontFamily: 'ui-serif',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.medium,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderRadius: Radius.medium - 2,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  form: {
    gap: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
  },
  footer: {
    textAlign: 'center',
  },
  demoHint: {
    textAlign: 'center',
  },
});
