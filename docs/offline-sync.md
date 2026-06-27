# Offline Sync

Dokumen ini menjelaskan implementasi Phase 11 untuk offline sync Purrney.

## Scope Versi Awal

Offline input yang masuk scope:

- tambah transaksi income
- tambah transaksi expense
- transfer antar wallet

Belum masuk scope:

- tambah/edit wallet
- tambah/edit category
- tambah/edit budget
- tambah/edit goal

Alasan:

- transaksi adalah aktivitas harian paling penting saat koneksi buruk
- wallet/category/budget/goal lebih jarang dan lebih aman dilakukan online

## Storage

Pending write disimpan di `localStorage` browser dengan key:

- `purrney.pendingSpreadsheetWrites.v1`

Setiap pending item menyimpan:

- `uid`
- `spreadsheetId`
- jenis write: `transaction` atau `transfer`
- row spreadsheet final dengan `id` yang sudah dibuat
- `createdAt`
- jumlah `attempts`
- `lastError`

## Sync Rules

- Saat user submit transaksi dan Google Sheets gagal karena offline/network, data masuk pending queue.
- Saat browser online lagi, app mencoba sync otomatis.
- User juga bisa retry manual dari Add Transaction atau Settings.
- Jika Google token expired, user perlu reconnect permission.
- Jika sync sukses, item pending dihapus dari localStorage.
- Jika sync gagal, item tetap pending dan menyimpan error terakhir.

## Duplicate Protection

Risiko:

- request append ke Google Sheets sebenarnya berhasil, tapi browser menerima network error
- retry bisa mengirim row yang sama lagi

Mitigasi:

- pending item memakai transaction id yang sama saat retry
- parser transaksi dedupe berdasarkan `id`
- sync helper punya lock agar dua komponen tidak mengirim pending item yang sama bersamaan

Catatan:

- duplicate row fisik masih mungkin ada di spreadsheet jika kasus network race terjadi
- UI Purrney tidak menggandakan transaksi karena parser mengambil row terakhir untuk id yang sama

## UI

Status pending sync tampil di:

- halaman Add Transaction
- halaman Settings

Status yang ditampilkan:

- jumlah pending transaction
- pesan syncing/success/error
- tombol retry manual

## Future Improvement

Untuk versi berikutnya:

- pindah dari `localStorage` ke IndexedDB
- tampilkan detail daftar pending item
- beri tombol hapus pending item
- sync queue untuk wallet/category/budget/goal jika dibutuhkan
- conflict resolution yang lebih eksplisit
