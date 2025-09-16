// import type { Metadata } from 'next'; // Unused for now
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
          {/* Security headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

          {/* Load snarkjs library */}
          <script defer src="/snarkjs.min.js"></script>

          {/* MiniKit initialization */}
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
