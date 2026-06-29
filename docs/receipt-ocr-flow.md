# Receipt OCR Flow

Dokumen ini menjelaskan rancangan fitur scan struk lokal untuk Purrney. Fitur ini bertujuan mempercepat input transaksi expense dengan OCR di device user, tanpa biaya API OCR eksternal.

## Tujuan

- User bisa menambahkan transaksi dari foto struk.
- OCR mencoba membaca semua item di dalam struk, bukan hanya total akhir.
- Proses OCR berjalan lokal di browser jika memungkinkan.
- User tetap bisa review dan edit hasil scan sebelum transaksi disimpan.
- Data akhir tetap mengikuti schema `transactions` yang sudah ada.

## Entry Point

Tombol transaksi di bottom navigation tidak langsung masuk ke halaman add transaction. Saat ditekan, app menampilkan modal pilihan:

- Add Manual
- Scan Struk

Jika user memilih Add Manual, app masuk ke halaman `/addTransaction` seperti flow saat ini.

Jika user memilih Scan Struk, app membuka kamera atau file picker untuk mengambil foto struk.

## Flow UX

1. User menekan icon transaksi di navigation.
2. App membuka modal pilihan input.
3. User memilih `Scan Struk`.
4. App membuka kamera belakang dengan input file:
   - `accept="image/*"`
   - `capture="environment"`
5. User mengambil foto struk.
6. App menjalankan OCR lokal.
7. App menampilkan halaman atau modal review hasil scan.
8. User memeriksa dan mengubah hasil scan.
9. User memilih wallet dan kategori.
10. User menyimpan transaksi.

## Review Hasil Scan

Halaman review perlu menampilkan:

- nama merchant atau deskripsi
- tanggal transaksi
- total transaksi
- daftar item yang berhasil terbaca
- mode simpan: satu transaksi total atau banyak transaksi per item
- pilihan wallet
- pilihan kategori utama
- kategori per item jika user memilih mode banyak transaksi
- catatan

User bisa melakukan:

- edit merchant atau deskripsi
- edit tanggal
- edit total
- edit item yang salah terbaca
- hapus item yang salah terbaca
- mengubah wallet
- mengubah kategori utama
- mengubah kategori per item
- menerapkan satu kategori untuk semua item
- memilih apakah hasil scan disimpan sebagai satu transaksi total atau banyak transaksi item
- batal dan kembali ke input manual

## Data Yang Disimpan

OCR harus tetap mencoba membaca semua item di struk. Setelah review, user bisa memilih salah satu mode penyimpanan.

### Mode 1: Satu Transaksi Total

Mode ini menjadi default awal karena paling aman untuk struk yang OCR-nya belum sempurna.

Mapping data:

- `date`: tanggal dari hasil scan atau tanggal hari ini jika tidak terbaca
- `description`: nama merchant atau fallback seperti `Scanned receipt`
- `type`: `out`
- `account_id`: wallet yang dipilih user
- `category_value`: kategori expense yang dipilih user
- `amount`: total akhir struk
- `note`: daftar item hasil scan dan raw text ringkas

### Mode 2: Banyak Transaksi Per Item

Mode ini menyimpan setiap item valid sebagai transaksi expense terpisah di sheet `transactions`.

Mapping data per item:

- `date`: tanggal dari hasil scan atau tanggal hari ini jika tidak terbaca
- `description`: nama item hasil scan
- `type`: `out`
- `account_id`: wallet yang dipilih user
- `category_value`: kategori item
- `amount`: nominal item
- `note`: nama merchant, sumber `Scanned receipt`, dan info struk ringkas

Jika mode ini dipilih, total semua item yang disimpan perlu dibandingkan dengan total struk. Jika ada selisih karena pajak, diskon, service charge, atau OCR error, app harus menampilkan warning dan meminta user mengoreksi sebelum save.

## Kategori Item

Default kategori untuk hasil OCR:

- Gunakan `shopping` sebagai default umum untuk item struk.
- User bisa mengganti kategori utama sebelum save.
- Jika mode banyak transaksi dipilih, user bisa mengganti kategori per item.
- Sediakan action `Apply category to all` agar user tidak perlu mengubah satu per satu.

Kategori otomatis bisa ditambahkan nanti berdasarkan merchant atau kata kunci item. Contoh awal:

- makanan/minuman masuk `food`
- bensin/parkir/transport masuk `transport`
- obat/klinik/apotek masuk `health`
- sisanya fallback ke `shopping` atau `others`

Untuk MVP, jangan terlalu percaya auto-category. Jadikan kategori otomatis sebagai draft yang bisa dikoreksi user.

## Kenapa Tetap Ada Mode Satu Transaksi

Walaupun Purrney perlu bisa membaca semua item, mode satu transaksi tetap penting karena struk sering punya:

- pajak
- diskon
- rounding
- service charge
- promo bundle
- item dengan nama terpotong
- nominal yang salah terbaca OCR

Mode satu transaksi memberi jalan cepat saat user hanya ingin mencatat total belanja. Mode banyak transaksi memberi detail ketika user ingin laporan yang lebih granular.

## Parser OCR MVP

Parser awal cukup mencoba mengenali:

- total dari kata seperti `TOTAL`, `GRAND TOTAL`, `JUMLAH`, `TOTAL BAYAR`, atau `BAYAR`
- tanggal dari pola umum seperti `dd/mm/yyyy`, `dd-mm-yyyy`, atau `yyyy-mm-dd`
- merchant dari beberapa baris awal struk
- daftar item dari baris yang memiliki teks dan nominal
- koreksi item yang tampak seperti subtotal, pajak, diskon, kembalian, atau metode pembayaran agar tidak otomatis dianggap barang belanja

Semua hasil parser dianggap draft. User tetap menjadi penentu final sebelum transaksi disimpan.

## OCR Accuracy Dan Preprocessing

Akurasi OCR struk tidak cukup hanya bergantung pada Tesseract. Foto struk perlu diproses agar teks menjadi lebih lurus, bersih, kontras, dan besar sebelum dikirim ke OCR.

Pipeline yang disarankan:

1. Ambil foto asli dari kamera atau file picker.
2. Tampilkan preview foto sebelum OCR jika memungkinkan.
3. Deteksi area struk dari foto.
4. Crop area struk agar background meja, tangan, atau objek lain tidak ikut terbaca.
5. Luruskan perspektif struk jika foto miring.
6. Resize gambar agar teks cukup besar.
7. Ubah ke grayscale.
8. Naikkan kontras.
9. Kurangi noise kecil.
10. Terapkan threshold atau adaptive threshold agar teks hitam dan background putih lebih jelas.
11. Deskew atau rotasi kecil jika baris teks miring.
12. Kirim gambar hasil preprocessing ke Tesseract.
13. Simpan raw text dan confidence OCR untuk debugging.
14. Jalankan parser item, total, tanggal, dan merchant dari hasil OCR.

### Capture Guidance

UI scan perlu membantu user mengambil foto yang lebih mudah dibaca:

- tampilkan instruksi singkat agar struk difoto di tempat terang
- minta user meletakkan struk di permukaan polos
- minta user mengambil foto dari atas, bukan terlalu miring
- pastikan seluruh struk masuk frame
- hindari bayangan tangan atau HP
- hindari blur dengan menunggu kamera fokus
- sarankan foto ulang jika preview terlalu gelap, blur, atau terpotong

Untuk versi lanjutan, app bisa menampilkan overlay frame struk agar user lebih mudah menempatkan struk.

### Crop Dan Perspective Correction

Foto struk sering miring atau mengambil banyak background. Preprocessing perlu mencoba:

- mendeteksi kontur terbesar yang terlihat seperti kertas struk
- mengambil empat sudut struk
- melakukan perspective transform agar struk menjadi kotak/lurus
- fallback ke crop manual atau foto asli jika deteksi gagal

Library kandidat:

- `jscanify` untuk document detection, crop, dan perspective transform
- `opencv.js` untuk kontrol preprocessing yang lebih detail

Untuk MVP lanjutan, gunakan auto-crop sebagai bantuan, bukan kewajiban. Jika auto-crop gagal, user tetap bisa menjalankan OCR dari foto asli.

### Resize

Teks struk thermal sering kecil. Sebelum OCR:

- naikkan resolusi gambar sekitar 1.5x sampai 2x
- pastikan lebar hasil proses cukup besar, misalnya 1200-1800 px untuk struk panjang
- jangan memperbesar terlalu ekstrem karena bisa memperbesar noise

Resize perlu dilakukan sebelum threshold agar detail huruf tidak hilang terlalu cepat.

### Grayscale Dan Contrast

Langkah dasar:

- konversi RGB ke grayscale
- tingkatkan kontras agar teks lebih gelap dan background lebih terang
- gunakan brightness adjustment jika foto terlalu gelap

Target hasil:

- teks terlihat hitam atau abu gelap
- background struk terlihat terang
- bayangan tidak terlalu dominan

### Noise Reduction

Struk thermal sering punya noise, dot, dan tekstur kertas. Langkah yang bisa dicoba:

- blur ringan sebelum threshold
- median blur untuk mengurangi titik kecil
- morphological open untuk membersihkan noise kecil
- hindari blur berlebihan karena bisa menghapus huruf tipis

### Threshold

Threshold membantu Tesseract membaca teks sebagai hitam-putih:

- gunakan adaptive threshold untuk foto dengan pencahayaan tidak rata
- gunakan Otsu threshold untuk foto yang pencahayaannya merata
- sediakan fallback ke grayscale tanpa threshold jika threshold membuat huruf hilang

Karena kualitas foto berbeda-beda, sebaiknya pipeline menghasilkan beberapa kandidat gambar:

- grayscale contrast
- adaptive threshold
- Otsu threshold

Lalu pilih hasil OCR terbaik berdasarkan confidence atau jumlah baris item yang valid.

### Deskew Dan Orientation

Jika baris teks miring, parser item bisa kacau. Preprocessing perlu mencoba:

- deteksi kemiringan kecil dari garis teks
- rotasi gambar agar baris lebih horizontal
- coba OCR pada rotasi 0 derajat, 90 derajat, dan 270 derajat jika orientasi terlihat salah

Untuk MVP, cukup tampilkan tombol `Rotate` manual jika hasil scan terlihat miring.

### Tesseract Configuration

Konfigurasi Tesseract yang perlu diuji:

- language `eng+ind` agar nama item Indonesia lebih terbaca
- page segmentation mode untuk satu kolom teks atau sparse text
- disable dictionary jika item struk banyak kode produk, singkatan, dan nominal
- whitelist karakter untuk mode tertentu jika hanya membaca nominal

Contoh parameter yang perlu dieksperimen:

- `tessedit_pageseg_mode`
- `load_system_dawg`
- `load_freq_dawg`
- `preserve_interword_spaces`

Catatan: jangan mengunci satu konfigurasi terlalu cepat. Beberapa struk lebih cocok single column, sementara struk lain lebih cocok sparse text.

### Multi-Pass OCR

Untuk meningkatkan hasil, app bisa menjalankan OCR lebih dari sekali:

1. OCR gambar grayscale contrast.
2. OCR gambar adaptive threshold.
3. OCR gambar yang sudah di-crop dan diluruskan.
4. Bandingkan hasil berdasarkan:
   - confidence OCR
   - jumlah item valid yang ditemukan parser
   - apakah total ditemukan
   - apakah tanggal ditemukan
5. Pilih hasil terbaik untuk ditampilkan ke user.

Multi-pass lebih lambat, jadi UI perlu progress state yang jelas. Di HP low-end, mode cepat satu-pass tetap perlu tersedia.

### Debugging Akurasi

Selama tahap pengembangan, simpan data debug sementara di UI:

- preview gambar asli
- preview gambar hasil preprocessing
- raw OCR text
- confidence OCR
- jumlah item yang berhasil diparse
- total item vs total struk

Data debug ini membantu membandingkan hasil foto asli vs hasil preprocessing tanpa harus menebak-nebak.

Untuk production, debug detail bisa disembunyikan di section advanced.

## Teknologi

Rekomendasi awal:

- `tesseract.js` untuk OCR lokal berbasis browser
- `jscanify` untuk crop dan perspective correction struk
- `opencv.js` untuk preprocessing lanjutan jika kontrol lebih detail dibutuhkan
- Web Worker agar UI tidak terlalu berat saat proses OCR
- dynamic import agar bundle utama tidak membengkak saat user tidak memakai fitur OCR

Catatan:

- OCR lokal tidak membutuhkan biaya API.
- Model OCR perlu diunduh atau di-cache oleh browser.
- Akurasi bergantung pada kualitas foto, cahaya, font struk, dan kondisi kertas.
- Perlu loading state yang jelas karena proses OCR bisa lambat di HP low-end.
- Preprocessing gambar lebih penting daripada sekadar mengganti library OCR.

## Offline Dan Privacy

Fitur ini cocok dengan arah PWA dan offline Purrney karena:

- foto struk tidak perlu dikirim ke server OCR pihak ketiga
- OCR bisa diproses di device user
- transaksi hasil scan tetap bisa masuk pending sync jika Google Sheets belum bisa diakses

Untuk MVP, foto struk tidak perlu disimpan permanen. App cukup memakai foto untuk OCR lalu membuangnya setelah user menyimpan atau membatalkan review.

## Scope MVP

- [ ] Ubah tombol transaksi di navigation menjadi modal pilihan.
- [ ] Tambahkan pilihan Add Manual.
- [ ] Tambahkan pilihan Scan Struk.
- [ ] Buat halaman atau modal review OCR.
- [ ] Integrasikan input kamera/file untuk foto struk.
- [ ] Tambahkan preprocessing gambar sebelum OCR.
- [ ] Tambahkan preview foto asli dan hasil preprocessing.
- [ ] Tambahkan crop atau perspective correction jika memungkinkan.
- [ ] Tambahkan resize, grayscale, contrast, noise reduction, dan threshold.
- [ ] Tambahkan opsi rotate manual jika hasil foto miring.
- [ ] Jalankan OCR lokal dengan `tesseract.js`.
- [ ] Uji konfigurasi Tesseract untuk struk, termasuk language `eng+ind`.
- [ ] Simpan raw OCR text dan confidence untuk review/debug.
- [ ] Buat parser total, tanggal, merchant, dan semua item yang terbaca.
- [ ] Auto-fill draft transaksi dari hasil OCR.
- [ ] Izinkan user edit dan hapus item hasil scan.
- [ ] Tambahkan pilihan mode simpan: satu transaksi total atau banyak transaksi per item.
- [ ] Jadikan satu transaksi total sebagai default awal.
- [ ] Dukung penyimpanan banyak transaksi jika user memilih mode per item.
- [ ] Gunakan kategori default `shopping` untuk item OCR.
- [ ] Izinkan user mengubah kategori per item.
- [ ] Tambahkan action untuk menerapkan satu kategori ke semua item.
- [ ] Simpan daftar item ke note jika user memilih mode satu transaksi total.
- [ ] Tampilkan warning jika total item tidak sama dengan total struk.
- [ ] Tampilkan loading, success, error, dan retry state.

## Future Improvement

- Simpan attachment foto struk jika user mengaktifkan fitur attachment.
- Tambahkan deteksi kategori otomatis berdasarkan merchant atau item.
- Tambahkan confidence score untuk field hasil OCR.
- Tambahkan koreksi total jika item, diskon, pajak, dan biaya layanan terbaca.
- Tambahkan auto-crop berbasis document detection.
- Tambahkan multi-pass OCR dan pilih hasil terbaik.
- Pindahkan cache OCR model ke strategi PWA yang lebih eksplisit.
