import { Baloo2_500Medium, Baloo2_700Bold, Baloo2_800ExtraBold, useFonts } from '@expo-google-fonts/baloo-2';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ParentGate, SleepOverlay } from '@/components/overlays';
import { voiceProblem } from '@/lib/voice';
import { ProgressProvider, useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Ses çalınamıyorsa sessizce bozuk görünmesin: kullanıcıya ne yapacağını söyle. */
function VoiceNotice() {
  const [problem, setProblem] = useState<null | 'none' | 'failing'>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setProblem(voiceProblem()), 2500);
    return () => clearInterval(id);
  }, []);
  if (!problem || hidden) return null;
  // Dokununca kapanır: oyunun üstünü kapatıp dokunmayı engellemesin
  return (
    <Pressable
      onPress={() => setHidden(true)}
      style={{ position: 'absolute', left: 12, right: 12, bottom: 16, backgroundColor: colors.ink, borderRadius: 16, padding: 12, zIndex: 40 }}
      accessibilityRole="alert"
      accessibilityHint="Kapatmak için dokunun"
    >
      <Text style={[type.small, { color: colors.white }]}>
        {problem === 'none'
          ? 'Bu tarayıcı sesli okumayı desteklemiyor. Oyunu Chrome, Safari ya da Edge’de açın.'
          : 'Ses çalınamadı. Cihazın sesinin açık olduğundan emin olun; olmazsa sayfayı Chrome, Safari ya da Edge’de açın.'}
        {'  '}
        <Text style={{ textDecorationLine: 'underline' }}>Kapat</Text>
      </Text>
    </Pressable>
  );
}

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
      <VoiceNotice />
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
