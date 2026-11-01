# Pofi Adası

5–9 yaş çocuklar için oyunlaştırılmış İngilizce öğrenme uygulaması (çalışma adı). Çocuk bir ada dünyasında dost yaratığı **Pofi** ile dolaşır; her bölgenin sakinleri sadece İngilizce konuşur. Ders yok, macera var.

Yol haritası: Claude Docs'taki "Çocuklar İçin Oyunlaştırılmış Dil Uygulaması — Yol Haritası" belgesi.

## Şu an oynanabilir olanlar (Faz 0 prototip)

- **Ada haritası** — 4 bölge; *Hayvan Koyu* açık, diğerleri "yakında".
- **Hayvan Koyu**, 10 kelime (Cambridge Pre-A1), 7 adımlık yol:
  1. **Sesli kitap** — dokun-dinle kitabının oyunu: iki sayfa sahne, dokunulan her hayvan adını söyler ("Cow. Cow! Moo! Hello, cow!") ve albüme girer.
  2. **Dinle-bul** — Pofi söyler, çocuk doğru resme dokunur; son turlarda hayvan farklı bir görselle gelir.
  3. **Evet mi, hayır mı?** — resim + "Cow?" sorusu, ✅ / ❌.
  4. **Eşleştir** — resim kartı ↔ ses kartı.
  5. **Saklambaç** — "Where is the cow?" kalıbı, sahnede arayıp bulma.
  6. **Konuş-büyü** — ilk kez taklit, sonra kendi hatırlayarak söyleme; 3 denemeden sonra nazik düzeltme.
  7. **Kayıp yavrular** (bölüm sonu) — her kelimeyi farklı yoldan sınar; 7+ yaşta okuma turu; "I like cats!" kalıbı.

- **Görünmez aralıklı tekrar** — zorlanılan ve uzun süredir görülmeyen kelimeler öne çıkar.
- **Kelime albümü** — toplanan her kelime bir koleksiyon kartı.
- **Pofi büyür** — yıldızlarla başındaki filiz gelişir.
- **Günlük süre sınırı** — varsayılan 15 dk; süre dolunca Pofi uyur, oyun nazikçe biter.
- **Ekran dışı görev** — her bölgede "tableti bırak, hareket et, kelimeyi söyle".
- **Veli alanı** (veli kapısı arkasında) — haftalık sade Türkçe özet, kelime haritası, süre ayarı.

Bilerek yapılmayanlar: seri cezası, şans kutusu, reklam, sosyal alan, sonsuz kaydırma.

## Sıfır seviye yaklaşımı

- İngilizce önce **tek kelime** olarak gelir, cümle değil. "This is a…" gibi çocuğun bilmediği kelimeler yok.
- Yönerge Türkçe, hedef dil İngilizce. Türkçe sesle İngilizce kelime okunmaz (aksanlı öğretmesin).
- Kalıplar (**Hello / Yes / No / Where is…? / I like…**) bütün olarak, hep aynı işaretle (👋 ✅ ❌ 🔍 ❤️) verilir; ilk iki karşılaşmada Pofi durumu Türkçe anlatır, sonra Türkçe destek çekilir.
- **"Öğrendi" kuralı:** en az 4 farklı test türünde ilk denemede doğru, en az 2 farklı gün, en az bir kez kendisi söyledi (ya da veli duydu).
- **Veli köşesi:** her kelime için normal/yavaş telaffuz, Türkçe okunuş ipucu, evde nasıl sorulur ("What's this?", "Where is the cow?") ve "çocuğum söyledi" onayı.

## Ses (ElevenLabs)

Pofi'nin bütün cümleleri `src/content/lines.ts` içinde, her biri sabit bir kimlikle. Ses dosyası varsa o çalar, yoksa cihaz sesi.

```bash
npm run voice:dry                                    # satırları ve karakter sayısını listele
ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... npm run voice:generate
```

Dosyalar `assets/voice/` altına yazılır, `src/content/voice-manifest.ts` otomatik güncellenir. Var olan dosyalar atlanır; metin değişmedikçe tekrar ücret ödenmez.

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
| Ses | ElevenLabs dosyaları (expo-audio) + yedek olarak expo-speech; bas-konuş için expo-speech-recognition |
| Veri | AsyncStorage (cihaz içi); sunucu Faz 1'de |

## Klasörler

```
src/
  app/            # sadece rotalar: ada, bölge, oyun, albüm, veli
  components/     # Pofi, karton düğme, ada haritası, kartlar, katmanlar
  screens/games/  # Sesli kitap, Dinle-bul, Evet/Hayır, Eşleştir, Saklambaç, Konuş-büyü, görev
  content/        # bölgeler, kelimeler, kalıplar, öğretmen metni (lines.ts)
  state/          # ilerleme, aralıklı tekrar, süre sınırı
  lib/            # ses (TTS) ve dinleme (STT)
  theme.ts        # renkler, yazı, "karton diorama" kalınlığı
.claude/skills/   # Expo, Callstack ve ElevenLabs resmi agent skill'leri (MIT)
```

## Sıradaki adımlar

1. Marka adı ve karakter tasarımı → emoji görselleri özel illüstrasyonlarla değiştir (`content/regions.ts` → `picture`).
2. AI sohbet karakteri (senaryo kilitli, seviyeye kilitli dil, içerik filtresi).
3. Sunucu + veli hesabı (KVKK açık rıza) + web veli paneli.
4. Meyve Pazarı ve Gökkuşağı Tepesi bölgeleri.
5. Pilot okul için Android APK / iOS TestFlight (`.claude/skills/eas-app-stores`).
