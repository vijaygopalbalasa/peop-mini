const ROOT_URL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL || 'https://peop-mini.vercel.app';

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  frame: {
    version: "1",
    name: "PoEP - Proof-of-Existence Passport",
    subtitle: "Your Privacy-First Identity Badge",
    description: "Create your soul-bound NFT identity with zero-knowledge proofs on Base. Privacy-first camera capture, ZK-SNARK verification, and trust score system.",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#1e40af",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "utility",
    tags: ["identity", "privacy", "zk", "nft", "base"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Your onchain identity, secured by ZK proofs",
    ogTitle: "PoEP - Proof-of-Existence Passport",
    ogDescription: "Create your privacy-first identity badge with ZK-SNARKs on Base",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;