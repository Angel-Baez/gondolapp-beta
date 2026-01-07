import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import PWAProvider from "./PWAProvider";
import { FeedbackProvider } from "@/components/feedback";
import { ThemeProvider } from "@/components/shared";

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
  applicationName: "GondolApp",
  keywords: ["inventario", "supermercado", "escaneo", "vencimientos", "PWA"],
  authors: [{ name: "GondolApp Team" }],
  creator: "GondolApp",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06B6D4" },
    { media: "(prefers-color-scheme: dark)", color: "#0E7490" },
  ],
  width: "device-width",
  initialScale: 1,
  // ✅ Permitir zoom para mejor accesibilidad (Lighthouse)
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/icon-192x192.png" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        
        {/* Apple Touch Icons for iOS */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-192x192.png" />
        
        {/* iOS Safari specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GondolApp" />
        
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/favicon.svg" color="#06B6D4" />
        
        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#06B6D4" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        
        {/* Permissions Policy */}
        <meta
          name="permissions-policy"
          content="vibrate=*, camera=*, microphone=*"
        />
        
        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        
        {/* Prevent flash on page load by setting initial theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('gondolapp-theme');
                  var theme = stored ? JSON.parse(stored).state.theme : 'system';
                  var isDark = theme === 'dark' || 
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-dark-bg transition-colors">
        <ThemeProvider>
          <PWAProvider />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontSize: "1rem",
                borderRadius: "0.75rem",
                background: "#333",
                color: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              },
            }}
          />
          {children}
          <FeedbackProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
