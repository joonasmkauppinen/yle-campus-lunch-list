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
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
      </head>
      <body className="bg-white dark:bg-black">{children}</body>
    </html>
  );
}
