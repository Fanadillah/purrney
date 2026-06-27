import {
  GoogleAuthProvider,
  type UserCredential,
} from "firebase/auth";

export const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
] as const;

export type GoogleWorkspaceScope = (typeof GOOGLE_WORKSPACE_SCOPES)[number];

type GooglePrompt = "select_account" | "consent select_account";

export function createGoogleWorkspaceProvider(prompt: GooglePrompt) {
  const provider = new GoogleAuthProvider();

  GOOGLE_WORKSPACE_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });

  provider.setCustomParameters({ prompt });

  return provider;
}

export function getGoogleAccessToken(result: UserCredential) {
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return credential?.accessToken ?? null;
}

export function getGoogleAuthErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "auth/popup-closed-by-user") {
      return "Google permission was cancelled before it finished.";
    }

    if (error.code === "auth/popup-blocked") {
      return "Google sign in popup was blocked by the browser.";
    }

    if (error.code === "auth/cancelled-popup-request") {
      return "Another Google sign in popup is already open.";
    }
  }

  return "Google permission failed. Please try again.";
}
