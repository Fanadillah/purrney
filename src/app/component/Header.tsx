import { useAuth } from "../api/AuthContext";
import Image from "next/image";

const Header = () => {
  const { user } = useAuth();

  const initial = user?.displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-warm-cream p-4 shadow-sm md:static md:bg-transparent md:px-6 md:py-5 md:shadow-none">
      <div>
        <h1 className="text-2xl font-bold text-deep-slate">Purr<span className="text-soft-orange">ney</span></h1>
        <p className="text-xs text-deep-slate/60">
          {user ? `Hi, ${user.displayName || "there"}` : "Personal finance dashboard"}
        </p>
      </div>

      {user?.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName || 'Profile'}
          width={40}
          height={40}
          unoptimized
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 bg-soft-orange rounded-full flex items-center justify-center text-white font-bold">
          {initial}
        </div>
      )}
    </header>
  );
};
  
  export default Header;
