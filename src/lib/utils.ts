import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
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

export async function getBaseMiniAppManifest() {
  // Build manifest according to Farcaster Mini Apps specification 2025
  const manifest = {
    // Required: Account association for domain verification
    accountAssociation: APP_ACCOUNT_ASSOCIATION,

    // Required: Mini app metadata (NEW FORMAT)
    miniapp: {
      version: '1', // Required: Always "1"
      name: 'PoEP - Proof-of-Existence Passport', // Required: Max 32 chars
      homeUrl: APP_URL, // Required: HTTPS URL
      iconUrl: APP_ICON_URL, // Required: 1024x1024 PNG, no alpha
      imageUrl: APP_OG_IMAGE_URL, // Required: 3:2 aspect ratio for embed
      splashImageUrl: APP_SPLASH_URL, // Optional: 200x200px loading screen
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR, // Optional: Hex color
      webhookUrl: APP_WEBHOOK_URL, // Optional but recommended

      // Button configuration for embed
      button: {
        title: 'Launch PoEP', // Max 32 characters
        action: {
          type: 'launch_miniapp', // Use new launch_miniapp type
          url: APP_URL
        }
      },

      // Required capabilities for iframe embedding
      requiredCapabilities: ['camera', 'clipboard-write'],
      requiredChains: ['eip155:8453'], // Base mainnet

      // Content metadata
      subtitle: 'Privacy-first human verification',
      description: 'Prove your humanity with zero-knowledge proofs on Base. Mint your soul-bound identity NFT with privacy-first camera capture and cryptographic verification.',

      // Discovery metadata
      primaryCategory: 'utility',
      tags: ['identity', 'zk', 'passport', 'base', 'nft']
    },

    // Legacy frame format for backward compatibility
    frame: {
      version: '1',
      name: 'PoEP - Proof-of-Existence Passport',
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      imageUrl: APP_OG_IMAGE_URL,
      button: {
        title: 'Launch PoEP',
        action: {
          type: 'launch_frame', // Legacy type for compatibility
          url: APP_URL
        }
      }
    }
  };

  return manifest;
}
