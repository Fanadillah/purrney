# Production Readiness

Dokumen ini merangkum checklist Phase 12 sebelum Purrney dipakai beta atau production.

## Status Repo

Sudah tersedia:

- Privacy page: `/privacy`
- Terms page: `/terms`
- PWA manifest, icons, service worker, offline fallback
- Settings page dengan open spreadsheet, reconnect, refresh data, pending sync, dan backup helper
- Firestore rules template: `firestore.rules`
- Offline sync untuk transaksi dan transfer

## Google OAuth Consent Review

OAuth scopes yang dipakai:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

Alasan:

- `spreadsheets`: membaca dan menulis sheet Purrney user
- `drive.file`: membuat dan mengakses spreadsheet yang dibuat/dipilih lewat app

Checklist Google Cloud Console:

- [ ] App name memakai `Purrney`.
- [ ] Support email sudah benar.
- [ ] Authorized domain production sudah ditambahkan.
- [ ] Privacy policy URL mengarah ke `/privacy`.
- [ ] Terms URL mengarah ke `/terms`.
- [ ] Scope explanation menjelaskan Google Sheets dan Drive file access.
- [ ] Test users sudah disiapkan jika app masih testing mode.
- [ ] Publishing status dipilih sesuai target beta.

## Firebase Security Rules Review

Firestore hanya dipakai sebagai registry metadata user.

Collection:

- `users/{uid}`

Field utama:

- `uid`
- `email`
- `displayName`
- `photoURL`
- `spreadsheetId`
- `spreadsheetUrl`
- `schemaVersion`
- `createdAt`
- `updatedAt`

Rules target:

- user hanya boleh read/update dokumen miliknya sendiri
- tidak ada akses umum ke dokumen user lain
- delete dimatikan untuk MVP

Gunakan template:

- `firestore.rules`

Checklist Firebase Console:

- [ ] Deploy rules dari `firestore.rules`.
- [ ] Pastikan Firestore Database aktif di project production.
- [ ] Pastikan Google provider aktif di Firebase Auth.
- [ ] Tambahkan domain Vercel production ke Authorized domains.
- [ ] Tambahkan domain preview jika perlu testing preview deployment.

## Vercel Env Review

Environment variables yang dibutuhkan:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Checklist Vercel:

- [ ] Semua env production sudah diisi.
- [ ] Semua env preview sudah diisi jika preview deployment dipakai.
- [ ] Tidak ada secret private dimasukkan ke client env.
- [ ] Production domain sudah final.
- [ ] Production domain sudah disambungkan ke Firebase Auth authorized domain.
- [ ] Production domain sudah disambungkan ke Google OAuth authorized domain jika diminta.

## Error Logging Review

Status saat ini:

- error ditampilkan di UI untuk auth, spreadsheet, pending sync, dan Google API
- detail error masih memakai `console.error`

Rekomendasi sebelum public beta:

- pilih logger ringan seperti Sentry, Logtail, atau Vercel logging
- jangan log Google access token
- jangan log isi transaksi lengkap jika tidak perlu
- log cukup: error type, route, browser, timestamp, uid hash jika dibutuhkan

Checklist:

- [ ] Tentukan apakah MVP cukup dengan console/Vercel logs.
- [ ] Tentukan provider logging jika beta lebih luas.
- [ ] Pastikan token dan data finance tidak masuk log eksternal.

## Google API Quota Review

Area yang memakai Google APIs:

- create spreadsheet
- batch write default sheets
- read spreadsheet batch values
- append transaction
- append transfer
- append wallet/category/budget/goal rows

Risiko:

- terlalu sering reload dashboard akan menambah read request
- offline sync yang retry berulang bisa menambah append request
- multi-device user bisa membaca spreadsheet beberapa kali

Mitigasi yang sudah ada:

- read memakai batch get untuk semua sheet
- write append dilakukan per user action
- offline sync punya queue dan retry manual/online

Checklist Google Cloud Console:

- [ ] Cek quota Google Sheets API.
- [ ] Cek quota Google Drive API.
- [ ] Cek error rate setelah testing.
- [ ] Jika perlu, tambahkan debounce/manual refresh untuk read.
- [ ] Jika perlu, tambahkan exponential backoff untuk offline sync.

## Spreadsheet Recovery Flow

Jika spreadsheet hilang atau rusak:

1. User buka Google Drive Trash dan restore spreadsheet.
2. User buka Settings Purrney.
3. User klik reconnect jika permission expired.
4. User klik open spreadsheet untuk memastikan file bisa diakses.
5. Jika file benar-benar hilang, user perlu membuat spreadsheet baru dan restore data dari backup.

Status MVP:

- recovery flow masih berupa panduan dan backup helper
- reconnect-to-existing-spreadsheet manual belum tersedia

Future improvement:

- tombol replace spreadsheet metadata
- picker untuk memilih spreadsheet Purrney existing
- schema repair tool
- copy backup helper

## Backup / Export

Settings menyediakan:

- open source spreadsheet
- download XLSX via Google Sheets export URL

Checklist user:

- [ ] Download backup sebelum testing besar.
- [ ] Simpan backup di Drive/folder aman.
- [ ] Pastikan backup bisa dibuka.

## New User From Zero Test

Test wajib sebelum beta:

1. Buka production URL di browser private/incognito.
2. Login dengan Google test user baru.
3. Grant Google Sheets/Drive permission.
4. Pastikan spreadsheet otomatis dibuat.
5. Pastikan Firestore registry tersimpan.
6. Tambah wallet.
7. Tambah category income dan expense.
8. Tambah income.
9. Tambah expense.
10. Tambah transfer.
11. Cek dashboard.
12. Cek reports.
13. Cek wallet detail.
14. Cek backup link.
15. Refresh app dan reconnect permission jika dibutuhkan.

## Known MVP Limitations

- Google access token masih memory-only, jadi refresh app butuh reconnect untuk write/read spreadsheet.
- Offline sync hanya untuk transaksi dan transfer.
- Recovery existing spreadsheet belum ada UI penuh.
- Error logging eksternal belum dipasang.
- Legal copy masih MVP draft dan perlu review jika app dipakai publik luas.
