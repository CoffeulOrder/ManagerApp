import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    const result = login(loginId.trim(), password);
    if (!result.ok) {
      setError(result.message ?? '로그인에 실패했습니다.');
      return;
    }
    router.replace('/dashboard');
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
                ORMO
              </ThemedText>
              <ThemedText type="small" color="textSecondary">
                매장 관리자 시스템
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextField
                label="아이디"
                placeholder="지점 계정 아이디"
                autoCapitalize="none"
                autoCorrect={false}
                value={loginId}
                onChangeText={setLoginId}
              />
              <TextField
                label="비밀번호"
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="done"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
              />

              {error && (
                <ThemedText type="small" color="danger">
                  {error}
                </ThemedText>
              )}

              <Button label="로그인" onPress={handleSubmit} style={styles.submit} />
            </View>

            <View style={styles.hints}>
              <ThemedText type="small" color="textSecondary" style={styles.hint}>
                계정은 지점당 1개이며 ORMO 운영팀에서 발급합니다.
              </ThemedText>
              <ThemedText type="small" color="textMuted" style={styles.hint}>
                데모 계정: beomseok / password
              </ThemedText>
            </View>
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
    fontWeight: '900',
    letterSpacing: 1,
  },
  form: {
    gap: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
  },
  hints: {
    gap: Spacing.one,
  },
  hint: {
    textAlign: 'center',
  },
});
