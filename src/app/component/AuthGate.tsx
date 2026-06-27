"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "../api/AuthContext";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading, error, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-warm-cream p-5 text-center shadow-lg">
          <p className="font-semibold text-deep-slate">Loading your Purrney account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-warm-cream p-5 shadow-lg">
          <h1 className="text-2xl font-bold text-deep-slate">
            Sign in to <span className="text-soft-orange">Purrney</span>
          </h1>
          <p className="mt-2 text-sm text-deep-slate/70">
            Your wallet data will be connected to your own Google Spreadsheet.
          </p>
          {error ? (
            <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-money-out">{error}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="mt-4 w-full rounded-md bg-soft-orange px-4 py-3 font-semibold text-white shadow active:scale-95"
          >
            Sign in with Google
          </button>
          <Link href="/" className="mt-4 block text-center text-sm text-deep-slate/70">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
