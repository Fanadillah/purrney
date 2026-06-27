# Spreadsheet Data Schema

Dokumen ini adalah kontrak data Purrney untuk Google Spreadsheet milik masing-masing user. Semua service Google Sheets harus mengikuti schema ini.

## Prinsip Utama

- Satu jenis data disimpan di satu sheet.
- Nama sheet memakai lowercase: `settings`, `accounts`, `categories`, `transactions`, `budgets`, `goals`.
- Header kolom memakai snake_case.
- Data di TypeScript boleh memakai camelCase, tapi saat masuk spreadsheet harus mengikuti header di dokumen ini.
- Nominal selalu angka positif.
- Arah uang ditentukan oleh kolom `type`, bukan nominal negatif.
- Mata uang default adalah `IDR`.
- Tanggal transaksi memakai format `YYYY-MM-DD`.
- Timestamp memakai ISO string, contoh `2026-01-01T00:00:00.000Z`.
- Relasi antar sheet memakai id atau value stabil.
- Saldo, income, expense, budget progress, dan goal progress dihitung dari data mentah.

## Schema Version

Versi schema awal:

```txt
1.0.0
```

Versi ini disimpan di sheet `settings` dengan key `schema_version`.

## Format ID

ID adalah string stabil, bukan angka incremental.

Contoh:

- Account: `acc_cash`, `acc_bca`
- Category: `cat_food`, `cat_income`
- Budget: `budget_food_2026_06`
- Goal: `goal_emergency_fund`
- Transaction: `tx_20260626_001`
- Transfer group: `trf_20260626_001`

Alasan memakai string:

- Lebih aman jika user edit spreadsheet manual.
- Lebih aman untuk offline sync.
- Lebih mudah dibaca saat debugging.
- Tidak bergantung pada urutan row spreadsheet.

## Sheet: settings

Berisi metadata spreadsheet dan preferensi dasar.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `key` | string | Ya | `schema_version` | Key unik setting |
| `value` | string | Ya | `1.0.0` | Semua value disimpan sebagai string |
| `value_type` | enum | Ya | `string` | `string`, `number`, `boolean`, atau `date` |
| `updated_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `note` | string | Tidak | `Current schema` | Catatan internal |

Default rows:

| `key` | `value` | `value_type` | `note` |
| --- | --- | --- | --- |
| `schema_version` | `1.0.0` | `string` | Current Purrney spreadsheet schema version |
| `currency` | `IDR` | `string` | Default currency for money values |
| `timezone` | `Asia/Jakarta` | `string` | Default timezone for date grouping |

## Sheet: accounts

Berisi dompet, rekening bank, dan e-wallet.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `id` | string | Ya | `acc_bca` | ID unik account |
| `name` | string | Ya | `BCA` | Nama yang tampil di UI |
| `kind` | enum | Ya | `bank` | `cash`, `bank`, atau `ewallet` |
| `opening_balance` | number | Ya | `1500000` | Saldo awal |
| `currency` | string | Ya | `IDR` | Mata uang account |
| `is_active` | boolean | Ya | `TRUE` | Account nonaktif tidak ditampilkan sebagai pilihan utama |
| `created_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `updated_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |

Default row:

| `id` | `name` | `kind` | `opening_balance` | `currency` | `is_active` |
| --- | --- | --- | --- | --- | --- |
| `acc_cash` | `Cash` | `cash` | `0` | `IDR` | `TRUE` |

## Sheet: categories

Berisi kategori income dan expense.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `id` | string | Ya | `cat_food` | ID unik kategori |
| `value` | string | Ya | `food` | Kode stabil yang dipakai transaksi |
| `label` | string | Ya | `Food` | Nama yang tampil di UI |
| `kind` | enum | Ya | `expense` | `income` atau `expense` |
| `color_class` | string | Ya | `bg-food` | Class warna UI |
| `is_active` | boolean | Ya | `TRUE` | Kategori nonaktif tidak tampil sebagai pilihan utama |
| `sort_order` | number | Ya | `20` | Urutan tampil |

Aturan:

- Category income dan expense dipisahkan oleh kolom `kind`.
- Form income hanya menampilkan category dengan `kind = income`.
- Form expense hanya menampilkan category dengan `kind = expense`.
- Transfer memakai `category_value = transfer`, tetapi tidak dihitung sebagai income atau expense.
- User boleh menambah dan mengubah category sendiri.
- Hapus category dilakukan sebagai deactivate (`is_active = false`), bukan menghapus row fisik, supaya transaksi lama tetap valid.

Default categories:

- `income`
- `salary`
- `freelance`
- `business`
- `investment`
- `food`
- `transport`
- `entertainment`
- `utilities`
- `shopping`
- `education`
- `health`
- `others`
- `transfer`

## Sheet: transactions

Berisi catatan uang masuk dan keluar.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `id` | string | Ya | `tx_20260626_001` | ID unik transaksi |
| `date` | date | Ya | `2026-06-26` | Format `YYYY-MM-DD` |
| `description` | string | Ya | `Lunch` | Keterangan transaksi |
| `type` | enum | Ya | `out` | `in` atau `out` |
| `account_id` | string | Ya | `acc_cash` | Mengarah ke `accounts.id` |
| `category_value` | string | Ya | `food` | Mengarah ke `categories.value` |
| `amount` | number | Ya | `25000` | Selalu positif |
| `currency` | string | Ya | `IDR` | Mata uang transaksi |
| `note` | string | Tidak | `optional` | Catatan tambahan |
| `transfer_group_id` | string | Tidak | `trf_20260626_001` | Diisi hanya untuk transfer |
| `created_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `updated_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |

Aturan transaksi:

- `type = in` menambah saldo account.
- `type = out` mengurangi saldo account.
- `amount` tidak boleh negatif.
- Income dan expense dashboard mengabaikan transaksi yang punya `transfer_group_id`.

## Aturan Transfer Antar Wallet

Transfer dibuat sebagai dua baris transaksi dengan `transfer_group_id` yang sama.

Contoh transfer dari Cash ke BCA sebesar Rp100.000:

| `id` | `type` | `account_id` | `category_value` | `amount` | `transfer_group_id` |
| --- | --- | --- | --- | --- | --- |
| `tx_20260626_001` | `out` | `acc_cash` | `transfer` | `100000` | `trf_20260626_001` |
| `tx_20260626_002` | `in` | `acc_bca` | `transfer` | `100000` | `trf_20260626_001` |

Catatan:

- Transfer memengaruhi saldo account.
- Transfer tidak dihitung sebagai income atau expense dashboard.
- Category `transfer` dibuat otomatis untuk spreadsheet baru.
- Spreadsheet lama yang belum punya category `transfer` tetap valid selama transaksi transfer punya `transfer_group_id`.

## Sheet: budgets

Berisi batas budget per kategori dan periode.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `id` | string | Ya | `budget_food_2026_06` | ID unik budget |
| `category_value` | string | Ya | `food` | Mengarah ke `categories.value` |
| `period_type` | enum | Ya | `monthly` | `daily`, `weekly`, `monthly`, `yearly`, atau `custom` |
| `period` | string | Ya | `2026-06` | Format mengikuti `period_type` |
| `amount_max` | number | Ya | `500000` | Batas budget |
| `is_active` | boolean | Ya | `TRUE` | Budget nonaktif tidak dihitung |
| `created_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `updated_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |

Default rows:

- Kosong untuk user baru.
- User bisa membuat budget setelah onboarding atau dari menu Budget.

## Sheet: goals

Berisi target tabungan atau tujuan finansial.

| Kolom | Tipe | Wajib | Contoh | Catatan |
| --- | --- | --- | --- | --- |
| `id` | string | Ya | `goal_emergency_fund` | ID unik goal |
| `name` | string | Ya | `Emergency Fund` | Nama goal |
| `target_amount` | number | Ya | `10000000` | Target nominal |
| `current_amount` | number | Ya | `1500000` | Progress manual awal |
| `account_id` | string | Tidak | `acc_bca` | Account terkait jika ada |
| `due_date` | date | Tidak | `2026-12-31` | Format `YYYY-MM-DD` |
| `is_active` | boolean | Ya | `TRUE` | Goal nonaktif tidak tampil utama |
| `created_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `updated_at` | datetime | Ya | `2026-01-01T00:00:00.000Z` | ISO string |
| `note` | string | Tidak | `optional` | Catatan tambahan |

Default rows:

- Kosong untuk user baru.

## Data Turunan Untuk UI

Data berikut tidak diketik manual ke spreadsheet:

- `accounts.balance`: `opening_balance + income - expense` per account.
- `totalBalance`: total saldo semua account aktif.
- `income`: total transaksi `in` dalam periode, kecuali transfer.
- `expense`: total transaksi `out` dalam periode, kecuali transfer.
- `recentTransactions`: transaksi terbaru dari sheet `transactions`.
- `progressData`: total expense per kategori dibandingkan budget aktif.
- `categories`: opsi dropdown dari sheet `categories`.
- `goalProgress`: `current_amount / target_amount`.

## Source Of Truth Di Kode

Konstanta schema untuk app ada di:

[src/lib/spreadsheetSchema.ts](../src/lib/spreadsheetSchema.ts)

File itu menyimpan:

- `SPREADSHEET_SCHEMA_VERSION`
- `SHEET_NAMES`
- `SHEET_HEADERS`
- TypeScript row types
- Default settings
- Default account
- Default categories
- Default empty rows untuk transactions, budgets, dan goals
