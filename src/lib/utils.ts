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
  // Build manifest and only include accountAssociation if provided
  const manifest: any = {
    frame: withValidProperties({
      version: '0.0.0',
      name: APP_NAME ?? 'Neynar Starter Kit',
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? 'Launch Mini App',
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      // The following are not in the original code but are in the docs, so I'm adding them from constants
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      heroImageUrl: APP_OG_IMAGE_URL, // Using OG image as hero
      ogTitle: APP_NAME,
      ogDescription: APP_DESCRIPTION,
      ogImageUrl: APP_OG_IMAGE_URL,
      noindex: process.env.NODE_ENV !== 'production',
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
