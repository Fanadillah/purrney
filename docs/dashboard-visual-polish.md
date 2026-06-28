# Dashboard Visual Polish

Dokumen ini menyimpan evaluasi dan rencana polish visual dashboard Purrney untuk dieksekusi nanti sebelum beta atau sebelum production readiness.

## Status Saat Ini

Dashboard sudah punya fondasi yang kuat secara fungsi:

- data sudah real dari Google Spreadsheet
- data terakhir disimpan di local device sebagai fallback saat offline
- balance summary tampil
- income dan expense tampil
- quick menu tersedia
- budget progress tampil
- goals tampil
- recent transactions tampil dan punya link ke halaman semua transaksi
- layout sudah responsif dasar

Secara rasa brand, dashboard juga sudah punya karakter:

- warm
- friendly
- playful
- tidak terasa seperti finance app yang kaku

Namun secara product UI, dashboard masih terasa seperti prototype yang perlu dirapikan.

## Penilaian Sementara

- Functionality: 8/10
- Brand feel: 7/10
- Dashboard UX: 6.5/10
- Visual polish: 6/10

Artinya:

- fondasi sudah oke
- personality sudah ada
- hierarchy dan konsistensi visual masih perlu dinaikkan

## Masalah Utama

### 1. Hierarchy Belum Rapi

Saat ini banyak section punya bobot visual yang mirip.

Dampaknya:

- mata user belum langsung tahu fokus utama
- balance, quick menu, budget, goals, dan transaksi terasa berebut perhatian

Target:

- balance menjadi fokus utama
- insight penting muncul setelah balance
- section sekunder dibuat lebih compact

### 2. Spacing Belum Konsisten

Beberapa section memakai margin/padding yang berbeda-beda.

Dampaknya:

- dashboard terasa agak patchwork
- jarak antar elemen belum punya rhythm yang stabil

Target:

- gunakan spacing token/pola yang konsisten
- section gap seragam
- card padding seragam

### 3. Card Style Belum Satu Bahasa

Ada card dengan radius besar, radius kecil, shadow berat, shadow ringan.

Dampaknya:

- UI terasa belum satu design system
- beberapa card terlihat lebih dekoratif daripada fungsional

Target:

- card radius konsisten: `rounded-md` atau `rounded-lg`
- shadow lebih ringan
- card hanya dipakai untuk konten yang memang perlu framing

### 4. Header Dan Welcome Card Terlalu Ramai

Welcome card saat ini punya elemen dekoratif yang cukup dominan.

Dampaknya:

- area atas dashboard terasa ramai
- user perlu scroll/scan lebih banyak sebelum masuk data utama

Target:

- welcome card dibuat lebih compact
- greeting tetap ada, tapi tidak mengambil terlalu banyak ruang
- Google connection status tetap terlihat jelas

### 5. Desktop Dashboard Belum Benar-Benar Designed

Dashboard desktop sudah memakai grid, tetapi belum sepenuhnya terasa seperti layout desktop yang matang.

Dampaknya:

- desktop terasa seperti mobile layout yang dilebarkan
- komposisi kolom belum punya prioritas visual yang kuat

Target:

- desktop memakai layout yang deliberate
- kiri untuk summary/insight utama
- kanan untuk activity, goals, atau quick actions
- max width tetap nyaman

### 6. Quick Menu Terlalu Besar

Quick Menu saat ini bobot visualnya cukup besar dibanding fungsinya.

Dampaknya:

- shortcut terasa seperti konten utama
- ruang dashboard habis untuk navigasi sekunder

Target:

- ubah Quick Menu menjadi compact shortcuts
- gunakan icon + label kecil
- bisa menjadi row horizontal atau small action buttons

### 7. Recent Transactions Perlu Lebih Modern

Recent transactions sudah berfungsi, tetapi visualnya masih sederhana.

Dampaknya:

- scanning transaksi kurang cepat
- kategori/icon belum konsisten
- transfer belum punya treatment visual yang jelas

Target:

- amount rata kanan
- income hijau, expense merah, transfer biru/netral
- kategori punya badge/icon konsisten
- list item height stabil
- text truncate rapi

## Rencana Section Baru Dashboard

Urutan dashboard yang disarankan:

1. Compact Header
2. Balance Hero
3. Month Snapshot / Insight Strip
4. Compact Quick Actions
5. Budget Overview
6. Goals Overview
7. Recent Transactions

## Phase 13 Dashboard Update

Perubahan yang sudah masuk dari Phase 13:

- Recent transactions sekarang mengarah ke `/transactions` lewat action `View All`.
- Kontribusi goal tampil sebagai transaksi expense dengan label `Goal Contribution`.
- Saldo wallet berkurang dari transaksi kontribusi, sementara progress goal naik dari snapshot goal terbaru.
- Dashboard memakai cache spreadsheet terakhir dari local device ketika load Google Sheets gagal karena koneksi.
- Page `/transactions` menjadi tempat user melihat seluruh riwayat, sedangkan dashboard tetap menampilkan 5 transaksi terbaru.

## Dashboard Insight Upgrade

Bagian ini adalah rencana lanjutan setelah visual polish dasar selesai. Tujuannya bukan membuat dashboard menjadi halaman reports kedua, tetapi menambah lapisan insight yang cepat dibaca user.

Status implementasi:

- [x] Cashflow Insight Card sudah tampil setelah Balance Hero.
- [x] Donut chart `Income vs Expense` bulan berjalan sudah tampil di Cashflow Insight.
- [x] Calendar Activity bulan berjalan sudah tampil di dashboard.
- [x] Klik tanggal di Calendar Activity menampilkan pop-up kecil berisi transaksi di hari itu.
- [x] Empty state dashboard memakai `NoTransactionCat.png` ketika transaksi, budget, dan goals masih kosong.
- [x] Income dan expense pada dashboard dihitung untuk bulan berjalan.
- [x] Layout dashboard mobile dan desktop sudah diurutkan ulang mengikuti insight upgrade.

Dashboard sebaiknya menjawab tiga pertanyaan dalam satu layar:

- uang saya sekarang sehat atau tidak?
- aktivitas keuangan saya bulan ini ramai atau sepi?
- hal apa yang perlu saya waspadai?

### 1. Cashflow Insight Card

Tujuan:

- memberi komentar singkat terhadap kondisi cashflow user
- membuat angka terasa lebih mudah dimengerti
- memperkuat karakter Purrney sebagai finance companion yang friendly

Isi:

- reaction text sederhana seperti `happyCat.png` untuk happy, `AnxiousCat.png` untuk datar, atau `sadCat.png` untuk sedih, dan NoTransactionCat.png untuk belum ada data
- headline pendek
- komentar cashflow 1 kalimat
- net cashflow bulan ini
- income dan expense bulan ini

Contoh copy:

- `Cashflow kamu positif bulan ini. Nice, masih ada ruang buat nabung.`
- `Expense mulai mendekati income. Coba cek kategori paling besar.`
- `Cashflow negatif. Bulan ini uang keluar lebih besar dari masuk.`
- `Belum ada data bulan ini. Tambah transaksi pertama untuk mulai membaca pola.`

Rules awal:

- jika income dan expense masih `0`, tampilkan empty insight
- jika net cashflow lebih dari `20%` income, status `healthy`
- jika net cashflow positif tetapi kurang dari atau sama dengan `20%` income, status `thin`
- jika net cashflow negatif, status `warning`
- jika expense lebih dari `80%` income, tampilkan warning ringan walaupun masih positif

Visual:

- card compact
- reaction dibuat sebagai elemen kecil, bukan emoji besar
- tone warna mengikuti status: hijau untuk sehat, orange untuk tipis, merah untuk warning
- komentar harus pendek agar aman di mobile

### 2. Dashboard Donut Chart

Tujuan:

- memberi visual cepat tentang perbandingan income dan expense
- membuat dashboard terasa lebih modern
- memberi konteks langsung sebelum user membuka Reports

Rekomendasi chart:

- gunakan donut chart untuk `Income vs Expense` bulan berjalan
- jangan pakai category donut di dashboard sebagai default, karena category breakdown sudah lebih cocok di Reports
- jika user belum punya transaksi bulan ini, tampilkan empty donut sederhana

Data:

- income bulan ini
- expense bulan ini
- transfer tidak dihitung sebagai income atau expense
- periode mengikuti bulan berjalan

Visual:

- donut ukuran kecil sampai medium
- income warna hijau
- expense warna merah/orange
- center label berisi `Cashflow` atau nominal net
- legend maksimal 2 item
- tidak perlu interaksi kompleks di fase awal

Penempatan:

- idealnya masuk di dalam `Cashflow Insight Card`
- di mobile: komentar di atas, donut di bawah atau samping jika cukup ruang
- di desktop: komentar kiri, donut kanan

### 3. Calendar Activity

Tujuan:

- menunjukkan ritme aktivitas transaksi user selama bulan berjalan
- membantu user melihat apakah pencatatan sudah konsisten
- membuat dashboard terasa lebih hidup tanpa menambah terlalu banyak teks

Isi:

- kalender mini bulan berjalan
- tanggal dengan transaksi diberi marker
- ringkasan jumlah hari aktif
- ringkasan total transaksi bulan ini

Rules marker:

- tidak ada transaksi: kosong
- hanya income: marker hijau
- hanya expense: marker merah/orange
- income dan expense di hari yang sama: marker campuran atau warna netral
- transfer bisa memakai marker biru/netral jika nanti diperlukan

Versi awal:

- kalender visual saja
- klik tanggal membuka ringkasan transaksi harian
- tampilkan maksimal bulan berjalan

Versi lanjutan:

- tooltip/summary harian
- heat intensity berdasarkan total nominal atau jumlah transaksi

Visual:

- card compact
- grid 7 kolom
- touch target tetap nyaman
- label hari pendek: `S M T W T F S` atau versi Indonesia jika seluruh app sudah dilokalkan
- jangan terlalu ramai dengan angka nominal

### 4. Posisi Di Layout Dashboard

Urutan dashboard setelah upgrade:

1. Compact Header
2. Balance Hero
3. Cashflow Insight + Donut
4. Month Snapshot
5. Compact Quick Actions
6. Calendar Activity
7. Budget Overview
8. Goals Overview
9. Recent Transactions

Layout desktop:

- kolom kiri:
  - Balance Hero
  - Cashflow Insight + Donut
  - Budget Overview
- kolom kanan:
  - Month Snapshot
  - Quick Actions
  - Calendar Activity
  - Goals Overview
  - Recent Transactions

Layout mobile:

- Cashflow Insight tampil setelah Balance Hero
- donut boleh stack di bawah komentar
- Calendar Activity tampil setelah Quick Actions atau setelah Month Snapshot

### 5. Prinsip Batasan

- Dashboard tetap untuk insight cepat, bukan analisis detail.
- Reports tetap menjadi tempat category breakdown, biggest transactions, dan analisis lengkap.
- Chart di dashboard maksimal satu donut agar tidak terlalu ramai.
- Komentar cashflow harus berdasarkan rule yang transparan, bukan random.
- Empty state harus tetap friendly untuk user baru.
- Semua insight harus berasal dari spreadsheet user, tanpa data dummy.

- Disaat belum ada data transaksi apapun atau goals, atau budget, munculin gambar NoTransactionCat.png dengan kalimat dibawahnya, kamu belum ada Transaksaksi apapun

## Detail Section

### Compact Header

Isi:

- brand Purrney
- avatar user
- optional small status indicator

Perubahan:

- jangan terlalu tinggi
- tidak perlu banyak dekorasi

### Balance Hero

Isi:

- total balance
- income bulan ini
- expense bulan ini
- tanggal/periode

Tampilan:

- satu card utama
- angka total balance paling dominan
- income/expense sebagai sub-metric
- background boleh punya asset cat dengan opacity rendah, tapi jangan mengganggu angka

### Month Snapshot / Insight Strip

Isi:

- net cashflow
- transaction count
- budget usage highlight
- goal progress highlight

Tampilan:

- small metric chips/cards
- mobile 2 kolom
- desktop 4 kolom

### Compact Quick Actions

Isi:

- Add Transaction
- Wallets
- Budget
- Goals

Tampilan:

- icon button + label
- lebih kecil dari card konten
- target sentuh tetap minimal 44px

### Budget Overview

Isi:

- top 3 budget progress
- progress bar compact
- status over/near/safe

Tampilan:

- list compact
- tidak perlu horizontal card besar di desktop

### Goals Overview

Isi:

- top 3 active goals
- progress
- current/target

Tampilan:

- list compact atau small cards
- empty state tetap jelas

### Recent Transactions

Isi:

- 5 transaksi terbaru
- date
- description
- category/transfer badge
- amount

Tampilan:

- list clean
- amount align right
- no oversized icons

## Style Guidelines

- Gunakan palette existing, tapi lebih restrained.
- Jangan terlalu banyak orange dalam satu viewport.
- Gunakan `warm-cream` untuk panel utama.
- Gunakan white untuk form atau data-dense section.
- Radius card maksimal `rounded-lg`.
- Shadow ringan saja.
- Heading section ukuran konsisten.
- Jangan pakai hero-scale type di card kecil.
- Text harus truncate atau wrap dengan rapi.

## Desktop Layout Target

Desktop:

- max width 1200px sampai 1280px
- grid 2 kolom
- kiri lebih besar untuk balance dan budget
- kanan untuk goals, quick actions, recent transactions

Contoh:

- Left column:
  - Balance Hero
  - Month Snapshot
  - Budget Overview
- Right column:
  - Compact Quick Actions
  - Goals Overview
  - Recent Transactions

## Mobile Layout Target

Mobile:

1. Header
2. Balance Hero
3. Snapshot chips
4. Quick actions
5. Budget Overview
6. Goals Overview
7. Recent Transactions
8. Bottom navigation

## Acceptance Checklist

- [x] Header lebih compact.
- [x] Welcome card diringkas atau digabung dengan header/status.
- [x] Balance card menjadi fokus utama.
- [x] Quick Menu menjadi compact shortcuts.
- [x] Budget overview lebih mudah discan.
- [x] Goals overview lebih mudah discan.
- [x] Recent transactions lebih modern dan rapi.
- [x] Card radius dan shadow konsisten.
- [x] Spacing antar section konsisten.
- [x] Desktop layout terasa dirancang, bukan hanya dilebarkan.
- [x] Mobile tidak terasa terlalu penuh.
- [x] Cashflow Insight Card tampil.
- [x] Donut chart income vs expense tampil.
- [x] Calendar Activity tampil.
- [x] Calendar Activity bisa menampilkan transaksi per tanggal.
- [x] Empty state memakai `NoTransactionCat.png`.
- [x] Tidak ada text overflow.
- [x] Touch target tetap minimal 44px.
- [x] `npm run lint` sukses.
- [x] `npm run build` sukses.

## Roadmap Placement

Rekomendasi:

- eksekusi setelah Phase 10.5
- sebelum Phase 12 production readiness
- bisa dibuat sebagai `Phase 10.6: Dashboard Visual Polish`

Alasan:

- dashboard adalah first impression utama
- app sudah punya fitur inti
- polish dashboard akan membuat Purrney terasa lebih siap beta
