import sharp from "sharp";
import fs from "fs";
import path from "path";

const publicIconsDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(publicIconsDir, { recursive: true });

// Standard Icon SVG (512x512)
const standardIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="70%" stop-color="#FACC15" />
      <stop offset="100%" stop-color="#EAB308" />
    </radialGradient>
    <pattern id="halftone" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="2.5" fill="#CA8A04" fill-opacity="0.25" />
    </pattern>
    <filter id="comicShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="8" dy="8" stdDeviation="0" flood-color="#000000" flood-opacity="1" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="100" fill="url(#halftone)" />

  <!-- Comic Outer Border -->
  <rect x="16" y="16" width="480" height="480" rx="88" fill="none" stroke="#000000" stroke-width="16" />

  <!-- Action Burst Rays -->
  <g stroke="#000000" stroke-width="6" stroke-linecap="round" opacity="0.15">
    <line x1="256" y1="30" x2="256" y2="90" />
    <line x1="256" y1="482" x2="256" y2="422" />
    <line x1="30" y1="256" x2="90" y2="256" />
    <line x1="482" y1="256" x2="422" y2="256" />
    <line x1="96" y1="96" x2="140" y2="140" />
    <line x1="416" y1="96" x2="372" y2="140" />
    <line x1="96" y1="416" x2="140" y2="372" />
    <line x1="416" y1="416" x2="372" y2="372" />
  </g>

  <!-- Central Comic Dialogue Balloon -->
  <g filter="url(#comicShadow)">
    <!-- Speech Bubble Body -->
    <path d="M 120 150 C 120 110, 150 90, 256 90 C 362 90, 392 110, 392 150 L 392 270 C 392 310, 362 330, 256 330 L 210 330 L 160 380 L 170 330 L 120 330 C 80 330, 120 310, 120 270 Z" 
          fill="#FFFFFF" stroke="#000000" stroke-width="14" stroke-linejoin="round" />
    
    <!-- Red Comic Sparkle / Lightning Accent -->
    <path d="M 230 140 L 285 140 L 250 205 L 295 205 L 220 290 L 240 225 L 205 225 Z" 
          fill="#DC2626" stroke="#000000" stroke-width="6" stroke-linejoin="round" />
  </g>

  <!-- ComicGen Text Banner -->
  <g filter="url(#comicShadow)" transform="translate(256, 420)">
    <rect x="-180" y="-36" width="360" height="72" rx="16" fill="#000000" stroke="#FFFFFF" stroke-width="5" />
    <text x="0" y="14" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="900" fill="#FACC15" text-anchor="middle" letter-spacing="3">COMICGEN</text>
  </g>
</svg>`;

// Maskable Icon SVG (512x512 with safe-zone margin ~15% on all sides)
const maskableIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGradMask" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="70%" stop-color="#FACC15" />
      <stop offset="100%" stop-color="#EAB308" />
    </radialGradient>
    <pattern id="halftoneMask" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="2.5" fill="#CA8A04" fill-opacity="0.2" />
    </pattern>
    <filter id="comicShadowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000" flood-opacity="1" />
    </filter>
  </defs>

  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />
  <rect width="512" height="512" fill="url(#halftoneMask)" />

  <!-- Safe Zone Content (Scaled to fit within the 400x400 center circle) -->
  <g transform="translate(256, 256) scale(0.78) translate(-256, -256)">
    <!-- Central Comic Dialogue Balloon -->
    <g filter="url(#comicShadowMask)">
      <path d="M 120 150 C 120 110, 150 90, 256 90 C 362 90, 392 110, 392 150 L 392 270 C 392 310, 362 330, 256 330 L 210 330 L 160 380 L 170 330 L 120 330 C 80 330, 120 310, 120 270 Z" 
            fill="#FFFFFF" stroke="#000000" stroke-width="16" stroke-linejoin="round" />
      
      <path d="M 230 140 L 285 140 L 250 205 L 295 205 L 220 290 L 240 225 L 205 225 Z" 
            fill="#DC2626" stroke="#000000" stroke-width="7" stroke-linejoin="round" />
    </g>

    <g filter="url(#comicShadowMask)" transform="translate(256, 420)">
      <rect x="-180" y="-36" width="360" height="72" rx="16" fill="#000000" stroke="#FFFFFF" stroke-width="6" />
      <text x="0" y="14" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="900" fill="#FACC15" text-anchor="middle" letter-spacing="3">COMICGEN</text>
    </g>
  </g>
</svg>`;

async function generate() {
  const standardBuffer = Buffer.from(standardIconSvg);
  const maskableBuffer = Buffer.from(maskableIconSvg);

  // 1. icon-192.png
  await sharp(standardBuffer).resize(192, 192).png().toFile(path.join(publicIconsDir, "icon-192.png"));
  console.log("Created icon-192.png");

  // 2. icon-512.png
  await sharp(standardBuffer).resize(512, 512).png().toFile(path.join(publicIconsDir, "icon-512.png"));
  console.log("Created icon-512.png");

  // 3. icon-maskable-512.png
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicIconsDir, "icon-maskable-512.png"));
  console.log("Created icon-maskable-512.png");

  // 4. apple-touch-icon.png
  await sharp(standardBuffer).resize(180, 180).png().toFile(path.join(publicIconsDir, "apple-touch-icon.png"));
  await sharp(standardBuffer).resize(180, 180).png().toFile(path.join(process.cwd(), "public", "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png");

  // 5. favicon.png
  await sharp(standardBuffer).resize(64, 64).png().toFile(path.join(process.cwd(), "public", "favicon.png"));
  console.log("Created favicon.png");
}

generate().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
