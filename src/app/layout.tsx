// Root Layout
// Wraps all pages with session provider and global styles

import localFont from 'next/font/local';
import '@/styles/globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';

const poppins = localFont({
  src: [
    { path: '../../public/fonts/poppins/Poppins-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/poppins/Poppins-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/poppins/Poppins-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/poppins/Poppins-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'PM Dashboard',
  description: 'Headless Admin Dashboard Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex flex-col min-h-screen font-sans">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
