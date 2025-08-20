import { type AccountAssociation } from '@farcaster/miniapp-core/src/manifest';

/**
 * Application constants and configuration values.
 *
 * This file contains all the configuration constants used throughout the mini app.
 * These values are either sourced from environment variables or hardcoded and provide
 * configuration for the app's appearance, behavior, and integration settings.
 *
 * NOTE: This file is automatically updated by the init script.
 * Manual changes may be overwritten during project initialization.
 */

// --- App Configuration ---
/**
 * The base URL of the application.
 * Used for generating absolute URLs for assets and API endpoints.
 */
export const APP_URL: string = process.env.NEXT_PUBLIC_URL!;

/**
 * The name of the mini app as displayed to users.
 * Used in titles, headers, and app store listings.
 */
export const APP_NAME: string = 'peop-mini';

/**
 * A brief description of the mini app's functionality.
 * Used in app store listings and metadata.
 */
export const APP_DESCRIPTION: string = 'proof of existence passport';

/**
 * The primary category for the mini app.
 * Used for app store categorization and discovery.
 */
export const APP_PRIMARY_CATEGORY: string = '';

/**
 * Tags associated with the mini app.
 * Used for search and discovery in app stores.
 */
export const APP_TAGS: string[] = ['neynar', 'starter-kit', 'demo'];

// --- Asset URLs ---
/**
 * URL for the app's icon image.
 * Used in app store listings and UI elements.
 */
export const APP_ICON_URL: string = `${APP_URL}/icon.png`;

/**
 * URL for the app's Open Graph image.
 * Used for social media sharing and previews.
 */
export const APP_OG_IMAGE_URL: string = `${APP_URL}/api/opengraph-image`;

/**
 * URL for the app's splash screen image.
 * Displayed during app loading.
 */
export const APP_SPLASH_URL: string = `${APP_URL}/splash.png`;

/**
 * Background color for the splash screen.
 * Used as fallback when splash image is loading.
 */
export const APP_SPLASH_BACKGROUND_COLOR: string = '#f7f7f7';

/**
 * Account association for the mini app.
 * Used to associate the mini app with a Farcaster account.
 * If not provided, the mini app will be unsigned and have limited capabilities.
 */
export const APP_ACCOUNT_ASSOCIATION: AccountAssociation | undefined =
  undefined;

// --- UI Configuration ---
/**
 * Text displayed on the main action button.
 * Used for the primary call-to-action in the mini app.
 */
export const APP_BUTTON_TEXT: string = 'Launch';

// --- Integration Configuration ---
/**
 * Webhook URL for receiving events from Neynar.
 *
 * If Neynar API key and client ID are configured, uses the official
 * Neynar webhook endpoint. Otherwise, falls back to a local webhook
 * endpoint for development and testing.
 */
export const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS";
export const NEYNAR_CLIENT_ID = process.env.NEYNAR_CLIENT_ID || "";
export const NEYNAR_WEBHOOK_SECRET = process.env.NEYNAR_WEBHOOK_SECRET || "";
export const NEYNAR_MANAGED_SIGNER_UUID = process.env.NEYNAR_MANAGED_SIGNER_UUID || "";
export const NEYNAR_MANAGED_SIGNER_PRIVATE_KEY = process.env.NEYNAR_MANAGED_SIGNER_PRIVATE_KEY || "";
export const NEYNAR_BOT_FID = process.env.NEYNAR_BOT_FID || "";
export const NEYNAR_WEBHOOK_URL = `${APP_URL}/api/webhook`;
export const APP_WEBHOOK_URL = NEYNAR_WEBHOOK_URL;
export const NEYNAR_REDIRECT_URL = `${APP_URL}/api/auth/callback`;
export const NEYNAR_SIWN_VARIANT = "neynar_modal";

// Public Coinbase Developer Platform API key for OnchainKit (client-exposed)
export const NEXT_PUBLIC_CDP_API_KEY: string = process.env.NEXT_PUBLIC_CDP_API_KEY || '';

export const BASE_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const POEP_CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "uint256[2]", "name": "_pA", "type": "uint256[2]" },
            { "internalType": "uint256[2][2]", "name": "_pB", "type": "uint256[2][2]" },
            { "internalType": "uint256[2]", "name": "_pC", "type": "uint256[2]" },
            { "internalType": "uint256", "name": "_nullifier", "type": "uint256" }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "viewTrustScore",
        "outputs": [{ "internalType": "uint256", "name": "score", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "ownerOf",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "nullifier", "type": "uint256" }
        ],
        "name": "PassportMinted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "oldScore", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "newScore", "type": "uint256" }
        ],
        "name": "ScoreUpdated",
        "type": "event"
    }
] as const;

/**
 * Flag to enable/disable wallet functionality.
 *
 * When true, wallet-related components and features are rendered.
 * When false, wallet functionality is completely hidden from the UI.
 * Useful for mini apps that don't require wallet integration.
 */
export const USE_WALLET: boolean = true;

/**
 * Flag to enable/disable analytics tracking.
 *
 * When true, usage analytics are collected and sent to Neynar.
 * When false, analytics collection is disabled.
 * Useful for privacy-conscious users or development environments.
 */
export const ANALYTICS_ENABLED: boolean = false;

/**
 * Required chains for the mini app.
 *
 * Contains an array of CAIP-2 identifiers for blockchains that the mini app requires.
 * If the host does not support all chains listed here, it will not render the mini app.
 * If empty or undefined, the mini app will be rendered regardless of chain support.
 *
 * Supported chains: eip155:1, eip155:137, eip155:42161, eip155:10, eip155:8453,
 * solana:mainnet, solana:devnet
 */
export const APP_REQUIRED_CHAINS: string[] = [];

/**
 * Return URL for the mini app.
 *
 * If provided, the mini app will be rendered with a return URL to be rendered if the
 * back button is pressed from the home page.
 */
export const RETURN_URL: string | undefined = undefined;

// PLEASE DO NOT UPDATE THIS
export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract:
    '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`,
};

// PLEASE DO NOT UPDATE THIS
export const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];
