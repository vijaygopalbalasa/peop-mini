import type { Metadata } from 'next';
import '~/app/globals.css';
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en">
        <head>
          <script defer src="/snarkjs.min.js"></script>
          <script dangerouslySetInnerHTML={{
            __html: `
              // Prevent ethereum property redefinition errors
              if (window.ethereum && Object.getOwnPropertyDescriptor(window, 'ethereum')) {
                try {
                  delete window.ethereum;
                } catch (e) {
                  // Silent cleanup
                }
              }

              // Create ready function if not exists
              if (!window.minikit) {
                window.minikit = {};
              }
              if (!window.minikit.ready) {
                window.minikit.ready = function() {
                  if (window.parent && window.parent !== window) {
                    try {
                      window.parent.postMessage({ type: 'minikit-ready' }, '*');
                    } catch (e) {
                      // Silent failure
                    }
                  }
                };
              }
            `
          }} />
        </head>
        <body className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
          {children}
        </body>
      </html>
    </Providers>
  );
}
