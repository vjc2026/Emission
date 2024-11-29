import '@mantine/core/styles.css';
import type { AppProps } from 'next/app';
import { createTheme, MantineProvider } from '@mantine/core';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';

const theme = createTheme({
  // Add your custom Mantine theme overrides
});

export default function App({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <MantineProvider theme={theme}>
      {isClient ? (
        <BrowserRouter>
          <Component {...pageProps} />
        </BrowserRouter>
      ) : (
        <StaticRouter location={pageProps.url}>
          <Component {...pageProps} />
        </StaticRouter>
      )}
    </MantineProvider>
  );
}