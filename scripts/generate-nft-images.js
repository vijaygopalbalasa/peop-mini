#!/usr/bin/env node

/**
 * NFT Image Generator for PoEP Tiers
 *
 * Generates simple placeholder NFT images for different trust score tiers
 * Uses HTML5 Canvas to create dynamic images with tier-based styling
 */

const fs = require('fs');
const path = require('path');

// Create a simple canvas-like interface for Node.js
const { createCanvas, loadImage } = require('canvas');

const TIER_CONFIGS = {
  standard: {
    name: 'Standard',
    color: '#6366f1', // indigo
    bgColor: '#f1f5f9',
    scoreRange: '1-9',
    description: 'Newcomer to the ecosystem'
  },
  bronze: {
    name: 'Bronze',
    color: '#cd7f32',
    bgColor: '#fef3c7',
    scoreRange: '10-49',
    description: 'Active participant'
  },
  silver: {
    name: 'Silver',
    color: '#c0c0c0',
    bgColor: '#f3f4f6',
    scoreRange: '50-99',
    description: 'Established member'
  },
  gold: {
    name: 'Gold',
    color: '#ffd700',
    bgColor: '#fef3c7',
    scoreRange: '100+',
    description: 'Elite contributor'
  }
};

async function generateNFTImage(tier, config) {
  const width = 512;
  const height = 512;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, config.bgColor);
  gradient.addColorStop(1, config.color + '33'); // 20% opacity

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = config.color;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Main circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 40, 120, 0, 2 * Math.PI);
  ctx.fillStyle = config.color;
  ctx.fill();

  // Inner circle (passport symbol)
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 40, 80, 0, 2 * Math.PI);
  ctx.fillStyle = 'white';
  ctx.fill();

  // ZK Symbol (simplified)
  ctx.fillStyle = config.color;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ZK', width / 2, height / 2 - 25);

  // Tier name
  ctx.fillStyle = config.color;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(config.name, width / 2, height / 2 + 80);

  // Score range
  ctx.fillStyle = '#4b5563';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${config.scoreRange}`, width / 2, height / 2 + 120);

  // Description
  ctx.font = '18px Arial';
  ctx.fillText(config.description, width / 2, height / 2 + 150);

  // PoEP text at bottom
  ctx.fillStyle = config.color;
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Proof-of-Existence Passport', width / 2, height - 30);

  // Base chain logo (simplified)
  ctx.fillStyle = '#0052ff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('⚡ Base', 60, height - 30);

  return canvas.toBuffer('image/png');
}

async function generateAllImages() {
  const publicDir = path.join(__dirname, '..', 'public', 'images');

  // Create images directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('🎨 Generating PoEP NFT tier images...');

  for (const [tier, config] of Object.entries(TIER_CONFIGS)) {
    try {
      console.log(`   Creating ${config.name} tier image...`);

      const imageBuffer = await generateNFTImage(tier, config);
      const filename = `poep-${tier}.png`;
      const filepath = path.join(publicDir, filename);

      fs.writeFileSync(filepath, imageBuffer);

      console.log(`   ✅ Generated: ${filename}`);
    } catch (error) {
      console.error(`   ❌ Failed to generate ${tier}:`, error.message);
    }
  }

  console.log('\n🎉 NFT image generation complete!');
  console.log('📁 Images saved to: public/images/');
  console.log('\nGenerated images:');
  Object.keys(TIER_CONFIGS).forEach(tier => {
    console.log(`   - poep-${tier}.png`);
  });
}

// Run if called directly
if (require.main === module) {
  generateAllImages().catch(console.error);
}

module.exports = { generateAllImages, TIER_CONFIGS };