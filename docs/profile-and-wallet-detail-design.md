# Profile Settings And Wallet Detail Design

Dokumen ini menjelaskan rancangan untuk dua area yang belum matang:

- halaman Profile/Settings
- halaman Wallet Detail saat user klik salah satu wallet di `/accounts`

Tujuannya adalah membuat dua halaman ini punya fungsi jelas, bukan hanya halaman kosong atau form edit biasa.

## Profile / Settings Page

Route yang disarankan:

- `/settings`

Halaman ini menjadi pusat kontrol akun, koneksi spreadsheet, preferensi app, dan status device.

### Tujuan

User bisa:

- melihat akun Google yang sedang login
- memastikan spreadsheet sudah terhubung
- membuka spreadsheet langsung
- reconnect Google permission jika token hilang
- melihat preferensi dasar app
- sign out dengan jelas

### Section 1: User Card

Isi:

- foto Google user
- nama user
- email user
- status login
- tombol `Sign out`

Tampilan:

- card/panel sederhana di bagian atas
- avatar di kiri, informasi di kanan
- di mobile tetap satu baris jika cukup, atau stack jika sempit

Behavior:

- jika belum login, tampilkan state untuk login
- jika auth loading, tampilkan loading state ringan
- tombol sign out memanggil flow logout yang sudah ada

### Section 2: Spreadsheet Connection

Isi:

- status connected / needs reconnect / no spreadsheet
- `spreadsheetId`
- link buka spreadsheet
- tombol reconnect Google Sheets
- keterangan bahwa data disimpan di spreadsheet user

Tampilan:

- panel dengan status badge
- action button jelas:
  - `Open Spreadsheet`
  - `Reconnect`

Behavior:

- jika `registry.spreadsheetUrl` ada, tombol open spreadsheet mengarah ke URL itu
- jika tidak ada URL tapi ada `spreadsheetId`, pakai helper URL Google Sheets
- jika permission tidak granted, tampilkan tombol reconnect
- jika belum ada spreadsheet, tampilkan empty state pendek

### Section 3: App Preferences

Isi versi awal:

- default currency: `IDR`
- timezone: `Asia/Jakarta`
- schema version

Status versi awal:

- read-only dulu

Alasan:

- schema spreadsheet sudah punya `settings`
- update setting bisa dibuat nanti setelah rules dan UI preference lebih matang

Tampilan:

- list compact key/value
- jangan dibuat form dulu jika belum bisa disimpan

### Section 4: Data Management

Isi versi awal:

- tombol refresh/reload spreadsheet data jika tersedia
- tombol open spreadsheet
- catatan bahwa backup utama ada di Google Sheets user

Fitur masa depan:

- export data
- backup helper
- recovery jika spreadsheet dihapus
- reconnect spreadsheet manual

### Section 5: PWA / Device

Isi:

- status bahwa Purrney bisa di-install dari browser
- catatan offline:
  - app shell bisa kebuka offline
  - input offline belum aktif sampai Phase 11

Tampilan:

- panel info kecil
- tidak perlu deteksi installability kompleks di versi awal

### Section 6: Danger Zone

Isi versi awal:

- sign out

Fitur yang jangan dibuat dulu:

- delete account
- disconnect spreadsheet metadata
- delete spreadsheet

Alasan:

- perlu recovery flow sebelum destructive action masuk

### Layout

Mobile:

1. User Card
2. Spreadsheet Connection
3. App Preferences
4. Data Management
5. PWA / Device
6. Danger Zone

Desktop:

- max width 960px
- grid 2 kolom untuk section kecil
- User Card dan Spreadsheet Connection boleh full width

### Acceptance Checklist

- [ ] `/settings` memakai `AuthGate`.
- [ ] Menampilkan user Google.
- [ ] Menampilkan spreadsheet connection status.
- [ ] Bisa open spreadsheet.
- [ ] Bisa reconnect permission.
- [ ] Bisa sign out.
- [ ] Menampilkan app preferences read-only.
- [ ] Menampilkan info PWA/offline.
- [ ] Mobile nyaman.
- [ ] Desktop tidak melebar berlebihan.

## Wallet Detail Page

Route yang sudah ada:

- `/accounts/[id]`

Saat ini route ini lebih dekat ke edit wallet. Rekomendasi: ubah menjadi wallet detail dengan edit section di bawah.

### Tujuan

User bisa memahami kondisi satu wallet:

- saldo wallet saat ini
- saldo awal
- aktivitas bulan ini
- transaksi terbaru wallet tersebut
- transfer masuk dan keluar
- edit atau deactivate wallet

### Section 1: Wallet Header

Isi:

- nama wallet
- tipe wallet: `cash`, `bank`, atau `ewallet`
- status: active/inactive
- link balik ke `/accounts`
- tombol kecil `Edit`

Tampilan:

- header compact dengan icon wallet
- status badge di kanan atau bawah nama
- mobile tetap ringkas

### Section 2: Balance Summary

Isi:

- current balance
- opening balance
- total income ke wallet ini
- total expense dari wallet ini

Aturan hitung:

- current balance mengikuti formula existing:
  - `openingBalance + transaction in - transaction out`
- income/expense summary tidak menghitung transfer

Tampilan:

- current balance sebagai angka utama
- 3 metric kecil di bawah

### Section 3: Monthly Movement

Isi untuk bulan berjalan:

- income
- expense
- transfer in
- transfer out
- net movement

Aturan:

- income: transaksi `in` wallet ini tanpa `transferGroupId`
- expense: transaksi `out` wallet ini tanpa `transferGroupId`
- transfer in: transaksi `in` wallet ini dengan `transferGroupId`
- transfer out: transaksi `out` wallet ini dengan `transferGroupId`
- net movement: income - expense + transfer in - transfer out

Tampilan:

- grid 2 kolom di mobile
- grid 5 metric di desktop jika cukup

### Section 4: Quick Actions

Isi:

- `Add Income`
- `Add Expense`
- `Transfer`
- `Edit Wallet`

Behavior versi awal:

- tombol bisa mengarah ke `/addTransaction`
- prefill wallet/type bisa dibuat nanti jika route query belum didukung

Fitur masa depan:

- `/addTransaction?accountId=...&type=expense`
- `/addTransaction?fromAccountId=...&type=transfer`

### Section 5: Wallet Activity

Isi:

- daftar transaksi terbaru khusus wallet ini
- tanggal
- deskripsi
- kategori
- amount
- type
- label transfer jika transaksi transfer

Filter:

- `All`
- `Income`
- `Expense`
- `Transfer`

Aturan:

- filter `Income` tidak menampilkan transfer in
- filter `Expense` tidak menampilkan transfer out
- filter `Transfer` hanya transaksi dengan `transferGroupId`

Tampilan:

- list compact
- amount rata kanan
- warna:
  - income hijau
  - expense merah
  - transfer biru/netral

### Section 6: Edit Wallet

Isi:

- name
- kind
- opening balance
- active toggle
- save button

Behavior:

- edit tetap pakai pola append row baru dengan ID sama
- parser mengambil versi terakhir
- riwayat perubahan tetap ada di spreadsheet

Tampilan:

- bisa langsung di bawah activity
- nanti bisa dibuat collapsible, tapi versi awal boleh tampil biasa

### Section 7: Danger Action

Isi:

- deactivate wallet

Aturan:

- deactivate wallet tidak menghapus transaksi lama
- wallet inactive tidak muncul di pilihan transaksi baru
- wallet inactive tetap bisa dibaca untuk histori jika dibutuhkan

### Spreadsheet Info

Isi kecil di bagian bawah:

- wallet id
- created at
- updated at

Tampilan:

- teks kecil
- berguna saat debugging spreadsheet

### Layout

Mobile:

1. Wallet Header
2. Balance Summary
3. Monthly Movement
4. Quick Actions
5. Wallet Activity
6. Edit Wallet
7. Spreadsheet Info
8. Danger Action

Desktop:

- max width 960px sampai 1120px
- grid 2 kolom:
  - kiri: summary, movement, quick actions
  - kanan: activity
- edit wallet full width di bawah atau kanan bawah

### Acceptance Checklist

- [ ] `/accounts/[id]` tetap memakai `AuthGate`.
- [ ] Menampilkan wallet berdasarkan id dari spreadsheet.
- [ ] Menampilkan current balance.
- [ ] Menampilkan opening balance.
- [ ] Menampilkan monthly movement.
- [ ] Menampilkan transfer in/out terpisah.
- [ ] Menampilkan transaksi khusus wallet.
- [ ] Bisa filter wallet activity.
- [ ] Bisa edit wallet.
- [ ] Bisa deactivate wallet.
- [ ] Tidak memakai dummy data.
- [ ] Mobile nyaman.
- [ ] Desktop tidak melebar berlebihan.

## Catatan Implementasi

Sebaiknya buat helper baru:

- `src/lib/walletSummary.ts`

Isi helper:

- `createWalletSummary(data, dashboard, walletId, period)`
- `getWalletTransactions(data.transactions, walletId)`
- `calculateWalletMonthlyMovement(transactions, period)`

Dengan begitu `/accounts/[id]` tidak penuh rumus.

Untuk Profile/Settings, kemungkinan tidak perlu helper besar. Cukup memakai:

- `useAuth()`
- `useSpreadsheetDashboard()`
- `getSpreadsheetUrl()`

## Roadmap Placement

Rekomendasi penempatan:

- Wallet Detail: masuk lanjutan Phase 10 karena terkait polish UX setelah responsive.
- Profile/Settings: masuk Phase 10 atau Phase 12 awal karena terkait production readiness dan user control.

Jika ingin menjaga Phase 10 tetap hanya responsive, buat subphase:

- `Phase 10.5: Profile And Wallet Detail UX`
