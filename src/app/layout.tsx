import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./api/AuthContext";
import ServiceWorkerRegister from "./component/ServiceWorkerRegister";
import PendingSyncManager from "./component/PendingSyncManager";

export const metadata: Metadata = {
  applicationName: "Purrney",
  title: "Purrney",
  description: "Personal finance tracker powered by your own spreadsheet.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Purrney",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <AuthProvider>
          <PendingSyncManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
