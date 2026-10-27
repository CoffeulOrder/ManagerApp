import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/context/app-context';
import { DeviceSettingsProvider } from '@/context/device-settings';
import { ToastProvider } from '@/context/toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    // The store tablet may have its silent switch on; the order chime must still be heard.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  return (
    <DeviceSettingsProvider>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="dashboard" />
          </Stack>
        </ToastProvider>
      </AppProvider>
    </DeviceSettingsProvider>
  );
}
