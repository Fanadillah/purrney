# Spreadsheet Service Layer

Dokumen ini menjelaskan service layer Phase 5. Tujuannya agar komponen UI tidak langsung memanggil Google Sheets API.

## File Utama

[src/lib/spreadsheetData.ts](../src/lib/spreadsheetData.ts)

## Tanggung Jawab

- Membaca semua sheet user dengan Google Sheets `values:batchGet`.
- Parsing row mentah dari Google Sheets menjadi TypeScript objects.
- Validasi header dan relasi dasar antar sheet.
- Mengembalikan warning jika spreadsheet bisa dibaca tetapi ada data yang mencurigakan.
- Menyediakan mapper ke bentuk data dashboard lama.
- Menyediakan error class terpusat untuk error Google API, timeout, missing sheet, invalid schema, dan invalid row.

## Service Read

Service utama:

```ts
readUserSpreadsheet({ accessToken, spreadsheetId })
```

Service per sheet:

```ts
readAccounts({ accessToken, spreadsheetId })
readCategories({ accessToken, spreadsheetId })
readTransactions({ accessToken, spreadsheetId })
readBudgets({ accessToken, spreadsheetId })
readGoals({ accessToken, spreadsheetId })
```

## Mapper UI

Untuk mengubah data spreadsheet ke bentuk dashboard lama:

```ts
mapSpreadsheetDataToDashboard(parsedSpreadsheetData)
```

Output:

- `accounts`
- `categories`
- `transactions`
- `progressData`

## Catatan Phase 6

Phase 5 hanya membuat service layer. Phase 6 akan mulai memakai service ini di UI dashboard agar data benar-benar dibaca dari spreadsheet user.

