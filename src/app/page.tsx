import { Metadata } from "next";
import { MiniKitReadyWrapper } from "~/components/MiniKitReadyWrapper";
import CleanMiniKitReady from "~/components/CleanMiniKitReady";
import App from "~/components/App";

// Force dynamic rendering to prevent SSR issues with MiniKit
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const miniappEmbed = {
    "version": "1",
    "name": "PoEP - Proof-of-Existence Passport",
    "homeUrl": "https://peop-mini.vercel.app",
    "iconUrl": "https://peop-mini.vercel.app/icon.png",
    "imageUrl": "https://peop-mini.vercel.app/images/poep-card.png", // 3:2 aspect ratio
    "splashImageUrl": "https://peop-mini.vercel.app/splash.png",
    "splashBackgroundColor": "#f7f7f7",
    "button": {
      "title": "Launch PoEP",
      "action": {
        "type": "launch_miniapp",
        "url": "https://peop-mini.vercel.app"
      }
    },
    "requiredCapabilities": ["camera", "clipboard-write"],
    "requiredChains": ["eip155:8453"]
  };

  const legacyFrameEmbed = {
    "version": "1",
    "title": "PoEP Mini",
    "imageUrl": "https://peop-mini.vercel.app/images/poep-card.png",
    "button": {
      "title": "Launch PoEP",
      "action": { "type": "launch_frame", "url": "https://peop-mini.vercel.app" }
    }
  };

  return {
    title: "PoEP - Proof-of-Existence Passport",
    description: "Your onchain identity, secured by ZK proofs",
    openGraph: {
      title: "PoEP - Proof-of-Existence Passport",
      description: "Your onchain identity, secured by ZK proofs",
      images: ["https://peop-mini.vercel.app/images/poep-card.png"],
    },
    other: {
      // NEW: Required fc:miniapp meta tag for 2025 Farcaster Mini Apps
      "fc:miniapp": JSON.stringify(miniappEmbed),
      // LEGACY: Keep fc:frame for backward compatibility
      "fc:frame": JSON.stringify(legacyFrameEmbed),
    },
  };
}

export default function HomePage() {
  return (
    <MiniKitReadyWrapper>
      <CleanMiniKitReady />
      <App />
    </MiniKitReadyWrapper>
  );
}
