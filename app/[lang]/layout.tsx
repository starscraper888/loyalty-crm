import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieConsent from '@/components/CookieConsent'
import Footer from '@/components/Footer'
import PWARegistration from '@/components/PWARegistration'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loyalty CRM",
  description: "WhatsApp-first Loyalty CRM",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Loyalty CRM'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#3b82f6'
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
          <CookieConsent />
          <PWARegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
