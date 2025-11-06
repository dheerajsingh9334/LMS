import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { auth } from '@/auth'
import './globals.css'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import { ToastProvider } from '@/components/providers/toaster-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SessionWrapper } from '@/components/providers/session-provider'


const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
});


export const metadata: Metadata = {
  title: 'Education',
  description: 'An LMS Platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  return (
    <SessionWrapper session={session}>
      <html lang="en" suppressHydrationWarning>
        <body className={poppins.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConfettiProvider />
            <ToastProvider />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  )
}
