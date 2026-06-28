# Vercel Production Environment

Tambahkan env berikut di Vercel Project Settings.

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Catatan:

- Semua variable ini bersifat public Firebase web config.
- Jangan menambahkan private service account ke client env.
- Setelah env production diisi, redeploy project.
- Tambahkan domain Vercel ke Firebase Auth Authorized domains.
- Tambahkan domain production ke Google OAuth consent jika diminta.
