"use client";
import { Home, BarChart, Settings, BookOpenText, Wallet } from 'lucide-react';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = (path: string) => `flex flex-col items-center text-deep-slate ${pathname === path ? 'text-soft-orange' : ''}`;
  return (
  <nav className="fixed bottom-0 left-0 right-0 bg-warm-cream flex justify-around p-2 pb-6 shadow-t-md">
    <a href="/" className={navItems("/")}>
      <Home size={24} />
      <span className="text-xs">Home</span>
    </a>
    <a href="/account" className={navItems("/account")}>
      <Wallet size={24} />
      <span className="text-xs">Account</span>
    </a>
    <div className="relative">
      <a
        href="/addTransaction"
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 p-4 rounded-full bg-soft-orange flex flex-col items-center text-white shadow-lg"
      >
        <BookOpenText size={24} />
      </a>
    </div>

    <a href="#" className={navItems("/reports")}>
      <BarChart size={24} />
      <span className="text-xs">Reports</span>
    </a>
    <a href="#" className="flex flex-col items-center text-deep-slate">
      <Settings size={24} />
      <span className="text-xs">Settings</span>
    </a>
  </nav>
)};

export default BottomNav;
