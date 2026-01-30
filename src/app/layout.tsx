import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";
import { ServiceWorkerProvider } from "@/lib/ServiceWorker";

export const metadata: Metadata = {
  title: "🧠 TrackMind - South Pro Motors",
  description: "Sistema de tracking de vehículos - South Pro Motors",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrackMind",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="safe-top safe-bottom">
        <ServiceWorkerProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
