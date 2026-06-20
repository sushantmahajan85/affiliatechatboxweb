import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/sonner';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Affiliate Chat Box',
  description: 'Affiliate chat box application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NextTopLoader color="#0A7EA4" showSpinner={false} />
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
