# Pofi Adası — ajan notları

AGENTS.md'deki Expo kuralları geçerlidir (versiyonlu dokümana bak, `npx expo install` kullan). Ağ kısıtlı ortamlarda `EXPO_OFFLINE=1 npx expo install <paket>` SDK uyumlu sürümü yerel tablodan seçer.

## Ürün kuralları (değiştirme)

- Hedef 5–9 yaş (Kaşif modu 9–10 sonra). Çocuk okuma bilmeyebilir: her yönerge Pofi tarafından Türkçe sesli okunur, İngilizce kelimeler resim + sesle öğretilir, **çeviri gösterilmez**.
- Hata cezası yok; yanlışta nazik tekrar. En az 1 yıldız.
- Seri cezası, loot box, reklam, sosyal alan, sonsuz kaydırma yok. Günlük süre sınırı varsayılan açık.
- Ses kaydı saklanmaz. Çocuktan kişisel bilgi istenmez.
- Veli ekranları ve ayarlar `ParentGate` arkasında.

## Tasarım dili

"Karton diorama": her dokunulabilir yüzey `Chunky`/`Paper` ile, altında bulanık olmayan koyu kalınlık katmanı. Renk ve yazı tipi yalnızca `src/theme.ts`'ten. Font: Baloo 2. Animasyonlar `.claude/skills/expo-animation` kurallarına uyar (Reanimated, transform/opacity, `.get()/.set()`, azaltılmış hareket).

## Doğrulama

`npm run typecheck` ve `npm run build:web` geçmeli. Görsel kontrol için `dist/` statik sunulup tarayıcıda gezilebilir.
