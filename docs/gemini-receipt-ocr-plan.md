# Gemini Receipt OCR Plan

Dokumen ini adalah rencana penerapan AI OCR untuk fitur scan struk Purrney. Fokusnya adalah memakai Gemini API free tier dulu, terutama `gemini-2.5-flash-lite`, lalu tetap menjaga biaya, limit, privasi, dan akurasi agar cocok untuk aplikasi pencatatan keuangan.

## Keputusan Awal

Rekomendasi awal:

- Pakai `gemini-3.1-flash-lite` untuk OCR struk, dengan fallback ke `gemini-2.5-flash-lite`.
- Jalankan pemanggilan Gemini dari server-side API route Next.js, bukan langsung dari browser.
- Tetap pakai preprocessing gambar di client untuk kompres, resize, dan peningkatan keterbacaan.
- Tetap tampilkan halaman review sebelum transaksi disimpan.
- Tetap simpan transaksi ke flow spreadsheet/offline sync yang sudah ada.
- Pertahankan OCR lokal Tesseract sebagai fallback opsional, bukan prioritas utama.

Alasan:

- Flash-Lite paling masuk akal untuk free tier, biaya rendah, dan extraction task yang ringan.
- AI vision lebih cocok dari OCR murni karena bisa langsung mengekstrak struktur transaksi.
- Server-side API route menjaga API key tidak bocor ke browser.
- Review manual tetap wajib karena data keuangan tidak boleh langsung dipercaya 100%.

## Kondisi Purrney Saat Ini

Fitur scan struk sudah punya fondasi:

- Halaman scan: `src/app/scanReceipt/page.tsx`
- Parser hasil OCR: `src/lib/receiptOcr.ts`
- Preprocessing gambar: `src/lib/receiptImagePreprocessing.ts`
- Dokumentasi flow lama: `docs/receipt-ocr-flow.md`

Flow saat ini masih berbasis OCR lokal:

```txt
Foto struk
-> preprocessing browser
-> tesseract.js lokal
-> parse text manual
-> user review
-> save ke spreadsheet / pending sync
```

Flow AI OCR yang disarankan:

```txt
Foto struk
-> preprocessing browser
-> kompres gambar
-> POST ke API route Purrney
-> Gemini Flash-Lite ekstrak JSON
-> validasi JSON di server
-> user review
-> save ke spreadsheet / pending sync
```

## Struktur Teknis Yang Disarankan

Tambahan file saat implementasi nanti:

```txt
src/app/api/receipt-ocr/route.ts
src/lib/geminiReceiptOcr.ts
src/lib/receiptOcrSchema.ts
src/lib/receiptOcrValidation.ts
```

Peran masing-masing:

- `src/app/api/receipt-ocr/route.ts`: menerima image dari client, memanggil Gemini, mengembalikan JSON hasil scan.
- `src/lib/geminiReceiptOcr.ts`: wrapper Gemini API, prompt, model config, dan parsing response.
- `src/lib/receiptOcrSchema.ts`: tipe data hasil OCR yang dipakai UI dan server.
- `src/lib/receiptOcrValidation.ts`: normalisasi nominal, tanggal, confidence, dan pengecekan total.

File existing yang akan disesuaikan:

- `src/app/scanReceipt/page.tsx`: ganti proses Tesseract menjadi request ke API route.
- `src/lib/receiptImagePreprocessing.ts`: tetap dipakai untuk memperkecil gambar sebelum upload.
- `src/lib/receiptOcr.ts`: bisa dipertahankan untuk helper format uang, parser fallback, dan scoring.

## Environment Variable

Tambahkan env lokal:

```txt
GEMINI_API_KEY=isi_api_key_dari_google_ai_studio
GEMINI_RECEIPT_OCR_MODEL=gemini-3.1-flash-lite
```

Untuk Vercel production, masukkan env yang sama di dashboard Vercel:

```txt
GEMINI_API_KEY
GEMINI_RECEIPT_OCR_MODEL
```

Catatan:

- Jangan pakai prefix `NEXT_PUBLIC_` untuk API key Gemini.
- API key hanya boleh dibaca dari server-side API route.
- Client cukup memanggil `/api/receipt-ocr`.

## Cara Membuat API Key Gemini

Langkah awal:

1. Buka Google AI Studio.
2. Masuk ke bagian API key.
3. Buat API key baru untuk project Purrney.
4. Simpan key ke `.env.local` sebagai `GEMINI_API_KEY`.
5. Cek halaman rate limit AI Studio untuk melihat limit aktif model yang dipakai.
6. Jangan commit `.env.local`.

Untuk free tier, angka limit aktif harus dicek dari dashboard AI Studio karena bisa berubah berdasarkan model, project, dan tier akun.

## Rate Limit Free Tier

Gemini API memakai beberapa batas sekaligus:

- `RPM`: request per minute.
- `TPM`: token per minute.
- `RPD`: request per day.

Jika kena `RPM`, user cukup menunggu sebentar lalu retry.

Jika kena `RPD`, jatah harian habis dan biasanya perlu menunggu reset harian.

Implikasi untuk Purrney:

- Jangan kirim banyak request bersamaan.
- Batasi satu scan aktif per user/session.
- Tambahkan debounce atau cooldown setelah scan.
- Tangani error `429` dengan pesan yang ramah.
- Jangan otomatis retry berkali-kali tanpa jeda.

Pesan UI yang disarankan:

```txt
OCR sedang mencapai batas pemakaian gratis. Coba lagi sebentar.
```

Jika limit harian habis:

```txt
Jatah scan AI gratis hari ini sudah habis. Coba lagi nanti atau input transaksi manual dulu.
```

## Strategi Hemat Token Dan Request

Prioritas hemat:

1. Resize gambar sebelum dikirim.
2. Crop area struk jika nanti tersedia.
3. Kompres ke JPEG/WebP.
4. Kirim satu gambar terbaik, bukan semua varian preprocessing.
5. Minta output JSON ringkas.
6. Batasi `maxOutputTokens`.
7. Jangan minta penjelasan dari model.
8. Jangan aktifkan tool tambahan seperti search grounding.
9. Cache hasil scan berdasarkan hash gambar jika memungkinkan.
10. Fallback ke input manual kalau rate limit habis.

Target ukuran gambar untuk MVP:

- Lebar sekitar 1000-1400 px.
- JPEG quality sekitar 0.7-0.85.
- Hindari upload foto kamera mentah yang bisa beberapa MB.

## Kontrak Data Hasil OCR

Response internal Purrney dari API route:

```ts
type ReceiptOcrApiResponse = {
  merchant: string;
  date: string;
  total: number;
  currency: "IDR";
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
    categoryValue: string;
    selected: boolean;
    confidence: number;
  }>;
  tax: number | null;
  discount: number | null;
  serviceCharge: number | null;
  rawText: string;
  warnings: string[];
  confidence: number;
};
```

Field wajib untuk bisa masuk review:

- `merchant`
- `date`
- `total`
- `items`
- `rawText`
- `confidence`

Fallback:

- Jika merchant kosong, pakai `Scanned receipt`.
- Jika tanggal kosong, pakai tanggal hari ini.
- Jika total kosong, coba jumlahkan item.
- Jika item kosong, user tetap bisa simpan mode total.
- Jika confidence rendah, tampilkan warning dan minta user cek ulang.

## Prompt Gemini

Prompt sistem yang disarankan:

```txt
You are an OCR and structured data extraction engine for Indonesian receipts.
Extract receipt data from the image.
Return only valid JSON.
Do not include markdown.
Use IDR integer amounts without separators.
If a field is not visible, use null or an empty string.
Never invent missing items.
```

Prompt user yang disarankan:

```txt
Extract this receipt into this JSON shape:
{
  "merchant": "string",
  "date": "YYYY-MM-DD or empty string",
  "total": 0,
  "currency": "IDR",
  "paymentMethod": "string",
  "items": [
    {
      "name": "string",
      "quantity": null,
      "unitPrice": null,
      "amount": 0,
      "confidence": 0
    }
  ],
  "tax": null,
  "discount": null,
  "serviceCharge": null,
  "rawText": "short OCR text",
  "warnings": [],
  "confidence": 0
}

Rules:
- Amounts must be integers in rupiah.
- Exclude subtotal, total, cash, change, payment method, cashier, address, phone, and receipt number from items.
- Include tax, discount, and service charge only when clearly visible.
- Set confidence from 0 to 100.
```

## Validasi Server

Server tidak boleh langsung percaya response model.

Validasi minimal:

- Pastikan response valid JSON.
- Pastikan `total` dan `amount` berupa angka positif.
- Clamp `confidence` ke 0-100.
- Normalisasi tanggal ke `YYYY-MM-DD`.
- Batasi panjang `merchant`, `item.name`, dan `rawText`.
- Hapus item dengan nama kosong atau amount tidak valid.
- Tambahkan warning jika total item jauh dari total struk.

Aturan selisih:

```txt
selectedItemsTotal = jumlah semua item valid
difference = abs(selectedItemsTotal - total)
```

Jika `difference > 0` dan `difference / total > 0.1`, tampilkan warning:

```txt
Total item berbeda cukup jauh dari total struk. Cek pajak, diskon, atau item yang salah terbaca.
```

## UX Yang Disarankan

Tetap gunakan pola review sekarang:

- Preview foto asli.
- Status scanning.
- Merchant/date/total bisa diedit.
- Item bisa diedit, ditambah, dihapus, atau dinonaktifkan.
- Save total atau save items.
- Wallet dan kategori tetap dipilih user.

Tambahan khusus AI:

- Tampilkan label `AI OCR`.
- Tampilkan confidence global.
- Tampilkan warning jika confidence rendah.
- Tampilkan pesan khusus saat free tier limit habis.
- Tampilkan fallback ke input manual.

Threshold UX:

- `confidence >= 75`: tampilkan normal.
- `50 <= confidence < 75`: tampilkan warning ringan.
- `confidence < 50`: tampilkan warning kuat dan sarankan foto ulang.

## Error Handling

Error yang perlu ditangani:

- API key belum diset.
- File terlalu besar.
- Format file bukan image.
- Gemini response bukan JSON.
- Gemini timeout.
- Rate limit `429`.
- Network error.
- Response kosong.

Mapping pesan:

```txt
GEMINI_API_KEY missing
-> Fitur AI OCR belum dikonfigurasi.

429 / RESOURCE_EXHAUSTED
-> Batas scan AI gratis sedang tercapai. Coba lagi nanti.

Invalid JSON
-> AI belum bisa membaca struk ini. Coba foto ulang dengan cahaya lebih terang.

Timeout
-> Proses scan terlalu lama. Coba kompres/foto ulang struk.
```

## Privacy

Untuk free tier Gemini, asumsi konservatif:

- Foto struk dikirim ke Google untuk diproses.
- Jangan simpan foto permanen di server.
- Jangan log base64 image.
- Jangan log full raw text struk di production.
- Tampilkan penjelasan singkat di UI bahwa scan AI mengirim gambar ke layanan AI.

Jika app mulai dipakai publik:

- Pertimbangkan pindah ke paid tier.
- Tambahkan consent singkat sebelum scan AI.
- Tambahkan opsi OCR lokal jika user tidak mau upload struk.

## Fallback Strategy

Fallback bertingkat:

```txt
Gemini Flash-Lite berhasil
-> tampilkan hasil review

Gemini Flash-Lite gagal karena rate limit
-> tampilkan pesan limit + opsi input manual

Gemini Flash-Lite gagal membaca struk
-> sarankan foto ulang

Jika nanti mau dipertahankan:
-> fallback ke Tesseract lokal
```

Untuk MVP AI, fallback Tesseract tidak wajib. Lebih baik implementasi sederhana dulu:

```txt
AI OCR gagal -> user bisa scan ulang atau input manual
```

## Rencana Implementasi

### Phase 1: Dokumentasi Dan Persiapan

- [x] Buat rencana AI OCR di dokumen ini.
- [ ] Tentukan model default: `gemini-3.1-flash-lite`.
- [ ] Buat API key di Google AI Studio.
- [ ] Tambahkan `GEMINI_API_KEY` ke `.env.local`.
- [ ] Tambahkan env yang sama di Vercel saat deploy.

### Phase 2: API Route

- [ ] Tambah `src/app/api/receipt-ocr/route.ts`.
- [ ] Terima upload image dari client.
- [ ] Validasi ukuran dan tipe file.
- [ ] Panggil Gemini Flash-Lite.
- [ ] Parse dan validasi JSON.
- [ ] Kembalikan response sesuai kontrak Purrney.
- [ ] Tangani error rate limit, timeout, dan invalid response.

### Phase 3: Client Scan Flow

- [ ] Ubah `src/app/scanReceipt/page.tsx` agar memakai `/api/receipt-ocr`.
- [ ] Tetap pakai preprocessing/resize sebelum upload.
- [ ] Hapus ketergantungan runtime utama ke Tesseract dari flow default.
- [ ] Tampilkan AI confidence dan warnings.
- [ ] Tetap pakai review dan save flow existing.

### Phase 4: Hemat Dan Aman

- [ ] Tambah kompresi JPEG/WebP sebelum upload.
- [ ] Batasi ukuran upload maksimal.
- [ ] Tambah cooldown scan sederhana.
- [ ] Tambah pesan UI untuk limit free tier.
- [ ] Pastikan API key tidak pernah muncul di client bundle.

### Phase 5: Evaluasi

- [ ] Uji dengan struk minimarket.
- [ ] Uji dengan struk restoran.
- [ ] Uji dengan struk bensin/transport.
- [ ] Uji foto buram, gelap, dan miring.
- [ ] Bandingkan hasil AI OCR dengan Tesseract lokal.
- [ ] Putuskan apakah Tesseract tetap dipertahankan sebagai fallback.

## Definisi Selesai Untuk MVP

MVP AI OCR dianggap selesai jika:

- User bisa upload/foto struk.
- App memanggil Gemini dari server-side route.
- API key tidak bocor ke client.
- Hasil scan muncul di review form.
- User bisa edit hasil scan.
- User bisa simpan sebagai total atau items.
- Error rate limit tampil dengan jelas.
- Build dan lint lulus.
