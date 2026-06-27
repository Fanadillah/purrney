# Reports Page Design

Dokumen ini menjelaskan rancangan halaman `Reports` untuk Purrney sebelum masuk implementasi. Fokus versi pertama adalah laporan yang simpel, modern, mudah dibaca di HP, dan tetap memakai Google Spreadsheet sebagai sumber data utama.

## Tujuan Halaman

Halaman reports membantu user memahami pola uangnya, bukan hanya melihat daftar transaksi. User harus bisa menjawab beberapa pertanyaan cepat:

- Bulan ini uang masuk, keluar, dan sisa cashflow berapa?
- Kategori expense terbesar apa?
- Income paling besar dari kategori apa?
- Wallet mana yang saldo atau aktivitasnya paling dominan?
- Transaksi terbesar bulan ini apa saja?
- Apakah transfer antar wallet memengaruhi laporan income dan expense?

## Prinsip Desain

Tampilan harus terasa lebih simpel dari dashboard, tapi lebih analitis.

- Gunakan layout satu kolom di mobile.
- Gunakan grid 2 kolom untuk tablet dan desktop jika ruang cukup.
- Jangan pakai terlalu banyak dekorasi.
- Pakai background app yang sama: `bg-app-background`.
- Gunakan panel putih atau `bg-warm-cream` dengan radius kecil sampai sedang.
- Hindari card yang terlalu besar.
- Angka utama harus mudah discan.
- Donut chart dipakai untuk komposisi data utama agar halaman terasa modern.
- Chart tetap harus ditemani list angka supaya mudah dibaca.
- Transfer boleh tampil di list transaksi, tapi tidak boleh masuk hitungan income dan expense.

## Data Source

Reports membaca data dari hook yang sama dengan dashboard:

- `useSpreadsheetDashboard()`
- `dashboard.accounts`
- `dashboard.transactions`
- `dashboard.categories`
- `sourceData.transactions`
- `sourceData.categories`
- `sourceData.accounts`

Tidak boleh pakai dummy data.

## Filter Utama

### Section: Period Filter

Lokasi: paling atas setelah header.

Isi:

- Input/select bulan dengan format `YYYY-MM`.
- Default ke bulan berjalan.
- Tombol kecil `This Month` untuk balik ke bulan sekarang.

Behavior:

- Semua section reports mengikuti period yang dipilih.
- Transaksi difilter dengan `transaction.date.startsWith(selectedPeriod)`.
- Transfer tetap bisa muncul di list transaksi, tapi dikecualikan dari income, expense, category breakdown, dan net cashflow.

Tampilan:

- Satu bar horizontal.
- Di mobile, input mengambil lebar penuh.
- Di desktop, input tetap compact.

## Section 1: Monthly Snapshot

Tujuan: ringkasan cepat kondisi bulan terpilih.

Isi metric:

- Total Income
- Total Expense
- Net Cashflow
- Total Transactions

Aturan hitung:

- Income: transaksi `type === "in"` tanpa `transferGroupId`.
- Expense: transaksi `type === "out"` tanpa `transferGroupId`.
- Net Cashflow: `income - expense`.
- Total Transactions: jumlah transaksi pada bulan tersebut, termasuk transfer.

Tampilan:

- 4 metric card kecil.
- Mobile: grid 2 kolom.
- Desktop: grid 4 kolom.
- Income pakai aksen hijau.
- Expense pakai aksen merah.
- Net cashflow pakai warna netral, hijau jika positif, merah jika negatif.
- Total transactions pakai warna netral.

## Section 2: Income vs Expense

Tujuan: membandingkan uang masuk dan keluar secara visual.

Isi:

- Bar horizontal income.
- Bar horizontal expense.
- Label nominal di kanan.
- Indikator selisih/net cashflow.

Aturan:

- Transfer tidak dihitung.
- Jika income dan expense sama-sama 0, tampilkan empty state pendek.

Tampilan:

- Satu panel sederhana.
- Tidak perlu chart library untuk versi awal.
- Gunakan CSS bar dengan width percentage.
- Scale bar berdasarkan nilai terbesar antara income dan expense.

## Section 3: Expense By Category

Tujuan: menunjukkan kategori pengeluaran terbesar.

Isi:

- Donut chart komposisi expense per kategori.
- List kategori expense.
- Nominal total per kategori.
- Persentase dari total expense.
- Legend/list kecil per kategori.

Aturan:

- Hanya transaksi `out`.
- Transfer dikecualikan.
- Dikelompokkan berdasarkan `categoryValue`.
- Label kategori diambil dari `sourceData.categories`.
- Urutkan dari nominal terbesar.
- Batasi awal ke top 5 kategori.

Empty state:

- Jika belum ada expense di bulan itu, tampilkan: `No expense data for this period.`

Tampilan:

- Donut chart menjadi visual utama section.
- Di bawah chart ada list dense, bukan card besar satu per satu.
- Tiap item terdiri dari nama kategori, nominal, dan persentase.
- Warna slice boleh memakai mapping dari kategori jika tersedia.
- Jika chart library belum dipasang, gunakan CSS/SVG donut sederhana dulu.

## Section 4: Income By Category

Tujuan: menunjukkan sumber pemasukan terbesar.

Isi:

- Donut chart komposisi income per kategori jika kategori income lebih dari satu.
- List kategori income.
- Nominal total per kategori.
- Persentase dari total income.

Aturan:

- Hanya transaksi `in`.
- Transfer dikecualikan.
- Dikelompokkan berdasarkan `categoryValue`.
- Urutkan dari nominal terbesar.

Tampilan:

- Lebih compact dari Expense By Category.
- Jika hanya ada satu kategori income, donut boleh diganti ring kecil atau list biasa.
- Jika hanya ada satu kategori `Income`, tetap tampil.
- Jika kosong, tampilkan empty state ringan.

## Section 5: Wallet Breakdown

Tujuan: melihat distribusi saldo antar wallet aktif.

Isi:

- Donut chart distribusi saldo wallet.
- Nama wallet.
- Saldo wallet.
- Persentase kontribusi dari total balance.
- Legend/list wallet.

Aturan:

- Gunakan `dashboard.accounts` karena saldo sudah dihitung dari opening balance dan transaksi.
- Hanya wallet aktif yang tampil.
- Jika total balance 0, percentage semua 0.

Tampilan:

- Donut chart di bagian atas panel.
- Panel list compact di bawah chart.
- Wallet dengan saldo terbesar di atas.
- Di mobile tetap mudah dibaca tanpa tabel lebar.

## Section 6: Biggest Transactions

Tujuan: user bisa cepat melihat transaksi paling berdampak di bulan tersebut.

Isi:

- Top 5 transaksi nominal terbesar.
- Description.
- Date.
- Category.
- Amount.
- Type.

Aturan:

- Ambil transaksi dari bulan terpilih.
- Transfer boleh tampil, tapi beri label `Transfer`.
- Urutkan berdasarkan `amount` terbesar.
- Untuk transfer, tampilkan sebagai transaksi biasa tapi warna netral atau biru.

Tampilan:

- List sederhana.
- Amount rata kanan.
- Income hijau, expense merah, transfer netral/biru.

## Section 7: Budget Watch

Tujuan: memberi konteks budget untuk bulan terpilih.

Isi:

- Budget aktif untuk period yang sesuai.
- Amount spent.
- Amount max.
- Persentase penggunaan.
- Status: `Safe`, `Near Limit`, atau `Over`.

Aturan:

- Gunakan budget dari spreadsheet.
- Expense transfer dikecualikan.
- `Safe`: progress kurang dari 75%.
- `Near Limit`: progress 75% sampai 99%.
- `Over`: progress 100% atau lebih.

Tampilan:

- Bisa reuse pola dari `ProgressBar`, tapi lebih compact.
- Tampilkan maksimal 5 budget paling tinggi progress-nya.

## Section 8: Empty, Loading, Dan Error State

Reports harus punya state yang jelas:

- Loading: tampilkan skeleton/panel teks `Loading reports from your spreadsheet...`
- Needs reconnect: tampilkan tombol reconnect Google Sheets.
- No spreadsheet: tampilkan pesan spreadsheet belum siap.
- Error: tampilkan error dari service.
- Empty period: tampilkan pesan bahwa belum ada transaksi pada bulan terpilih.

## Layout Mobile

Urutan mobile:

1. Header Reports
2. Period Filter
3. Monthly Snapshot
4. Income vs Expense
5. Expense By Category dengan donut chart
6. Budget Watch
7. Wallet Breakdown dengan donut chart
8. Income By Category dengan donut chart/list compact
9. Biggest Transactions
10. Bottom Navigation

Alasan urutan:

- User biasanya peduli expense dan budget lebih dulu.
- Wallet dan income tetap penting, tapi bukan hal pertama setelah snapshot.

## Layout Tablet/Desktop

Gunakan container dengan max width nyaman.

Susunan:

- Header dan Period Filter full width.
- Monthly Snapshot full width.
- Grid 2 kolom:
  - kiri: Income vs Expense, Expense By Category, Budget Watch
  - kanan: Wallet Breakdown, Income By Category, Biggest Transactions

## Visual Style

Rekomendasi style:

- Header tetap mirip halaman lain, tapi lebih clean.
- Judul: `Reports`
- Subtitle kecil: `Monthly insight from your spreadsheet`
- Panel radius: `rounded-md` atau `rounded-lg`.
- Shadow ringan: `shadow-md`.
- Padding panel: `p-3` sampai `p-4`.
- Jangan gunakan hero besar.
- Gunakan donut chart untuk komposisi kategori dan wallet.
- Jangan gunakan chart kompleks lain dulu.
- Gunakan icon lucide secukupnya:
  - `Calendar` untuk period.
  - `TrendingUp` untuk income.
  - `TrendingDown` untuk expense.
  - `Wallet` untuk wallet.
  - `Tags` untuk category.
  - `ReceiptText` untuk transactions.

## Calculation Rules

Rules ini wajib konsisten dengan dashboard:

- Transfer punya `transferGroupId`.
- Transfer tidak masuk income.
- Transfer tidak masuk expense.
- Transfer tidak masuk category breakdown.
- Transfer tidak masuk budget usage.
- Transfer boleh tampil di biggest transactions dengan label transfer.
- Semua amount dianggap number dari parser spreadsheet.
- Date filter memakai prefix `YYYY-MM`.

## Minimum Implementation Scope

Versi pertama halaman reports cukup mencakup:

- Period Filter
- Monthly Snapshot
- Income vs Expense
- Expense By Category dengan donut chart
- Wallet Breakdown dengan donut chart
- Biggest Transactions
- State loading/error/reconnect/no spreadsheet

Section yang boleh masuk setelah versi pertama:

- Income By Category
- Budget Watch

Alasan:

- Versi pertama sudah membuat bottom nav Reports terasa hidup.
- Section tambahan bisa menyusul tanpa mengubah schema.

## Acceptance Checklist

- [ ] Reports page membaca data dari spreadsheet.
- [ ] Tidak ada dummy data.
- [ ] Bisa filter bulan.
- [ ] Income dan expense tidak menghitung transfer.
- [ ] Monthly snapshot tampil.
- [ ] Expense breakdown tampil dengan donut chart.
- [ ] Wallet breakdown tampil dengan donut chart.
- [ ] Biggest transactions tampil.
- [ ] Empty state tampil saat belum ada transaksi.
- [ ] Loading state tampil saat data dibaca.
- [ ] Error dan reconnect state tampil.
- [ ] Mobile layout nyaman.
- [ ] Desktop layout tidak terlalu melebar.
- [ ] `npm run lint` sukses.
- [ ] `npm run build` sukses.

## Catatan Implementasi

Sebaiknya buat helper perhitungan di file terpisah, misalnya:

- `src/lib/reportsSummary.ts`

Isi helper:

- `createReportsSummary(data, period)`
- `groupTransactionsByCategory(transactions, categories)`
- `getBiggestTransactions(transactions)`
- `calculateWalletBreakdown(accounts)`

Dengan begitu halaman `/reports` tetap fokus ke UI, bukan penuh rumus.
