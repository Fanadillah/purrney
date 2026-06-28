import Link from "next/link";

const updatedAt = "June 27, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-app-background px-4 py-8 text-deep-slate">
      <article className="mx-auto max-w-3xl space-y-6 rounded-lg bg-warm-cream p-5 shadow-sm">
        <div>
          <Link href="/" className="text-sm font-semibold text-soft-orange">
            Back to Purrney
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Terms Of Use</h1>
          <p className="mt-1 text-sm text-deep-slate/60">Last updated: {updatedAt}</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Use Of The App</h2>
          <p>
            Purrney is a personal finance tracking app that helps you record and view financial
            activity stored in your own Google Spreadsheet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Your Responsibility</h2>
          <p>
            You are responsible for the accuracy of the data you enter, your Google account
            access, and your spreadsheet backup. Purrney is not financial, tax, legal, or
            investment advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Availability</h2>
          <p>
            Purrney depends on Firebase, Google Sheets, Google Drive, your browser, and your
            internet connection. Some features may be unavailable when those services are down or
            when permissions expire.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Data And Backup</h2>
          <p>
            Your main finance data is stored in your Google Spreadsheet. You should keep backups
            or exports if the data is important to you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">Changes</h2>
          <p>
            Purrney may change as the MVP evolves. Continued use means you accept the latest
            version of these terms.
          </p>
        </section>
      </article>
    </main>
  );
}
