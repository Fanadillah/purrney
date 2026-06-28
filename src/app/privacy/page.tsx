import Link from "next/link";

const updatedAt = "June 27, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-app-background px-4 py-8 text-deep-slate">
      <article className="mx-auto max-w-3xl space-y-6 rounded-lg bg-warm-cream p-5 shadow-sm">
        <div>
          <Link href="/" className="text-sm font-semibold text-soft-orange">
            Back to Purrney
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-1 text-sm text-deep-slate/60">Last updated: {updatedAt}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">What Purrney Stores</h2>
          <p>
            Purrney stores your finance data in a Google Spreadsheet owned by your Google
            account. The app uses Firebase only to identify your account and remember small
            metadata, such as your spreadsheet ID and schema version.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Google Access</h2>
          <p>
            Purrney asks for Google Sheets and Google Drive file access so it can create and
            update your Purrney spreadsheet. Google access tokens are kept in browser memory and
            are cleared when you sign out or refresh the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Local Device Data</h2>
          <p>
            If you enter transactions while offline, Purrney may store pending transactions in
            your browser local storage until they can be synced to your spreadsheet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Data Control</h2>
          <p>
            Your spreadsheet stays in your Google Drive. You can open, copy, export, or delete it
            from Google Drive. If the spreadsheet is deleted, Purrney may need a new spreadsheet to
            continue syncing data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Third-Party Services</h2>
          <p>
            Purrney uses Firebase Authentication, Firestore, Google Sheets API, and Google Drive
            API. These services are provided by Google and are subject to Google&apos;s own terms and
            privacy practices.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Contact</h2>
          <p>
            For MVP testing, contact the Purrney developer or project owner who invited you to use
            the app.
          </p>
        </section>
      </article>
    </main>
  );
}
