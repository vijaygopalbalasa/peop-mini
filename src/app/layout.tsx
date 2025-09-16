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
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

          {/* Load snarkjs library */}
          <script defer src="/snarkjs.min.js"></script>

          {/* MiniKit initialization */}
          <script dangerouslySetInnerHTML={{
            __html: `
              // Store any existing ethereum provider before MiniKit loads
              if (typeof window !== 'undefined') {
                if (window.ethereum && !window.__originalEthereum) {
                  try {
                    window.__originalEthereum = window.ethereum;
                    console.log('Stored original ethereum provider');
                  } catch (e) {
                    console.warn('Could not store original ethereum provider:', e);
                  }
                }
              }

              // Create MiniKit ready function
              if (typeof window !== 'undefined') {
                if (!window.minikit) {
                  window.minikit = {};
                }
                window.minikit.ready = function() {
                  console.log('MiniKit ready called');
                  if (window.parent && window.parent !== window) {
                    try {
                      window.parent.postMessage({ type: 'minikit-ready' }, '*');
                    } catch (e) {
                      console.warn('MiniKit ready message failed:', e);
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
