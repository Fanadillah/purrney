"use client";
import { useState } from 'react';
import { Home, BarChart, Settings, BookOpenText, Wallet, Camera, Keyboard, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? pathname === path : pathname.startsWith(path);
  const isTransactionActive = pathname.startsWith("/addTransaction") || pathname.startsWith("/scanReceipt");
  const mobileNavItems = (path: string) =>
    `flex min-h-12 min-w-12 flex-col items-center justify-center text-deep-slate ${isActive(path) ? 'text-soft-orange' : ''}`;
  const desktopNavItems = (path: string) =>
    `flex h-14 w-14 items-center justify-center rounded-lg transition ${
      isActive(path)
        ? "bg-soft-orange text-white shadow-md"
        : "text-deep-slate hover:bg-soft-orange/10 hover:text-soft-orange"
    }`;
  const transactionDesktopClass =
    `flex h-14 w-14 items-center justify-center rounded-lg transition ${
      isTransactionActive
        ? "bg-soft-orange text-white shadow-md"
        : "text-deep-slate hover:bg-soft-orange/10 hover:text-soft-orange"
    }`;

  const openTransactionRoute = (path: string) => {
    setIsTransactionModalOpen(false);
    router.push(path);
  };

  return (
  <>
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around bg-warm-cream p-2 pb-6 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] md:hidden">
      <Link href="/" className={mobileNavItems("/")}>
        <Home size={24} />
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/accounts" className={mobileNavItems("/accounts")}>
        <Wallet size={24} />
        <span className="text-xs">Account</span>
      </Link>
      <div className="relative min-h-12 min-w-12">
        <button
          type="button"
          onClick={() => setIsTransactionModalOpen(true)}
          className={`absolute -top-6 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-full p-4 text-white shadow-lg ${
            isTransactionActive ? "bg-deep-slate" : "bg-soft-orange"
          }`}
          aria-label="Choose transaction input"
        >
          <BookOpenText size={24} />
        </button>
      </div>

      <Link href="/reports" className={mobileNavItems("/reports")}>
        <BarChart size={24} />
        <span className="text-xs">Reports</span>
      </Link>
      <Link href="/settings" className={mobileNavItems("/settings")}>
        <Settings size={24} />
        <span className="text-xs">Settings</span>
      </Link>
    </nav>

    <nav className="fixed bottom-0 left-0 top-0 z-40 hidden w-20 flex-col items-center gap-4 bg-warm-cream px-3 py-5 shadow-[8px_0_24px_rgba(15,23,42,0.08)] md:flex">
      <Link href="/" className="mb-4 text-xl font-bold text-deep-slate" aria-label="Purrney home">
        P<span className="text-soft-orange">.</span>
      </Link>
      <Link href="/" className={desktopNavItems("/")} aria-label="Home">
        <Home size={24} />
      </Link>
      <Link href="/accounts" className={desktopNavItems("/accounts")} aria-label="Accounts">
        <Wallet size={24} />
      </Link>
      <button
        type="button"
        onClick={() => setIsTransactionModalOpen(true)}
        className={transactionDesktopClass}
        aria-label="Choose transaction input"
      >
        <BookOpenText size={24} />
      </button>
      <Link href="/reports" className={desktopNavItems("/reports")} aria-label="Reports">
        <BarChart size={24} />
      </Link>
      <Link href="/settings" className={`${desktopNavItems("/settings")} mt-auto`} aria-label="Settings">
        <Settings size={24} />
      </Link>
    </nav>

    {isTransactionModalOpen ? (
      <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 md:items-center md:justify-center">
        <div className="w-full rounded-2xl bg-white p-4 shadow-2xl md:max-w-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-deep-slate">Add Transaction</h2>
              <p className="text-sm text-deep-slate/60">Choose how you want to record it.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsTransactionModalOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-cream text-deep-slate"
              aria-label="Close transaction input menu"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => openTransactionRoute("/addTransaction")}
              className="flex items-center gap-3 rounded-xl border border-orange-100 bg-warm-cream p-4 text-left transition hover:border-soft-orange"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-soft-orange shadow-sm">
                <Keyboard size={20} />
              </span>
              <span>
                <span className="block font-semibold text-deep-slate">Add Manual</span>
                <span className="block text-sm text-deep-slate/60">Input amount, date, category, and note yourself.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => openTransactionRoute("/scanReceipt")}
              className="flex items-center gap-3 rounded-xl border border-orange-100 bg-warm-cream p-4 text-left transition hover:border-soft-orange"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-soft-orange shadow-sm">
                <Camera size={20} />
              </span>
              <span>
                <span className="block font-semibold text-deep-slate">Scan Struk</span>
                <span className="block text-sm text-deep-slate/60">Use AI OCR, review items, then save.</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    ) : null}
  </>
)};

export default BottomNav;
