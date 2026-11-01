// Web çıktısını (dist/) tek, bağımsız bir HTML dosyasına çevirir: önizleme linki için.
// Kullanım: npm run build:preview  →  preview/pofi.html
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1]);
let js = scripts.map((src) => fs.readFileSync(path.join(dist, src), 'utf8')).join('\n;\n');

// Kullanılan fontları gömülü veri olarak ekle (mutlak yollar her sunucuda çalışmaz)
const used = ['500Medium', '700Bold', '800ExtraBold'];
for (const m of js.matchAll(/"(\/assets\/node_modules\/@expo-google-fonts\/baloo-2\/[^"]+\.ttf)"/g)) {
  const rel = m[1];
  if (!used.some((u) => rel.includes(`/${u}/`))) continue;
  const b64 = fs.readFileSync(path.join(dist, rel)).toString('base64');
  js = js.split(`"${rel}"`).join(`"data:font/ttf;base64,${b64}"`);
}

js = js.replace(/<\/script/gi, '<\\/script');

const out = html
  .replace(/<script src="[^"]+"[^>]*><\/script>/g, '')
  .replace(/<link rel="icon"[^>]*\/>/, '')
  .replace(
    '</body>',
    // Fonksiyonla değiştir: küçültülmüş JS içindeki "$&" gibi dizeler kalıp sanılmasın.
    // Router adres çubuğundaki yolu okur; önizleme hangi yolda sunulursa sunulsun ana sayfadan başla
    () => `<script>try{history.replaceState(null,'','/')}catch(e){}</script>\n<script>${js}</script>\n</body>`,
  )
  .replace('<html lang="en">', '<html lang="tr">');

fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/pofi.html', out);
console.log(`preview/pofi.html ${(out.length / 1e6).toFixed(1)} MB`);

// claude.ai Artifact sürümü: sayfa iskeleti yayında eklenir, bu yüzden yalnızca gövde içeriği.
const style = out.match(/<style id="expo-reset">[\s\S]*?<\/style>/)?.[0] ?? '';
const body = out.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
const artifact = `<title>Pofi Adası</title>
${style.replace('</style>', '  html, body { background: #BFE9F5; color: #1D3557; }\n    </style>')}
${body}`;
fs.writeFileSync('preview/pofi-artifact.html', artifact);
console.log(`preview/pofi-artifact.html ${(artifact.length / 1e6).toFixed(1)} MB`);
