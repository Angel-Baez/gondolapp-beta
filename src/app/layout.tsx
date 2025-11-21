import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import PWAProvider from "./PWAProvider";

export const metadata: Metadata = {
  title: "GondolApp - Gestor de Inventario",
  description:
    "Aplicación de gestión de inventario y control de vencimientos para supermercados",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GondolApp",
  },
};

export const viewport: Viewport = {
  themeColor: "#06B6D4",
  width: "device-width",
  initialScale: 1,
  // ✅ Permitir zoom para mejor accesibilidad (Lighthouse)
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body>
        <PWAProvider />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: "1rem",
              borderRadius: "0.75rem",
              background: "#fff",
              color: "#222",
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
