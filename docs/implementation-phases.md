# Purrney Implementation Phases

Dokumen ini berisi tahapan pengerjaan Purrney dari kondisi prototype menuju web app finance berbasis Google Spreadsheet per user, Firebase Auth, dan PWA.

## Phase 0: Stabilkan Project

Tujuan: memastikan project bisa dibangun, dirawat, dan dikembangkan tanpa error dasar.

- [x] Fix error lint.
- [x] Fix error TypeScript.
- [x] Fix struktur Next App Router.
- [x] Hapus nested `<html>` dan `<body>` dari route layout.
- [x] Rapikan metadata app.
- [x] Rapikan import yang tidak dipakai.
- [x] Betulkan text encoding yang rusak.
- [x] Betulkan path asset yang case-sensitive.
- [x] Pastikan `npm run lint` sukses.
- [x] Pastikan `npm run build` bisa diuji dengan aman.

Output phase:

- Project bersih dari error dasar.
- Struktur folder lebih siap untuk fitur Google Sheets.
- UI lama tetap jalan sebagai prototype.

## Phase 1: Finalisasi Schema Spreadsheet

Tujuan: mengunci format data sebelum app mulai baca/tulis ke Google Sheets.

- [x] Finalisasi sheet `settings`.
- [x] Finalisasi sheet `accounts`.
- [x] Finalisasi sheet `categories`.
- [x] Finalisasi sheet `transactions`.
- [x] Finalisasi sheet `budgets`.
- [x] Finalisasi sheet `goals`.
- [x] Tentukan format `id`.
- [x] Tentukan format tanggal.
- [x] Tentukan format amount.
- [x] Tentukan aturan transfer antar wallet.
- [x] Tentukan `schemaVersion`.
- [x] Buat default data untuk user baru.

Output phase:

- Schema spreadsheet stabil.
- App punya kontrak data yang jelas.
- Perubahan fitur berikutnya tidak asal menambah kolom.

## Phase 2: Firebase Auth Dan User Registry

Tujuan: Firebase dipakai untuk mengenali user dan menyimpan metadata kecil.

- [x] Rapikan Firebase config.
- [x] Buat login Google yang stabil.
- [x] Buat logout.
- [x] Buat loading state auth.
- [x] Buat protected route atau guard.
- [x] Buat struktur Firestore untuk user metadata.
- [x] Simpan `uid`, email, display name, photo URL.
- [x] Simpan `spreadsheetId` jika sudah ada.
- [x] Simpan `schemaVersion`.
- [x] Tambahkan error state jika auth gagal.

Output phase:

- User bisa login dan logout.
- App tahu user mana yang sedang aktif.
- Firestore siap menjadi registry spreadsheet user.

## Phase 3: Google Sheets Dan Drive Permission

Tujuan: app mendapat izin yang benar untuk membuat dan mengelola spreadsheet user.

- [x] Tentukan Google OAuth scope minimal.
- [x] Konfigurasi OAuth consent screen.
- [x] Siapkan mode test users untuk MVP.
- [x] Ambil Google access token setelah login.
- [x] Buat handling permission denied.
- [x] Buat handling token expired.
- [x] Buat reconnect Google permission.
- [x] Dokumentasikan scope yang diminta ke user.

Output phase:

- Purrney punya izin untuk akses Google Sheets dan Drive user.
- User memahami permission yang diminta.
- App bisa memulihkan kondisi permission bermasalah.

## Phase 4: Auto-create Spreadsheet

Tujuan: setiap user punya spreadsheet personal yang dibuat otomatis jika belum ada.

- [x] Saat login, cek Firestore untuk `spreadsheetId`.
- [x] Jika belum ada, buat spreadsheet baru di Google Drive user.
- [x] Buat semua sheet default.
- [x] Isi header setiap sheet.
- [x] Isi default categories.
- [x] Isi default settings.
- [x] Simpan `spreadsheetId` ke Firestore.
- [x] Simpan spreadsheet URL jika dibutuhkan.
- [x] Buat tombol buka spreadsheet.
- [x] Buat error handling jika create spreadsheet gagal.

Output phase:

- User baru otomatis punya spreadsheet.
- User lama memakai spreadsheet yang sudah tercatat.
- App tidak lagi bergantung penuh pada dummy data lokal.

## Phase 5: Service Layer Spreadsheet

Tujuan: UI tidak langsung berurusan dengan detail Google API.

- [x] Buat service untuk membaca spreadsheet user.
- [x] Buat service untuk membaca accounts.
- [x] Buat service untuk membaca categories.
- [x] Buat service untuk membaca transactions.
- [x] Buat service untuk membaca budgets.
- [x] Buat service untuk membaca goals.
- [x] Buat parser data mentah dari Sheets.
- [x] Buat validator data spreadsheet.
- [x] Buat mapper data untuk UI lama.
- [x] Buat centralized error handling.

Output phase:

- Data access rapi dan mudah dites.
- Komponen UI hanya menerima data siap pakai.
- Perubahan Google API tidak menyebar ke semua komponen.

## Phase 6: Read-only Dashboard Dari Spreadsheet

Tujuan: dashboard mulai memakai data spreadsheet asli, tapi belum menulis data.

- [x] Load accounts dari spreadsheet.
- [x] Load categories dari spreadsheet.
- [x] Load transactions dari spreadsheet.
- [x] Hitung total balance.
- [x] Hitung income periode berjalan.
- [x] Hitung expense periode berjalan.
- [x] Hitung recent transactions.
- [x] Hitung progress budget.
- [x] Tampilkan loading state.
- [x] Tampilkan empty state.
- [x] Tampilkan error state.
- [x] Hilangkan pemakaian dummy data dari homepage.
- [x] Hilangkan pemakaian dummy data dari halaman accounts.
- [x] Hilangkan pemakaian dummy data dari pilihan account/category di add transaction.

Output phase:

- Dashboard menampilkan data asli dari Google Spreadsheet.
- Perhitungan finance tidak lagi bergantung pada dummy data.
- User bisa melihat data spreadsheet di Purrney.
- Semua read view yang sudah ada memakai spreadsheet sebagai sumber data.

## Phase 7: Add Transaction Ke Spreadsheet

Tujuan: user bisa menambah transaksi dari Purrney dan data masuk ke Google Sheets.

- [x] Rapikan form add transaction.
- [x] Samakan type transaksi dengan schema.
- [x] Validasi amount.
- [x] Validasi date.
- [x] Validasi account.
- [x] Validasi category.
- [x] Tambahkan submit handler.
- [x] Append transaksi ke sheet `transactions`.
- [x] Refresh dashboard setelah save.
- [x] Tampilkan success state.
- [x] Tampilkan error state.
- [x] Fungsi Add Wallet

Output phase:

- Purrney bisa menulis transaksi baru ke spreadsheet.
- Data baru langsung muncul di dashboard.
- Form transaksi siap dipakai harian.

## Phase 8: Wallet, Budget, Dan Goals

Tujuan: fitur finance utama mulai lengkap setelah transaksi dasar stabil.

- [x] Tambah wallet.
- [x] Edit wallet.
- [x] Nonaktifkan wallet.
- [x] Tambah category.
- [x] Edit category.
- [x] Tambah budget.
- [x] Edit budget.
- [x] Tambah goal.
- [x] Edit goal.
- [x] Hitung progress goal.
- [x] Pastikan transfer antar wallet tidak dihitung sebagai income atau expense.
- [x] Section Goals Di Dashboard
- [x] Buat halaman Reports sesuai rancangan di `docs/reports-page-design.md`.

Output phase:

- User bisa mengelola struktur finansial sendiri.
- Budget dan goals mulai aktif sebagai fitur utama.
- Spreadsheet tetap menjadi sumber data utama.

## Phase 9: PWA Basic

Tujuan: Purrney bisa di-install di HP dan laptop.

- [x] Tambahkan manifest.
- [x] Tambahkan app icons.
- [x] Tambahkan theme color.
- [x] Tambahkan background color.
- [x] Tambahkan service worker.
- [x] Cache app shell.
- [x] Tampilkan offline fallback.
- [x] Pastikan installable di mobile.
- [x] Pastikan installable di desktop.

Output phase:

- Purrney bisa dipasang sebagai app.
- App tetap punya pengalaman dasar saat koneksi buruk.
- PWA siap diuji di device nyata.

## Phase 10: Responsive Polish

Tujuan: app nyaman di HP, tablet, dan laptop.

- [x] Mobile memakai bottom navigation.
- [x] Tablet memakai layout yang lebih lega.
- [x] Desktop memakai sidebar atau top navigation.
- [x] Dashboard desktop memakai grid.
- [x] Chart tidak terlalu besar di mobile.
- [x] Form nyaman untuk layar kecil.
- [x] Teks tidak overflow.
- [x] Card punya max width di desktop.
- [x] Touch target cukup besar.
- [X] Test beberapa viewport.

Output phase:

- App tidak terasa seperti mobile app yang dipaksa melebar di laptop.
- UI stabil di berbagai ukuran layar.
- Purrney lebih siap dipakai harian.

## Phase 10.5: Profile Dan Wallet Detail UX

Tujuan: halaman Settings/Profile dan Wallet Detail punya fungsi jelas setelah layout responsif dasar siap.

- [x] Buat halaman Settings/Profile sesuai `docs/profile-and-wallet-detail-design.md`.
- [x] Tampilkan user card.
- [x] Tampilkan status koneksi spreadsheet.
- [x] Tambahkan action open spreadsheet.
- [x] Tambahkan action reconnect permission.
- [x] Tampilkan app preferences read-only.
- [x] Tampilkan info PWA/offline.
- [x] Rapikan `/accounts/[id]` menjadi Wallet Detail.
- [x] Tampilkan balance summary wallet.
- [x] Tampilkan monthly movement wallet.
- [x] Tampilkan transfer in/out wallet.
- [x] Tampilkan wallet activity dengan filter.
- [x] Pertahankan edit dan deactivate wallet.

Output phase:

- Settings menjadi pusat kontrol akun dan spreadsheet.
- Wallet detail menjelaskan isi satu wallet, bukan hanya form edit.
- User bisa memahami aktivitas per wallet dengan lebih jelas.

## Phase 10.6: Dashboard Visual Polish

Tujuan: menaikkan kualitas visual dashboard dari prototype yang fungsional menjadi dashboard yang lebih clean, modern, dan siap beta.

- [x] Eksekusi rancangan di `docs/dashboard-visual-polish.md`.
- [x] Ringkas header dan welcome area.
- [x] Jadikan balance card sebagai fokus utama.
- [x] Ubah quick menu menjadi compact shortcuts.
- [x] Rapikan hierarchy section dashboard.
- [x] Samakan radius, shadow, dan spacing card.
- [x] Buat budget overview lebih mudah discan.
- [x] Buat goals overview lebih mudah discan.
- [x] Buat recent transactions lebih modern.
- [x] Pastikan desktop dashboard terasa benar-benar dirancang.
- [x] Pastikan mobile tidak terasa terlalu penuh.

Output phase:

- Dashboard terasa lebih premium dan tidak terlalu prototype.
- First impression app lebih kuat.
- Struktur visual lebih siap untuk beta user.

## Phase 11: Offline Sync Lanjutan

Tujuan: user bisa tetap input data saat offline jika fitur ini diputuskan masuk.

- [x] Tentukan apakah offline input masuk scope.
- [x] Simpan transaksi pending di local storage atau IndexedDB.
- [x] Tampilkan status pending sync.
- [x] Sync otomatis saat online.
- [x] Tangani konflik data.
- [x] Tangani duplicate submit.
- [x] Tampilkan hasil sync.
- [x] Buat retry manual.

Output phase:

- User bisa tetap mencatat transaksi saat koneksi jelek.
- App punya mekanisme sync yang jelas.
- Risiko data ganda lebih kecil.

## Phase 12: Production Readiness

Tujuan: app siap dipakai lebih luas dengan risiko lebih rendah.

- [x] Review Google OAuth consent.
- [x] Review Firebase security rules.
- [x] Review env production di Vercel.
- [x] Review error logging.
- [x] Review quota Google API.
- [x] Tambahkan halaman privacy policy.
- [x] Tambahkan halaman terms jika dibutuhkan.
- [x] Tambahkan recovery flow untuk spreadsheet rusak.
- [x] Tambahkan backup atau export helper.
- [ ] Uji dengan user baru dari nol.

Output phase:

- App lebih siap untuk dipakai di luar lingkungan development.
- Risiko auth, permission, dan data recovery lebih terkendali.
- Purrney siap masuk tahap beta.

## Phase 13: Goal Contribution Flow

Tujuan: user bisa memasukkan dana ke goals dengan flow yang jelas, dan fitur pengaturan data pendukung seperti categories lebih mudah ditemukan dari UI.

Masalah saat ini:

- Dana goal masih dimasukkan dengan edit manual field `Current amount`.
- Saldo wallet belum otomatis berkurang saat dana dialokasikan ke goal.
- Tidak ada riwayat kontribusi goal.
- User sulit tahu kapan dan dari wallet mana dana goal ditambahkan.

Scope fitur:

- [x] Tambahkan akses UI ke halaman Categories dari Settings.
- [x] Buat menu `Manage Categories` di halaman Settings.
- [x] Pastikan user bisa menemukan fitur tambah/edit category tanpa mengetik URL manual.
- [x] Buat action `Add Contribution` pada goal aktif.
- [x] Pilih goal tujuan.
- [x] Pilih wallet sumber dana.
- [x] Input nominal kontribusi.
- [x] Validasi nominal lebih dari `0`.
- [x] Validasi wallet sumber masih aktif.
- [x] Validasi saldo wallet cukup jika aturan saldo minus tidak diizinkan.
- [x] Tambahkan dana ke `currentAmount` goal.
- [x] Kurangi saldo efektif wallet melalui transaksi atau ledger yang konsisten.
- [x] Catat riwayat kontribusi goal.
- [x] Refresh dashboard, goals, wallet detail, dan reports setelah save.
- [x] Tampilkan success, loading, dan error state.
- [x] Pastikan offline sync mendukung kontribusi goal jika user sedang offline.
- [x] Tambahkan Page All Transaction, agar user dapat Liat semua Transaksi
- [x] Perkuat Fitur Offline, jika user offline, data terakhir di load akan tetap ada, dan dapat disimpan sementara di local device user, dan disaat reconnect, dia bakal langsung simpan di spreadsheet user

Status implementasi:

- Kontribusi goal memakai transaksi khusus `goal_contribution` di sheet `transactions`.
- Default category `Goal Contribution` ditambahkan untuk spreadsheet baru.
- Saat kontribusi disimpan, app append transaksi `out` dari wallet sumber dan append snapshot goal dengan `currentAmount` terbaru.
- Jika koneksi bermasalah, kontribusi masuk pending sync lokal dan akan dikirim saat online.
- Dashboard memakai cache data spreadsheet terakhir dari device agar tetap bisa dibaca ketika offline.
- Halaman `/transactions` menampilkan semua riwayat transaksi.

Pilihan desain data:

1. Simpan kontribusi sebagai transaksi khusus di sheet `transactions`.
   - type: `out`
   - category: kategori khusus seperti `goal_contribution`
   - accountId: wallet sumber
   - metadata/description berisi nama goal
   - goal `currentAmount` tetap perlu ikut naik

2. Tambah sheet baru `goal_contributions`.
   - lebih rapi untuk riwayat goal
   - butuh perubahan schema spreadsheet
   - butuh mapper dan migration schema

Rekomendasi awal:

- Untuk MVP, gunakan transaksi khusus agar saldo wallet otomatis ikut dihitung lewat mekanisme transaksi yang sudah ada.
- Tambahkan kategori default `goal_contribution` atau treatment khusus agar kontribusi goal tidak rancu dengan expense konsumtif.
- Untuk versi lanjutan, pertimbangkan sheet `goal_contributions` jika user butuh riwayat goal yang lebih detail.

UX yang disarankan:

- Categories:
  - masuk lewat Settings
  - gunakan menu `Manage Categories`
  - jangan masuk bottom navigation utama agar nav tetap sederhana
- Di halaman Goals, setiap goal aktif punya tombol `Add Contribution`.
- Modal/form contribution berisi:
  - goal tujuan
  - wallet sumber
  - nominal
  - tanggal
  - catatan opsional
- Setelah save:
  - progress goal naik
  - wallet detail menampilkan aktivitas kontribusi
  - recent transactions bisa menampilkan label `Goal Contribution`

Output phase:

- User bisa menemukan halaman Categories dari UI.
- User bisa menabung ke goal dengan flow yang natural.
- Saldo wallet dan progress goal tetap sinkron.
- Riwayat kontribusi goal bisa dilacak.
- Goals tidak lagi terasa seperti angka manual.

## Phase 14: Receipt OCR Flow

Tujuan: user bisa menambahkan transaksi expense dari foto struk dengan OCR lokal, lalu tetap melakukan review sebelum data disimpan ke spreadsheet.

Rancangan detail:

- Lihat `docs/receipt-ocr-flow.md`.

Scope fitur:

- [ ] Ubah icon transaksi di navigation agar membuka modal pilihan input.
- [ ] Tambahkan pilihan `Add Manual` yang masuk ke `/addTransaction`.
- [ ] Tambahkan pilihan `Scan Struk` yang membuka kamera atau file picker.
- [ ] Tambahkan preprocessing gambar sebelum OCR agar foto struk lebih mudah dibaca.
- [ ] Tambahkan preview gambar asli dan hasil preprocessing.
- [ ] Tambahkan crop atau perspective correction jika memungkinkan.
- [ ] Tambahkan resize, grayscale, contrast, noise reduction, dan threshold.
- [ ] Tambahkan opsi rotate manual untuk foto yang miring.
- [ ] Jalankan OCR lokal di browser.
- [ ] Uji konfigurasi Tesseract untuk struk, termasuk language `eng+ind`.
- [ ] Tampilkan hasil scan dalam review screen.
- [ ] OCR harus mencoba membaca semua item di dalam struk.
- [ ] Izinkan user edit merchant, tanggal, total, wallet, kategori, dan note.
- [ ] Izinkan user edit atau hapus item hasil scan yang salah.
- [ ] Tambahkan mode simpan sebagai satu transaksi total.
- [ ] Tambahkan mode simpan sebagai banyak transaksi per item.
- [ ] Gunakan kategori default `shopping` untuk item hasil scan.
- [ ] Izinkan user mengubah kategori per item.
- [ ] Tambahkan action untuk menerapkan satu kategori ke semua item.
- [ ] Masukkan daftar item hasil scan ke `note` jika user menyimpan satu transaksi total.
- [ ] Tetap gunakan pending sync jika Google Sheets sedang tidak bisa diakses.

Output phase:

- User punya dua jalur input transaksi: manual dan scan struk.
- Scan struk mempercepat pencatatan tanpa mengirim foto ke layanan OCR berbayar.
- User bisa menyimpan hasil scan sebagai total struk atau sebagai beberapa transaksi item.
- Hasil OCR tidak langsung dipercaya, tetapi menjadi draft yang bisa dikoreksi user.

## Milestone MVP Pertama

MVP pertama sebaiknya berhenti di Phase 7:

1. User login.
2. App meminta permission Google Sheets dan Drive.
3. App membuat spreadsheet jika belum ada.
4. Dashboard membaca data dari spreadsheet.
5. User bisa menambah transaksi.
6. Data transaksi masuk ke spreadsheet.

Setelah MVP ini stabil, baru lanjut ke budget, goals, PWA, responsive polish, dan offline sync.
