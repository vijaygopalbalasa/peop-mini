import type { Metadata } from 'next';
import '~/app/globals.css';
import '@coinbase/onchainkit/styles.css';
import { Providers } from "./providers";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [APP_OG_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script defer src="/snarkjs.min.js"></script>
      </head>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
