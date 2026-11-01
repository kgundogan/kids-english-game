# Pofi Adası

5–9 yaş çocuklar için oyunlaştırılmış İngilizce öğrenme uygulaması (çalışma adı). Çocuk bir ada dünyasında dost yaratığı **Pofi** ile dolaşır; her bölgenin sakinleri sadece İngilizce konuşur. Ders yok, macera var.

Yol haritası: Claude Docs'taki "Çocuklar İçin Oyunlaştırılmış Dil Uygulaması — Yol Haritası" belgesi.

## Şu an oynanabilir olanlar (Faz 0 prototip)

- **Ada haritası** — 4 bölge; *Hayvan Koyu* açık, diğerleri "yakında".
- **Hayvan Koyu**, 10 kelime (Cambridge Pre-A1) + "I like ___" kalıbı, 5 adımlık yol:
  1. **Tanış** — resim + ses + hareket (TPR). Çeviri yok. Kartlar albüme eklenir.
  2. **Dinle-bul** — Pofi söyler, çocuk doğru resme dokunur.
  3. **Eşleştir** — resim kartı ↔ ses kartı.
  4. **Konuş-büyü** — bas-konuş ses tanıma; doğruysa büyü çalışır, 3 denemeden sonra nazik düzeltme.
  5. **Kayıp yavrular** (bölüm sonu) — dinleme + konuşma + "I like cats" kalıbıyla konuşma.
- **Görünmez aralıklı tekrar** — zorlanılan ve uzun süredir görülmeyen kelimeler öne çıkar.
- **Kelime albümü** — toplanan her kelime bir koleksiyon kartı.
- **Pofi büyür** — yıldızlarla başındaki filiz gelişir.
- **Günlük süre sınırı** — varsayılan 15 dk; süre dolunca Pofi uyur, oyun nazikçe biter.
- **Ekran dışı görev** — her bölgede "tableti bırak, hareket et, kelimeyi söyle".
- **Veli alanı** (veli kapısı arkasında) — haftalık sade Türkçe özet, kelime haritası, süre ayarı.

Bilerek yapılmayanlar: seri cezası, şans kutusu, reklam, sosyal alan, sonsuz kaydırma.

## Çalıştırma

```bash
npm install
npx expo start          # telefonda Expo Go ile tara, ya da "w" ile web
npm run build:web       # statik web çıktısı → dist/
npm run typecheck
```

**Ses tanıma notu:** `expo-speech-recognition` yerel modül içerir; Expo Go'da çalışmaz. Expo Go'da Konuş-büyü otomatik olarak "Pofi'yi taklit et" moduna geçer. Tam deneyim için geliştirme derlemesi: `npx eas-cli@latest build --profile development` (bkz. `.claude/skills/expo-dev-client`). Web'de (Chrome/Edge/Safari) tarayıcının ses tanıması kullanılır.

## Teknoloji

| Katman | Seçim |
| --- | --- |
| Uygulama | Expo SDK 58, React Native 0.88, TypeScript |
| Navigasyon | Expo Router (`src/app`) |
| Animasyon | Reanimated 4 (UI iş parçacığı), react-native-svg |
| Ses | expo-speech (seslendirme), expo-speech-recognition (bas-konuş) |
| Veri | AsyncStorage (cihaz içi); sunucu Faz 1'de |

## Klasörler

```
src/
  app/            # sadece rotalar: ada, bölge, oyun, albüm, veli
  components/     # Pofi, karton düğme, ada haritası, kartlar, katmanlar
  screens/games/  # Tanış, Dinle-bul, Eşleştir, Konuş-büyü, görev
  content/        # bölgeler ve kelimeler
  state/          # ilerleme, aralıklı tekrar, süre sınırı
  lib/            # ses (TTS) ve dinleme (STT)
  theme.ts        # renkler, yazı, "karton diorama" kalınlığı
.claude/skills/   # Expo ve Callstack resmi agent skill'leri (MIT)
```

## Sıradaki adımlar

1. Marka adı ve karakter tasarımı → emoji görselleri özel illüstrasyonlarla değiştir (`content/regions.ts` → `picture`).
2. AI sohbet karakteri (senaryo kilitli, seviyeye kilitli dil, içerik filtresi).
3. Sunucu + veli hesabı (KVKK açık rıza) + web veli paneli.
4. Meyve Pazarı ve Gökkuşağı Tepesi bölgeleri.
5. Pilot okul için Android APK / iOS TestFlight (`.claude/skills/eas-app-stores`).
