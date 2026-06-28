"use client"

import { CardDescription, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "../api/AuthContext";
import GoogleWorkspaceStatus from "./GoogleWorkspaceStatus";

const UserWelcome = () => {
  const { user, loading, error, signInWithGoogle, logOut } = useAuth();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="m-4 flex items-center border-none">
      <div className="flex w-full gap-3 sm:gap-4">
        <div className="hidden shrink-0 sm:block">
          <Image
            src="/assets/app-logo.png"
            width={70}
            height={70}
            alt="Purrney logo"
            className="h-auto w-16 rounded-2xl object-cover"
          />
        </div>
        <div className="relative w-full rounded-lg bg-warm-cream p-4 shadow-md">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="absolute -top-2 -right-1 text-deep-slate bg-white opacity-30 rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-gray-200"
          >
            x
          </button>

          {loading ? (
            <p className="text-sm text-deep-slate mb-2">Checking your session...</p>
          ) : !user ? (
            <>
              <p className="text-sm text-deep-slate mb-2">
                Please sign in to view your profile.
              </p>
              {error ? (
                <p className="mb-2 rounded-md bg-red-50 p-2 text-xs text-money-out">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Sign in with Google
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <CardTitle className="break-words text-lg text-deep-slate">
                Hello {user.displayName || "Guest"}
              </CardTitle>
              <button
                type="button"
                onClick={() => void logOut()}
                className="text-xs font-semibold text-soft-orange"
              >
                Sign out
              </button>
            </div>
          )}

          <CardDescription className="text-sm text-deep-slate">
            Here&apos;s a summary of your finances.
          </CardDescription>
          <GoogleWorkspaceStatus />
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;
