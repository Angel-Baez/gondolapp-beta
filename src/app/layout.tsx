import type { Metadata, Viewport } from "next";
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
  maximumScale: 1,
  userScalable: false,
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
        {children}
      </body>
    </html>
  );
}
