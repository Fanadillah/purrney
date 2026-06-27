# Purrney Product Feature Checklist

Dokumen ini berisi daftar hal yang perlu dipikirkan dan dikerjakan agar Purrney siap menjadi web app pencatatan keuangan berbasis Google Spreadsheet per user, dengan Firebase untuk identitas dan registry.

## Goal Produk

Purrney adalah personal finance app yang:

- Login menggunakan Google melalui Firebase Auth.
- Membuat atau memakai Google Spreadsheet milik masing-masing user.
- Menyimpan data utama finance di spreadsheet user.
- Menyimpan metadata user dan `spreadsheetId` di Firestore.
- Nyaman dipakai di HP, tablet, dan laptop.
- Bisa di-install sebagai PWA.

## Arsitektur Data Dan Auth

- [ ] Gunakan Firebase Auth sebagai sumber identitas user.
- [ ] Tambahkan izin Google OAuth untuk akses Google Sheets dan Drive.
- [ ] Tentukan scope Google API seminimal mungkin.
- [ ] Simpan metadata user di Firestore.
- [ ] Simpan `spreadsheetId` user di Firestore.
- [ ] Cek apakah user sudah punya spreadsheet saat login.
- [ ] Buat spreadsheet baru otomatis kalau user belum punya spreadsheet.
- [ ] Buat sheet/tab default saat spreadsheet pertama kali dibuat.
- [ ] Simpan versi schema spreadsheet di sheet `settings`.
- [ ] Buat mekanisme migrasi kalau schema spreadsheet berubah.

## Struktur Spreadsheet

- [ ] Sheet `transactions` untuk transaksi.
- [ ] Sheet `accounts` untuk wallet, rekening, dan e-wallet.
- [ ] Sheet `categories` untuk kategori income dan expense.
- [ ] Sheet `budgets` untuk budget per periode.
- [ ] Sheet `goals` untuk target tabungan.
- [ ] Sheet `settings` untuk metadata spreadsheet.
- [ ] Pastikan nominal disimpan sebagai angka positif.
- [ ] Pastikan arah uang ditentukan dari `type`, bukan dari nominal negatif.
- [ ] Pastikan transfer antar wallet tidak dihitung sebagai income atau expense.

## Ketahanan Data Spreadsheet

- [ ] Validasi data saat membaca spreadsheet.
- [ ] Tahan terhadap row kosong.
- [ ] Tahan terhadap format tanggal yang salah.
- [ ] Tahan terhadap nominal yang bukan angka.
- [ ] Tahan terhadap kolom yang hilang.
- [ ] Tahan terhadap nama sheet yang berubah.
- [ ] Tahan terhadap duplicate id.
- [ ] Buat fitur repair spreadsheet.
- [ ] Buat fitur recreate missing sheets.
- [ ] Buat tombol buka spreadsheet di Google Sheets.

## Fitur Finance Utama

- [ ] Tambah transaksi income.
- [ ] Tambah transaksi expense.
- [ ] Transfer antar wallet.
- [ ] Edit transaksi.
- [ ] Hapus transaksi.
- [ ] Search transaksi.
- [ ] Filter transaksi berdasarkan tanggal.
- [ ] Filter transaksi berdasarkan akun.
- [ ] Filter transaksi berdasarkan kategori.
- [ ] Filter transaksi berdasarkan type.
- [ ] Tambah dan edit wallet.
- [ ] Nonaktifkan wallet tanpa menghapus histori.
- [ ] Tambah dan edit kategori.
- [ ] Budget per kategori.
- [ ] Budget per periode harian, mingguan, bulanan, atau custom.
- [ ] Goals atau target tabungan.
- [ ] Recurring transactions untuk gaji, tagihan, cicilan, dan subscription.
- [ ] Utang dan piutang.
- [ ] Notes di transaksi.
- [ ] Attachment atau foto struk sebagai fitur lanjutan.

## Dashboard Dan Report

- [ ] Total balance dari seluruh wallet aktif.
- [ ] Total income periode berjalan.
- [ ] Total expense periode berjalan.
- [ ] Recent transactions.
- [ ] Progress budget.
- [ ] Ringkasan per kategori.
- [ ] Ringkasan per wallet.
- [ ] Report bulanan.
- [ ] Grafik income vs expense.
- [ ] Grafik pengeluaran per kategori.
- [ ] Empty state untuk user baru.
- [ ] Empty state untuk belum ada transaksi.
- [ ] Empty state untuk belum ada wallet.
- [ ] Empty state untuk belum ada budget.

## PWA Dan Offline

- [ ] Tambahkan web app manifest.
- [ ] Tambahkan icon PWA berbagai ukuran.
- [ ] Tambahkan theme color dan background color.
- [ ] Pastikan app installable di Android, iOS, dan desktop.
- [ ] Tentukan strategi offline.
- [ ] Tentukan apakah user bisa input transaksi saat offline.
- [ ] Simpan draft transaksi lokal saat offline jika offline input didukung.
- [ ] Sync transaksi lokal ke Google Sheets saat online.
- [ ] Tampilkan status online atau offline.
- [ ] Tampilkan status sync.
- [ ] Tampilkan error sync yang bisa dimengerti user.

## Responsive Dan Device Friendly

- [ ] Mobile layout dengan bottom navigation.
- [ ] Tablet layout yang tidak terasa seperti mobile diperbesar.
- [ ] Desktop layout dengan sidebar atau top navigation.
- [ ] Dashboard desktop memakai grid yang lebih luas.
- [ ] Form transaksi nyaman dipakai di HP.
- [ ] Tombol dan input punya ukuran touch target yang cukup.
- [ ] Teks tidak saling tabrakan di layar kecil.
- [ ] Card dan chart punya batas lebar di layar besar.
- [ ] Pastikan asset image tampil benar di device density berbeda.

## Account Management

- [ ] Logout.
- [ ] Reconnect Google permission.
- [ ] Deteksi kalau permission Google dicabut.
- [ ] Deteksi kalau token expired.
- [ ] Deteksi kalau spreadsheet dihapus.
- [ ] Deteksi kalau spreadsheet tidak bisa diakses.
- [ ] Tampilkan spreadsheet aktif yang sedang dipakai.
- [ ] Reset atau unlink spreadsheet dengan konfirmasi.
- [ ] Pilih spreadsheet existing sebagai database user.

## Security Dan Privacy

- [ ] Jelaskan izin Google yang diminta saat onboarding.
- [ ] Hindari scope Google API yang terlalu luas.
- [ ] Jangan simpan data finance utama di Firestore kalau sumber utama adalah spreadsheet.
- [ ] Jangan expose secret di client.
- [ ] Pastikan env Firebase hanya memakai `NEXT_PUBLIC_` untuk config public.
- [ ] Pastikan operasi sensitif lewat API route jika butuh secret server.
- [ ] Tambahkan aturan Firestore security rules untuk metadata user.

## Error Recovery

- [ ] Error saat Google API gagal.
- [ ] Error saat quota limit.
- [ ] Error saat spreadsheet tidak ditemukan.
- [ ] Error saat permission ditolak.
- [ ] Error saat koneksi offline.
- [ ] Error saat schema spreadsheet tidak valid.
- [ ] Tombol retry.
- [ ] Tombol repair.
- [ ] Tombol reconnect account.

## Prioritas Implementasi Awal

1. Rapikan error lint dan struktur Next App Router.
2. Finalisasi schema spreadsheet.
3. Buat Firebase Auth flow.
4. Buat Google OAuth permission flow untuk Sheets dan Drive.
5. Buat service layer untuk spreadsheet user.
6. Buat auto-create spreadsheet dan default sheets.
7. Ganti dummy data dengan data dari spreadsheet.
8. Implement add transaction yang benar-benar menulis ke spreadsheet.
9. Rapikan responsive layout.
10. Tambahkan PWA basic.

