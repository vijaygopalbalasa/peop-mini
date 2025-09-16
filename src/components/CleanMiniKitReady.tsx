'use client';
import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export default function CleanMiniKitReady() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const [readyCalled, setReadyCalled] = useState(false);

  // Single ready call with fallbacks
  useEffect(() => {
    if (readyCalled) return;

    const callReady = async () => {
      setReadyCalled(true);

      // Primary OnchainKit call
      try {
        await setFrameReady?.();
      } catch (_error) {
        // Silent failure - fallbacks will handle it
      }

      // Simple fallback postMessages (only if in iframe)
      if (window.parent && window.parent !== window) {
        const messages = [
          { type: 'miniapp:ready', origin: window.location.origin },
          { type: 'minikit:ready', origin: window.location.origin },
          { type: 'base:frame_ready', origin: window.location.origin },
          { type: 'frame-ready', origin: window.location.origin }
        ];

        messages.forEach(msg => {
          try {
            window.parent.postMessage(msg, '*');
          } catch (_e) {
            // Silent failure
          }
        });
      }

      // Global ready functions
      try {
        if ((window as any).minikit?.ready) {
          (window as any).minikit.ready();
        }
        if ((window as any).coinbase?.ready) {
          (window as any).coinbase.ready();
        }
      } catch (_e) {
        // Silent failure
      }
    };

    // Call once immediately
    callReady();

    // Single retry after 2 seconds if not ready
    const retryTimeout = setTimeout(() => {
      if (!isFrameReady && !readyCalled) {
        callReady();
      }
    }, 2000);

    return () => clearTimeout(retryTimeout);
  }, [setFrameReady, isFrameReady, readyCalled]);

  // Listen for inbound messages (minimal logging)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only log context messages for debugging
      if (event.data && event.data.context) {
        console.log('[MiniKit] Context received');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}