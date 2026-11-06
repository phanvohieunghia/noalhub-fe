import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import ImageTracer from 'imagetracerjs';

/**
 * Converts any generated cover image into a full-bleed, nocturnal/twilight,
 * ultra-intricate SVG with zero white/pale gaps and solid dark base fill.
 * 
 * @param {string} inputImagePath - Absolute or relative path to JPG/PNG
 * @param {string} topicId - Target topic slug, e.g. 'ai-machine-learning'
 * @param {string} baseColor - Solid base rect color, e.g. '#00181d'
 */
export function convertImageToBlogCoverSvg(inputImagePath, topicId, baseColor = '#00181d') {
  const destPath = path.resolve('apps/web/public/images/default-covers', `${topicId}.svg`);
  const rawBinPath = path.resolve(`.tmp_${topicId}.bin`);
  const tempSvgPath = path.resolve(`.tmp_${topicId}.svg`);

  // Step 1: Use Python PIL to resize smoothly to 640x360 RGBA binary buffer
  const pyScript = `
from PIL import Image
im = Image.open("${inputImagePath}").convert("RGBA")
im = im.resize((640, 360), Image.Resampling.LANCZOS)
with open("${rawBinPath}", "wb") as f:
    f.write(im.tobytes())
`;
  execSync(`python3 -c '${pyScript.replace(/'/g, "\\'")}'`);

  const buf = fs.readFileSync(rawBinPath);
  fs.unlinkSync(rawBinPath);

  const imgd = {
    width: 640,
    height: 360,
    data: new Uint8ClampedArray(buf)
  };

  // Step 2: Trace with high-density vector settings
  let rawSvg = ImageTracer.imagedataToSVG(imgd, {
    numberofcolors: 30,
    blurradius: 1.0,
    blurdelta: 16,
    ltres: 1.0,
    qtres: 1.0,
    pathomit: 10,
    colorsampling: 2,
    colorquantcycles: 3,
    roundcoords: 1,
    viewbox: true
  });

  // Step 3: Insert solid base rect safely inside <svg ...>
  rawSvg = rawSvg.replace(
    /(<svg\b[^>]*>)/i,
    `$1<rect width="100%" height="100%" fill="${baseColor}"/>`
  );

  // Step 4: Tone-map any residual pale/washed-out colors (brightness > 225) to warm amber / dusk cyan
  rawSvg = rawSvg.replace(/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/g, (match, rHex, gHex, bHex) => {
    const r = parseInt(rHex, 16);
    const g = parseInt(gHex, 16);
    const b = parseInt(bHex, 16);
    const brightness = (r + g + b) / 3;
    if (brightness > 225) {
      return '#e5b36a';
    }
    return match;
  });

  fs.writeFileSync(tempSvgPath, rawSvg, 'utf-8');

  // Step 5: SVGO optimization via npx
  execSync(`npx -y svgo "${tempSvgPath}" -o "${destPath}" --multipass`);
  fs.unlinkSync(tempSvgPath);

  // Step 6: Validate XML integrity
  execSync(`python3 -c '
import xml.etree.ElementTree as ET
ET.parse("${destPath}")
'`);

  console.log(`[OK] Successfully generated ${topicId}.svg (${fs.statSync(destPath).size} bytes)`);
}

// CLI usage: node scripts/batch-trace-cover.mjs <inputImage> <topicId> [baseColor]
if (process.argv[2] && process.argv[3]) {
  convertImageToBlogCoverSvg(process.argv[2], process.argv[3], process.argv[4] || '#00181d');
}
