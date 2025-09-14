import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Manifest } from '@farcaster/miniapp-core/src/manifest';
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_SPLASH_URL,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_ACCOUNT_ASSOCIATION,
} from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    version: 'next',
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      },
    },
  };
}

function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (Array.isArray(value) ? value.length > 0 : !!value)),
  );
}

export async function getFarcasterDomainManifest(): Promise<Manifest> {
  // Build manifest according to 2025 Farcaster Mini App spec
  const manifest: any = {
    miniapp: withValidProperties({
      version: '1',
      name: APP_NAME ?? 'PoEP - Proof-of-Existence Passport',
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? 'Launch',
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      description: APP_DESCRIPTION || 'Your onchain identity, secured by ZK proofs',
      subtitle: 'Privacy-first identity for Base',
      primaryCategory: APP_PRIMARY_CATEGORY || 'utility',
      tags: APP_TAGS?.length > 0 ? APP_TAGS : ['identity', 'zk', 'passport', 'base'],
      heroImageUrl: APP_OG_IMAGE_URL,
      requiredChains: ['eip155:8453'], // Base mainnet
      requiredCapabilities: [
        'actions.signIn',
        'wallet.getEthereumProvider',
        'actions.connectWallet'
      ],
      // Screenshot URLs for better discovery
      screenshotUrls: [`${APP_URL}/screenshot.png`],
      // Canonical domain for verification
      canonicalDomain: APP_URL?.replace('https://', '').replace('http://', ''),
    }),
    baseBuilder: {
      allowedAddresses: ['0xB348370a74fed9e5C86a45681b01941121246381'],
    },
  };

  if (APP_ACCOUNT_ASSOCIATION) {
    manifest.accountAssociation = APP_ACCOUNT_ASSOCIATION;
  }

  return manifest as Manifest;
}
