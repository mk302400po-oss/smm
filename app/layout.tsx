import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Venom Media | أفضل منصة لخدمات التواصل الاجتماعي',
  description: 'Venom Media - منصة احترافية لتنمية حساباتك على منصات التواصل الاجتماعي بأفضل الأسعار وأعلى جودة',
  keywords: ['متابعين', 'لايكات', 'انستقرام', 'تيك توك', 'سوشيال ميديا', 'فينوم ميديا', 'Venom Media'],

  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },

  openGraph: {
    title: 'Venom Media | أفضل منصة لخدمات التواصل الاجتماعي',
    description: 'منصة احترافية لتنمية حساباتك على منصات التواصل الاجتماعي',
    url: 'https://venommedia.com',
    siteName: 'Venom Media',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Venom Media - منصة التسويق عبر وسائل التواصل الاجتماعي',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Venom Media | خدمات السوشيال ميديا',
    description: 'منصة احترافية لتنمية حساباتك',
    images: ['/og-image.png'],
  },

  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#7C3AED',
}

import { Toaster } from 'react-hot-toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={cairo.className} suppressHydrationWarning>
        <SessionProvider>
          {children}
          <Toaster 
            position="bottom-right" 
            reverseOrder={false} 
            toastOptions={{
              className: '',
              style: {
                fontFamily: 'var(--font-cairo)',
                background: '#18181b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                fontSize: '15px',
                fontWeight: '600'
              },
              success: {
                style: {
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: 'rgba(5, 46, 22, 0.9)',
                  backdropFilter: 'blur(8px)',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(69, 10, 10, 0.9)',
                  backdropFilter: 'blur(8px)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
