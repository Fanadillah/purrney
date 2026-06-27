# Firebase Firestore Setup

Dokumen ini membantu debugging Firestore registry Purrney.

## Tujuan Firestore Di Purrney

Firestore hanya menyimpan metadata kecil per user:

- `uid`
- `email`
- `displayName`
- `photoURL`
- `spreadsheetId`
- `spreadsheetUrl`
- `schemaVersion`

Data transaksi utama tetap berada di Google Spreadsheet user.

## Collection

```txt
users/{uid}
```

## Rules Development

Untuk testing development:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Checklist Jika Save Metadata Timeout

- [X] Firestore Database sudah dibuat di Firebase Console.
- [X] Mode Firestore adalah Native mode.
- [X] Rules sudah publish.
- [X] User sudah login dengan Firebase Auth, bukan hanya Google OAuth.
- [X] Document path yang ditulis adalah `users/{uid}`.
- [ ] Browser tidak memblokir `firestore.googleapis.com`.
- [ ] Ad blocker, privacy extension, VPN, atau antivirus tidak memblokir Firestore WebChannel.
- [ ] Project ID di `.env.local` sama dengan project Firebase yang Firestore-nya aktif.

## Catatan Browser/Network

Firestore Web SDK memakai streaming/WebChannel. Di beberapa jaringan lokal, VPN, antivirus, atau browser extension, request ini bisa menggantung dan tidak langsung error.

Purrney mengaktifkan:

```ts
experimentalAutoDetectLongPolling: true
```

di [src/lib/firebase.ts](../src/lib/firebase.ts) agar Firestore lebih tahan terhadap network yang tidak cocok dengan streaming.

