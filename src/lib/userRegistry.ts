import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SPREADSHEET_SCHEMA_VERSION } from "./spreadsheetSchema";

export type UserRegistry = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  schemaVersion: string;
};

const usersCollection = "users";

export async function ensureUserRegistry(user: User): Promise<UserRegistry> {
  const userRef = doc(db, usersCollection, user.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists() ? snapshot.data() : null;

  const registry: UserRegistry = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    spreadsheetId:
      typeof existing?.spreadsheetId === "string" ? existing.spreadsheetId : null,
    spreadsheetUrl:
      typeof existing?.spreadsheetUrl === "string" ? existing.spreadsheetUrl : null,
    schemaVersion:
      typeof existing?.schemaVersion === "string"
        ? existing.schemaVersion
        : SPREADSHEET_SCHEMA_VERSION,
  };

  if (registry.spreadsheetId && !registry.spreadsheetUrl) {
    registry.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${registry.spreadsheetId}`;
  }

  await setDoc(
    userRef,
    {
      ...registry,
      updatedAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return registry;
}

export async function updateUserSpreadsheetRegistry({
  uid,
  spreadsheetId,
  spreadsheetUrl,
}: {
  uid: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
}) {
  const userRef = doc(db, usersCollection, uid);

  await setDoc(
    userRef,
    {
      spreadsheetId,
      spreadsheetUrl,
      schemaVersion: SPREADSHEET_SCHEMA_VERSION,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
