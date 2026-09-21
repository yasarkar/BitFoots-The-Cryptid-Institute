# 🌲 BitFoots Tasarım Sistemi & Stil Rehberi (Design System & Style Guide)

Bu rehber, **BitFoots** ekosistemine ait görsel dilin, tasarım felsefesinin, renk ahenginin, tipografi kurallarının ve bileşen mimarisinin bir standart olarak uygulanabilmesi için hazırlanmıştır.

---

## 1. Tasarım Felsefesi: *Forest Noir & Cryptid Expedition*

BitFoots görsel dili; Web3'ün soğuk ve mekanik çizgilerini, **19. yüzyıl doğa bilimcilerinin saha defterleri**, **mitolojik orman keşifleri** ve **retro piksel estetiği** ile harmanlar.

### Temel Tasarım İlkeleri:
1. **Yaşayan Atmosfer (Living World UI):** Arayüz durağan bir kutu değildir. Arka planda orman nefes alır; ağaçlar rüzgarla hafifçe salınır, sis yatayda süzülür ve karanlığın içinden ara sıra altın gözler parıldayıp göz kırpar.
2. **Karanlıkta Yanan Fener (High-Contrast Lighting):** Koyu ve soğuk kömür tonlarının (`#14171c`) ortasında, fener ışığı veya altın madeni etkisi yaratan sıcak kehribar altın (`#eaba49`) ve parşömen şeftalisi (`#ffddcc`) kullanılır.
3. **Akademik & Gizemli Editoryal Dil:** Klişe sans-serif fontlar yerine editoryal serif (`IBM Plex Serif`) ile askeri/terminal disiplini (`Monospace` + `Uppercase` + `wide letter-spacing`) bir arada kullanılır.
4. **Piksel Sanatı Detayları:** İnce altın kenarlıklar, piksel ayak izi süslemeleri ve retro rozetlerle aidiyet ve merak duygusu pekiştirilir.

---

## 2. Renk Paleti & Design Tokens

Tüm renkler ve kontrast değerleri CSS değişkenleri (`:root`) üzerinden yönetilir:

```css
:root {
  /* Zemin ve Yüzeyler */
  --bg: #14171c;          /* Derin Gece / Abis Kömürü - Sayfa zemin rengi */
  --panel: #1a1f26;       /* Kart ve panel zemin rengi */
  --field: #0f1216;       /* Girdi alanları ve çukur zeminler */
  --overlay: rgb(11 13 17 / 0.8); /* Yarı saydam kart dolgusu */

  /* Vurgular ve Işık */
  --gold: #eaba49;        /* İmza Antik Altın - Kenarlıklar, ikonlar, butonlar */
  --gold-hover: #f3c85f;  /* Etkileşim anında parlayan parlak kehribar sarısı */
  --heading: #ffddcc;     /* Sıcak Parşömen / Şeftali - Gaz lambası ışığı hissi */

  /* Metin ve Kontur */
  --text: #aab6c9;        /* Sis Grisi - Okunaklı ve göz yormayan gövde metni */
  --lead-text: #c9ccd2;   /* Vurgulu ara metin rengi */
  --muted: #7d8898;       /* Grafit Grisi - Tarih, alt bilgi ve pasif detaylar */
  --line: #3a475c;        /* Soğuk Kurşun - Ayrım ve sınır çizgileri */

  /* Durum Göstergeleri */
  --ok: #7fc98f;          /* Başarılı / Kabul Edildi - Orman yeşili */
  --bad: #e07a6b;         /* Hata / Reddedildi - Terracotta kırmızısı */
  --unk: #d8c27a;         /* Beklemede / Bilinmeyen - Hardal altın */
}
```

---

## 3. Tipografi Hiyerarşisi

| Rol | Font Ailesi | Boyut & Ağırlık | Harf Aralığı / Kasa | Kullanım Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **H1 (Ana Başlık)** | `IBM Plex Serif`, serif | 27px - 32px / 500 | Normal | *"Good luck, hunter."* |
| **Eyebrow (Üst Başlık)** | Sistem / Monospace | 13px / 600 | `0.22em` / `UPPERCASE` | `APPLICATION RECEIVED` |
| **Lead (Açıklama)** | `IBM Plex Serif` veya Sans | 16px / 400 | Normal | Kart içi ana bilgilendirme metni |
| **Status Chip** | Sistem Sans / Mono | 14px / 400 (Kalın: 700) | `0.06em` | `Status: PENDING` |
| **Buttons (Aksiyonlar)**| Sistem / Monospace | 12px / 600 | `0.18em` / `UPPERCASE` | `POST ON X`, `COPY IMAGE` |
| **Muted (Zaman/Detay)** | Sistem Sans | 14px / 400 | Normal | `Sent 2026-09-18 13:09 UTC.` |

---

## 4. Atmosfer & Parallaks Animasyonları (Living World UI)

BitFoots atmosferi arkada 5 bağımsız katmandan oluşur. Arka plan bileşeni `position: fixed; inset: 0; pointer-events: none;` olarak kurgulanmalıdır.

### Katman Hiyerarşisi:
1. **`.world__trees` (Ağaç Katmanları):**
   ```css
   .world__trees {
     position: absolute;
     inset: 0;
     z-index: calc(var(--z) + 1);
     width: 100%;
     height: 100%;
     object-fit: cover;
     scale: calc(1.12 + var(--z) * 0.6);
     filter: brightness(calc(0.72 + var(--z) * 0.04));
     animation: fw-sway calc(9s - var(--z) * 1.2s) ease-in-out infinite alternate;
   }
   @keyframes fw-sway {
     from { transform: skewX(calc(var(--z) * -0.22deg)); }
     to   { transform: skewX(calc(var(--z) * 0.22deg)); }
   }
   ```

2. **`.world__fog` (Çift Katmanlı Sis):**
   - **Arka Sis:** `animation: fw-drift 80s linear infinite;`
   - **Ön Sis (`.world__fog--near`):** `animation: fw-drift 55s linear infinite reverse;`
   ```css
   @keyframes fw-drift {
     to { transform: translateX(-50%); }
   }
   ```

3. **`.world__eyes` (Ormanda Gizlenen Canlılar):**
   - Rastgele konumlarda (`--x`, `--y`) beliren altın renkli göz çiftleri.
   ```css
   .world .eye-pair {
     position: absolute;
     left: var(--x);
     top: var(--y);
     display: flex;
     gap: calc(var(--s) * 0.1333);
     opacity: 0;
     filter: drop-shadow(0 0 calc(var(--s) * 0.6) rgb(234 186 73 / 0.45));
     animation: fw-lurk var(--lt) ease-in-out var(--ld) infinite,
                fw-blink var(--bt) var(--bd) infinite;
   }
   @keyframes fw-lurk {
     0%, 70%, 100% { opacity: 0; }
     12%, 58%      { opacity: 1; }
   }
   @keyframes fw-blink {
     0%, 93%, 100% { transform: scaleY(1); }
     95.5%         { transform: scaleY(0.08); }
   }
   ```

4. **Ay Işığı ve Karartma (Vignette):**
   - `.world::before`: Üst merkezden vuran soğuk mavi ay ışığı yansıması:
     `radial-gradient(ellipse 60% 55% at 50% 22%, rgb(185 200 235 / 0.2), transparent 70%)`
   - `.world::after`: Kenarları saran koyu vignette:
     `radial-gradient(ellipse 80% 85% at 50% 40%, transparent 45%, rgb(5 6 8 / 0.6) 100%)`

---

## 5. UI Bileşen Standartları (Component Specs)

### 1. Kart Konteyneri (`main.narrow`)
```css
main.narrow {
  max-width: 768px;
  margin: 48px auto 14vh;
  padding: 44px 48px 48px;
  color: #e6e8ec;
  background: rgb(11 13 17 / 0.8);
  border: 1px solid rgb(234 186 73 / 0.85);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 
    0 30px 120px rgb(0 0 0 / 0.65),
    0 -24px 100px rgb(185 200 235 / 0.07);
}
```

### 2. Durum Rozeti (`.chip--solid`)
```css
.chip--solid {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 10px;
  background: var(--gold);
  color: #14171c;
  font-size: 14px;
}
.chip--solid strong {
  font-weight: 700;
  letter-spacing: 0.06em;
}
```

### 3. Butonlar (`.btn` & `.btn--solid`)
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  background: #000000;
  border: 1px solid var(--gold);
  color: #e6e8ec;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn:hover {
  background: rgb(234 186 73 / 0.12);
  color: var(--heading);
}

/* Birincil / Vurgulu Buton */
.btn--solid {
  background: var(--gold);
  color: #14171c;
}

.btn--solid:hover {
  background: var(--gold-hover);
  color: #14171c;
}
```

### 4. Piksel Süsleme Rozeti (`.card__mark`)
Kartın üst kısmında yer alan, merkezinde altın pikselli ayak izi ve yanlara degrade çizgilerle açılan ayırıcı rozet.

---

## 6. Yeni Sayfa & Modal Geliştirirken Kontrol Listesi (Checklist)

Yeni bir arayüz veya modal geliştirirken şu kurallara dikkat edilmelidir:
- [ ] Zemin rengi düz siyah değil, derin yeşil-mavi alt tonlu `#14171c` mi?
- [ ] Kart kenarlıkları altın tonunda (`rgba(234, 186, 73, 0.85)`) mı?
- [ ] Başlıklarda `IBM Plex Serif` kullanıldı mı?
- [ ] Butonlar ve etiketler uppercase ve geniş letter-spacing (`0.18em` - `0.22em`) değerine sahip mi?
- [ ] Hover efektleri donuk değil, altın parıltısı (`#f3c85f` veya `rgba(234, 186, 73, 0.12)`) içeriyor mu?
- [ ] Sayfada veya arka planda hareket hissi (sis, gözler, rüzgar) korunuyor mu?
- [ ] Form ve statü metinleri avcı/keşif jargonuna ("hunter", "expedition", "tracks") uygun mu?
