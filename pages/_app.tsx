import '../styles/globals.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import { PageContainer } from '../components/ContainerArticle/ContainerArticle';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PageContainer>
        <Component {...pageProps} />
      </PageContainer>
    </>
  );
}

export default MyApp;
