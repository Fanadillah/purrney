# Google OAuth Setup

Dokumen ini menjelaskan konfigurasi Google OAuth untuk Phase 3 Purrney.

## Tujuan

Purrney memakai Firebase Auth untuk mengenali user, lalu meminta Google Workspace permission agar app bisa membuat dan mengelola spreadsheet milik user.

Access token Google hanya disimpan di memory browser untuk sesi aktif. Token tidak disimpan di Firestore.

## Scope Yang Dipakai

Scope minimal untuk MVP:

```txt
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.file
```

Alasan:

- `spreadsheets`: membaca dan menulis isi spreadsheet Purrney.
- `drive.file`: membuat dan mengelola file Google Drive yang dibuat atau dipilih lewat app, tanpa meminta akses penuh ke seluruh Drive user.

Konstanta scope di kode:

[src/lib/googleWorkspaceAuth.ts](../src/lib/googleWorkspaceAuth.ts)

## OAuth Consent Screen

Checklist konfigurasi di Google Cloud Console:

- [X] Buka Google Cloud Console.
- [X] Pilih project yang sama dengan Firebase project Purrney.
- [X] Buka menu OAuth consent screen.
- [X] Pilih user type sesuai kebutuhan awal.
- [X] Isi app name: `Purrney`.
- [X] Isi user support email.
- [X] Isi developer contact email.
- [X] Tambahkan authorized domain jika nanti sudah deploy di Vercel.
- [X] Tambahkan scope `spreadsheets`.
- [X] Tambahkan scope `drive.file`.
- [X] Simpan konfigurasi.

## Test Users Untuk MVP

Selama app belum production, jalankan sebagai testing app dulu.

- [X] Tambahkan email developer sebagai test user.
- [X] Tambahkan email calon tester sebagai test user.
- [X] Pastikan user memakai email yang sama saat login di Purrney.

Catatan:

- User yang belum masuk daftar test users bisa gagal saat permission consent.
- Ini normal untuk tahap MVP.

## Authorized Domains

Untuk local development:

- Firebase Auth biasanya memakai domain local development yang didukung Firebase.

Untuk deploy Vercel:

- Tambahkan domain production Vercel ke Firebase authorized domains.
- Tambahkan domain production ke OAuth consent authorized domain jika diminta.

Contoh domain:

```txt
purrney.vercel.app
```

## Flow Di App

1. User klik sign in.
2. Firebase membuka Google popup.
3. Provider meminta scope Google Sheets dan Drive.
4. App menerima Firebase `UserCredential`.
5. App mengambil Google access token dari credential.
6. App menyimpan access token di memory state.
7. App membuat atau memperbarui registry user di Firestore.

File terkait:

- [src/app/api/AuthContext.tsx](../src/app/api/AuthContext.tsx)
- [src/lib/googleWorkspaceAuth.ts](../src/lib/googleWorkspaceAuth.ts)
- [src/lib/userRegistry.ts](../src/lib/userRegistry.ts)

## Reconnect Flow

Reconnect dipakai saat:

- User sudah login, tapi access token tidak tersedia setelah refresh page.
- Token dianggap expired oleh Google API.
- Permission pernah dicabut user.
- Google API mengembalikan error permission.

Di app, reconnect memanggil Google popup dengan prompt consent ulang.

## Handling Token Expired

Phase 3 menyiapkan function:

```ts
markGoogleWorkspaceTokenExpired()
```

Function ini akan:

- Menghapus access token dari memory.
- Mengubah permission status menjadi `expired`.
- Menampilkan pesan agar user reconnect.

Pemakaian detailnya akan dilakukan saat service Google Sheets/Drive dibuat di Phase 4 dan Phase 5.

## Status Permission Di UI

Status permission bisa:

- `unknown`: auth masih loading.
- `missing`: user login, tapi access token tidak tersedia.
- `granted`: access token tersedia untuk sesi aktif.
- `expired`: token pernah ada, tapi harus reconnect.

Komponen UI:

[src/app/component/GoogleWorkspaceStatus.tsx](../src/app/component/GoogleWorkspaceStatus.tsx)

