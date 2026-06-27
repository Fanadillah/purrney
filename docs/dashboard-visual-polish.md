# Dashboard Visual Polish

Dokumen ini menyimpan evaluasi dan rencana polish visual dashboard Purrney untuk dieksekusi nanti sebelum beta atau sebelum production readiness.

## Status Saat Ini

Dashboard sudah punya fondasi yang kuat secara fungsi:

- data sudah real dari Google Spreadsheet
- balance summary tampil
- income dan expense tampil
- quick menu tersedia
- budget progress tampil
- goals tampil
- recent transactions tampil
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
