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
  // Build manifest according to Base Mini Apps specification
  const manifest: any = {
    accountAssociation: APP_ACCOUNT_ASSOCIATION || {
      header: "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
      payload: "eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ",
      signature: "MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj"
    },
    baseBuilder: {
      allowedAddresses: ['0xB348370a74fed9e5C86a45681b01941121246381']
    },
    frame: withValidProperties({
      version: '1',
      name: APP_NAME ?? 'PoEP - Proof-of-Existence Passport',
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      subtitle: 'Privacy-first human verification',
      description: APP_DESCRIPTION || 'Prove your humanity with ZK. Mint soul-bound NFT. Build trust score.',
      screenshotUrls: [`${APP_URL}/screenshot.png`],
      primaryCategory: APP_PRIMARY_CATEGORY || 'utility',
      tags: APP_TAGS?.length > 0 ? APP_TAGS : ['identity', 'zk', 'passport', 'base'],
      heroImageUrl: APP_OG_IMAGE_URL,
      tagline: 'Prove your humanity with ZK',
      ogTitle: APP_NAME,
      ogDescription: APP_DESCRIPTION,
      ogImageUrl: APP_OG_IMAGE_URL,
      noindex: false
    })
  };

  return manifest;
}
