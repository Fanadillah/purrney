'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User, UserCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { ensureUserRegistry, updateUserSpreadsheetRegistry, type UserRegistry } from '../../lib/userRegistry';
import {
    createGoogleWorkspaceProvider,
    getGoogleAccessToken,
    getGoogleAuthErrorMessage,
} from '../../lib/googleWorkspaceAuth';
import { createUserSpreadsheet, getSpreadsheetUrl, type SpreadsheetBootstrapStep } from '../../lib/userSpreadsheet';
import { SPREADSHEET_SCHEMA_VERSION } from '../../lib/spreadsheetSchema';

type GoogleWorkspacePermissionStatus = "unknown" | "granted" | "missing" | "expired";
const firestoreSaveTimeoutMs = 20000;

type AuthContextType = 
    | {
        user: User | null;
        registry: UserRegistry | null;
        googleAccessToken: string | null;
        googleWorkspacePermissionStatus: GoogleWorkspacePermissionStatus;
        spreadsheetBootstrapping: boolean;
        spreadsheetBootstrapStep: SpreadsheetBootstrapStep | null;
        spreadsheetError: string | null;
        loading: boolean;
        error: string | null;
        signInWithGoogle: () => Promise<UserCredential>;
        reconnectGoogleWorkspace: () => Promise<UserCredential>;
        ensureUserSpreadsheet: () => Promise<void>;
        markGoogleWorkspaceTokenExpired: () => void;
        logOut: () => Promise<void>;
        clearError: () => void;
}
| null;

const AuthContext = createContext<AuthContextType>(null);

function withTimeout<T>({
    promise,
    timeoutMs,
    errorMessage,
}: {
    promise: Promise<T>;
    timeoutMs: number;
    errorMessage: string;
}) {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        }),
    ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [ user, setUser ] = useState<User | null>(null);
    const [ registry, setRegistry ] = useState<UserRegistry | null>(null);
    const [ googleAccessToken, setGoogleAccessToken ] = useState<string | null>(null);
    const [ googleWorkspacePermissionStatus, setGoogleWorkspacePermissionStatus ] = useState<GoogleWorkspacePermissionStatus>("unknown");
    const [ spreadsheetBootstrapping, setSpreadsheetBootstrapping ] = useState(false);
    const [ spreadsheetBootstrapStep, setSpreadsheetBootstrapStep ] = useState<SpreadsheetBootstrapStep | null>(null);
    const [ spreadsheetError, setSpreadsheetError ] = useState<string | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (!active) return;

            setUser(u);

            if (!u) {
                setRegistry(null);
                setGoogleAccessToken(null);
                setGoogleWorkspacePermissionStatus("missing");
                setSpreadsheetBootstrapping(false);
                setSpreadsheetBootstrapStep(null);
                setSpreadsheetError(null);
                setLoading(false);
                return;
            }

            try {
                const userRegistry = await ensureUserRegistry(u);
                if (active) {
                    setRegistry(userRegistry);
                    setGoogleWorkspacePermissionStatus((currentStatus) =>
                        currentStatus === "granted" ? currentStatus : "missing"
                    );
                    setError(null);
                }
            } catch (registryError) {
                console.error("Error syncing user registry:", registryError);
                if (active) {
                    setRegistry(null);
                    setError("Failed to sync your Purrney account data.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = createGoogleWorkspaceProvider("select_account");

        try {
            setError(null);
            setSpreadsheetError(null);
            const credential = await signInWithPopup(auth, provider);
            const accessToken = getGoogleAccessToken(credential);

            setGoogleAccessToken(accessToken);
            setGoogleWorkspacePermissionStatus(accessToken ? "granted" : "missing");

            return credential;
        } catch (signInError) {
            console.error("Error signing in with Google:", signInError);
            setGoogleAccessToken(null);
            setGoogleWorkspacePermissionStatus("missing");
            setError(getGoogleAuthErrorMessage(signInError));
            throw signInError;
        }
    };

    const reconnectGoogleWorkspace = async () => {
        const provider = createGoogleWorkspaceProvider("consent select_account");

        try {
            setError(null);
            setSpreadsheetError(null);
            const credential = await signInWithPopup(auth, provider);
            const accessToken = getGoogleAccessToken(credential);

            setGoogleAccessToken(accessToken);
            setGoogleWorkspacePermissionStatus(accessToken ? "granted" : "missing");

            if (!accessToken) {
                setError("Google permission was granted, but no access token was returned.");
            }

            return credential;
        } catch (permissionError) {
            console.error("Error reconnecting Google Workspace permission:", permissionError);
            setGoogleAccessToken(null);
            setGoogleWorkspacePermissionStatus("missing");
            setError(getGoogleAuthErrorMessage(permissionError));
            throw permissionError;
        }
    };

    const markGoogleWorkspaceTokenExpired = () => {
        setGoogleAccessToken(null);
        setGoogleWorkspacePermissionStatus("expired");
        setError("Google permission expired. Please reconnect your Google account.");
    };

    const ensureUserSpreadsheet = useCallback(async () => {
        if (!user) {
            setSpreadsheetError("Please sign in before creating a spreadsheet.");
            return;
        }

        if (!googleAccessToken) {
            setGoogleWorkspacePermissionStatus("missing");
            setSpreadsheetError("Google Sheets permission is required before creating a spreadsheet.");
            return;
        }

        if (registry?.spreadsheetId) {
            try {
                setSpreadsheetBootstrapping(true);
                setSpreadsheetBootstrapStep("saving_registry");
                await withTimeout({
                    promise: updateUserSpreadsheetRegistry({
                        uid: user.uid,
                        spreadsheetId: registry.spreadsheetId,
                        spreadsheetUrl:
                            registry.spreadsheetUrl ?? getSpreadsheetUrl(registry.spreadsheetId),
                    }),
                    timeoutMs: firestoreSaveTimeoutMs,
                    errorMessage:
                        "Saving spreadsheet metadata to Firestore timed out. Check Firestore Database, rules, and browser access to firestore.googleapis.com.",
                });
                setSpreadsheetError(null);
            } catch (registrySaveError) {
                console.error("Error saving existing spreadsheet registry:", registrySaveError);
                const message =
                    registrySaveError instanceof Error
                        ? registrySaveError.message
                        : "Failed to save spreadsheet metadata to Firestore.";
                setSpreadsheetError(message);
            } finally {
                setSpreadsheetBootstrapping(false);
                setSpreadsheetBootstrapStep(null);
            }
            return;
        }

        try {
            setSpreadsheetBootstrapping(true);
            setSpreadsheetBootstrapStep("creating_spreadsheet");
            setSpreadsheetError(null);

            const spreadsheet = await createUserSpreadsheet({
                accessToken: googleAccessToken,
                displayName: user.displayName,
                onStep: setSpreadsheetBootstrapStep,
            });

            setRegistry((currentRegistry) => {
                if (!currentRegistry) {
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        spreadsheetId: spreadsheet.spreadsheetId,
                        spreadsheetUrl: spreadsheet.spreadsheetUrl,
                        schemaVersion: SPREADSHEET_SCHEMA_VERSION,
                    };
                }

                return {
                    ...currentRegistry,
                    spreadsheetId: spreadsheet.spreadsheetId,
                    spreadsheetUrl: spreadsheet.spreadsheetUrl,
                };
            });

            setSpreadsheetBootstrapStep("saving_registry");
            await withTimeout({
                promise: updateUserSpreadsheetRegistry({
                    uid: user.uid,
                    spreadsheetId: spreadsheet.spreadsheetId,
                    spreadsheetUrl: spreadsheet.spreadsheetUrl,
                }),
                timeoutMs: firestoreSaveTimeoutMs,
                errorMessage:
                    "Saving spreadsheet metadata to Firestore timed out. Check Firestore Database, rules, and browser access to firestore.googleapis.com.",
            });
        } catch (spreadsheetCreateError) {
            console.error("Error creating Purrney spreadsheet:", spreadsheetCreateError);
            const message =
                spreadsheetCreateError instanceof Error
                    ? spreadsheetCreateError.message
                    : "Failed to create your Purrney spreadsheet. Please try again.";
            setSpreadsheetError(message);
        } finally {
            setSpreadsheetBootstrapping(false);
            setSpreadsheetBootstrapStep(null);
        }
    }, [googleAccessToken, registry?.spreadsheetId, registry?.spreadsheetUrl, user]);

    useEffect(() => {
        if (
            user &&
            registry &&
            googleAccessToken &&
            !registry.spreadsheetId &&
            !spreadsheetBootstrapping &&
            !spreadsheetError
        ) {
            void ensureUserSpreadsheet();
        }
    }, [ensureUserSpreadsheet, googleAccessToken, registry, spreadsheetBootstrapping, spreadsheetError, user]);

    const logOut = async () => {
        try {
            setError(null);
            await signOut(auth);
            setRegistry(null);
            setGoogleAccessToken(null);
            setGoogleWorkspacePermissionStatus("missing");
            setSpreadsheetBootstrapping(false);
            setSpreadsheetBootstrapStep(null);
            setSpreadsheetError(null);
        } catch (signOutError) {
            console.error("Error signing out:", signOutError);
            setError("Sign out failed. Please try again.");
            throw signOutError;
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                registry,
                googleAccessToken,
                googleWorkspacePermissionStatus,
                spreadsheetBootstrapping,
                spreadsheetBootstrapStep,
                spreadsheetError,
                loading,
                error,
                signInWithGoogle,
                reconnectGoogleWorkspace,
                ensureUserSpreadsheet,
                markGoogleWorkspaceTokenExpired,
                logOut,
                clearError: () => setError(null),
            }}
        >
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
