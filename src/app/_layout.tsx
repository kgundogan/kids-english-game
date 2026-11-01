import { Baloo2_500Medium, Baloo2_700Bold, Baloo2_800ExtraBold, useFonts } from '@expo-google-fonts/baloo-2';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ParentGate, SleepOverlay } from '@/components/overlays';
import { ProgressProvider, useProgress } from '@/state/progress';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const { asleep, ready } = useProgress();
  const pathname = usePathname();
  const [gate, setGate] = useState(false);
  const showSleep = asleep && !pathname.startsWith('/parent');

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.sky }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.sky } }} />
      {showSleep && <SleepOverlay onParent={() => setGate(true)} />}
      <ParentGate
        visible={gate}
        onCancel={() => setGate(false)}
        onPass={() => {
          setGate(false);
          router.push('/parent');
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Baloo2_500Medium, Baloo2_700Bold, Baloo2_800ExtraBold });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <StatusBar style="dark" />
          <Shell />
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
