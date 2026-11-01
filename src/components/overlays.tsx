import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Chunky, Paper } from '@/components/chunky';
import { StarIcon } from '@/components/icons';
import { Pofi } from '@/components/pofi';
import { sayEnglish, sayTurkish } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/** Bölüm sonu kutlaması: nadir an, hareket bütçesi burada harcanır. */
export function Celebration({ stars, onDone, newCards = [] }: { stars: number; onDone: () => void; newCards?: string[] }) {
  const { companionLevel } = useProgress();
  useEffect(() => {
    sayEnglish(stars === 3 ? 'Amazing! Three stars!' : 'Well done!');
  }, [stars]);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.scrim}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: '100%', maxWidth: 420 }}>
        <Paper style={styles.card} round={32} depth={8}>
          <Pofi size={150} mood="cheer" level={companionLevel} />
          <View style={styles.stars}>
            {[1, 2, 3].map((i) => (
              <Animated.View key={i} entering={ZoomIn.delay(250 + i * 180).springify()}>
                <StarIcon size={i === 2 ? 64 : 52} color={i <= stars ? colors.sun : '#E7E1D2'} />
              </Animated.View>
            ))}
          </View>
          <Text style={[type.title, { color: colors.ink, textAlign: 'center' }]}>{stars === 3 ? 'Muhteşem!' : 'Harika iş!'}</Text>
          {newCards.length > 0 && (
            <Text style={[type.body, { color: colors.inkSoft, textAlign: 'center' }]}>
              Albümüne {newCards.length} yeni kart eklendi: {newCards.join(' ')}
            </Text>
          )}
          <Chunky tone="leaf" label="Devam" onPress={onDone} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </Paper>
      </Animated.View>
    </Animated.View>
  );
}

/** Günlük süre dolunca Pofi uyur; oyun nazikçe biter. */
export function SleepOverlay({ onParent }: { onParent: () => void }) {
  useEffect(() => {
    sayTurkish('Pofi çok yoruldu, uyku vakti. Yarın yeni maceralar bizi bekliyor!');
  }, []);
  return (
    <View style={[styles.scrim, { backgroundColor: '#0B2F4AEE' }]}>
      <Pofi size={200} mood="sleep" />
      <Text style={[type.title, { color: colors.white, textAlign: 'center' }]}>Pofi uyuyor</Text>
      <Text style={[type.body, { color: '#CFE8F2', textAlign: 'center', maxWidth: 360 }]}>
        Bugünlük oyun bitti. Haydi şimdi evde 3 hayvan oyuncağı bul ve İngilizce adlarını söyle!
      </Text>
      <Chunky tone="paper" label="Veli" onPress={onParent} style={{ marginTop: 24 }} />
    </View>
  );
}

/** Veli kapısı: çocuk panele, ayarlara ve ödemeye giremesin. */
export function ParentGate({ visible, onPass, onCancel }: { visible: boolean; onPass: () => void; onCancel: () => void }) {
  const q = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    return { a, b, answer: a * b };
  }, [visible]);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue('');
      setWrong(false);
    }
  }, [visible]);

  const check = () => {
    if (Number(value) === q.answer) onPass();
    else setWrong(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <Paper style={[styles.card, { gap: 12 }]} round={28}>
          <Text style={[type.title, { color: colors.ink }]}>Veli girişi</Text>
          <Text style={[type.body, { color: colors.inkSoft, textAlign: 'center' }]}>
            Devam etmek için işlemi çözün: {q.a} × {q.b} = ?
          </Text>
          <TextInput
            value={value}
            onChangeText={(t) => {
              setValue(t.replace(/[^0-9]/g, ''));
              setWrong(false);
            }}
            keyboardType="number-pad"
            maxLength={3}
            style={[type.title, styles.input]}
            onSubmitEditing={check}
            accessibilityLabel="Cevap"
            autoFocus
          />
          {wrong && <Text style={[type.small, { color: colors.berryDeep }]}>Cevap doğru değil, tekrar deneyin.</Text>}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Chunky tone="paper" label="Vazgeç" onPress={onCancel} />
            <Chunky tone="lagoon" label="Giriş yap" onPress={check} />
          </View>
        </Paper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(11,79,108,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
    gap: 8,
  },
  card: { padding: 24, alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 4 },
  input: {
    width: 140,
    textAlign: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 6,
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
