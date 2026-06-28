"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../api/AuthContext";
import { GOOGLE_WORKSPACE_SCOPES } from "@/lib/googleWorkspaceAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  return (
    <main className="min-h-screen bg-app-background flex items-center justify-center p-4">
      <section className="w-full max-w-sm rounded-lg bg-warm-cream p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/app-logo.png"
            alt="Purrney logo"
            width={72}
            height={72}
            className="rounded-2xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-deep-slate">
              Purr<span className="text-soft-orange">ney</span>
            </h1>
            <p className="text-sm text-deep-slate/70">Sign in to continue</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-deep-slate/70">
          Purrney uses Firebase Auth to identify you and asks Google permission
          so it can create and update your own spreadsheet.
        </p>

        <div className="mt-4 rounded-md bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase text-deep-slate/60">
            Requested Google access
          </p>
          <ul className="mt-2 space-y-1 text-xs text-deep-slate/70">
            {GOOGLE_WORKSPACE_SCOPES.map((scope) => (
              <li key={scope}>{scope}</li>
            ))}
          </ul>
        </div>

        {error ? (
          <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-money-out">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={() => void signInWithGoogle()}
          className="mt-5 w-full rounded-md bg-soft-orange px-4 py-3 font-semibold text-white shadow disabled:opacity-60 active:scale-95"
        >
          {loading ? "Checking session..." : "Sign in with Google"}
        </button>
      </section>
    </main>
  );
}
