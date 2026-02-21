import './globals.css';
import { Suspense } from 'react';

export const metadata = {
  title: 'You\'re Invited — A Wedding Celebration',
  description: 'Join us as we celebrate our love and begin our forever together.',
  openGraph: {
    title: 'You\'re Invited — A Wedding Celebration',
    description: 'Join us as we celebrate our love and begin our forever together.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Great+Vibes&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Suspense>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
