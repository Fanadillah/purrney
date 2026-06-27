"use client";
import { Home, BarChart, Settings, BookOpenText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/" ? pathname === path : pathname.startsWith(path);
  const mobileNavItems = (path: string) =>
    `flex min-h-12 min-w-12 flex-col items-center justify-center text-deep-slate ${isActive(path) ? 'text-soft-orange' : ''}`;
  const desktopNavItems = (path: string) =>
    `flex h-14 w-14 items-center justify-center rounded-lg transition ${
      isActive(path)
        ? "bg-soft-orange text-white shadow-md"
        : "text-deep-slate hover:bg-soft-orange/10 hover:text-soft-orange"
    }`;

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
        <Link
          href="/addTransaction"
          className="absolute -top-6 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-full bg-soft-orange p-4 text-white shadow-lg"
        >
          <BookOpenText size={24} />
        </Link>
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
      <Link href="/addTransaction" className={desktopNavItems("/addTransaction")} aria-label="Add transaction">
        <BookOpenText size={24} />
      </Link>
      <Link href="/reports" className={desktopNavItems("/reports")} aria-label="Reports">
        <BarChart size={24} />
      </Link>
      <Link href="/settings" className={`${desktopNavItems("/settings")} mt-auto`} aria-label="Settings">
        <Settings size={24} />
      </Link>
    </nav>
  </>
)};

export default BottomNav;
