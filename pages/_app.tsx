import '../styles/globals.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import { PageContainer } from '../components/ContainerArticle/ContainerArticle';
import { useDarkMode } from '../jotai/darkModeAtom';
import { useEffect } from 'react';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { darkMode, setDarkMode } = useDarkMode();

  useEffect(() => {
    if (darkMode) {
      console.log('applying dark mode colors');
      document.documentElement.style.setProperty('--text-primary', '#d9d9d9');
      document.documentElement.style.setProperty('--text-secondary', '#a6a6a6');
      document.documentElement.style.setProperty('--background', '#000000');
      document.documentElement.style.setProperty('--divider', '#404040');
      document.documentElement.style.setProperty('--text-link', ' #5380ff');
    } else {
      console.log('applying light mode colors');
      document.documentElement.style.setProperty('--text-primary', '#1b1b1b');
      document.documentElement.style.setProperty('--text-secondary', '#808080');
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--divider', '#d9d9d9');
      document.documentElement.style.setProperty('--text-link', ' blue');
    }
  }, [darkMode, setDarkMode]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta name="application-name" content="Lounaslistat" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lounaslistat" />
        <meta name="description" content="Ylen kampuksen lounasravintoloiden lounaslistat." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />

        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad_152x152.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/touch-icon-iphone-retina_180x180.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/touch-icon-ipad-retina_167x167.png"
        />

        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yle-campus-lunch-list.vercel.app" />
        <meta name="twitter:title" content="Lounaslistat" />
        <meta
          name="twitter:description"
          content="Ylen kampuksen lounasravintoloiden lounaslistat."
        />
        <meta
          name="twitter:image"
          content="https://yle-campus-lunch-list.vercel.app/icons/icon_192x192.png"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Lounaslistat" />
        <meta
          property="og:description"
          content="Ylen kampuksen lounasravintoloiden lounaslistat."
        />
        <meta property="og:site_name" content="yle-campus-lunch-list" />
        <meta property="og:url" content="https://yle-campus-lunch-list.vercel.app" />
        <meta
          property="og:image"
          content="https://yle-campus-lunch-list.vercel.app/icons/icon_192x192.png"
        />
        {/* <!-- apple splash screen images --> */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple_splash_2048.png"
          sizes="2048x2732"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple_splash_1668.png"
          sizes="1668x2224"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple_splash_1536.png"
          sizes="1536x2048"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple_splash_1125.png"
          sizes="1125x2436"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple_splash_1242.png"
          sizes="1242x2208"
        />
        <link rel="apple-touch-startup-image" href="/icons/apple_splash_750.png" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/icons/apple_splash_640.png" sizes="640x1136" />
      </Head>
      <PageContainer>
        <Component {...pageProps} />
      </PageContainer>
    </>
  );
};

export default MyApp;
