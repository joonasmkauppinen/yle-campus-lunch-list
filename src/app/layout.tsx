import '@/styles/globals.css';

import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lounaslistat',
  description: 'Ylen kampusalueen lounaslistat.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  other: {
    updatedAt: new Date().toISOString(),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fi">
      <body className="bg-white dark:bg-black">{children}</body>
    </html>
  );
}
