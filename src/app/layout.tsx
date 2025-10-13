import { Inter } from 'next/font/google'
import { ClientLayout } from '@/components/layout/ClientLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '자몽 (Zamong) - 독자에게 보낼 당신의 이야기',
  description: 'Transform your stories into beautiful Instagram posts',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ClientLayout>
      </body>
    </html>
  )
}
