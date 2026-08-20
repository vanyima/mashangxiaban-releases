const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const source = path.join(root, 'assets', 'ma-default-sideeye-v1.png');
const output = path.join(root, 'app-icon.png');

async function run() {
  const horse = await sharp(source)
    .resize(820, 820, { fit: 'cover', position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const backdrop = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect x="139" y="133" width="790" height="790" rx="190" fill="#11131a" opacity=".98"/>
      <rect x="96" y="88" width="804" height="804" rx="190" fill="#ffdf32"/>
    </svg>`);
  const clip = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect x="96" y="88" width="804" height="804" rx="190" fill="#fff"/>
    </svg>`);
  const border = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect x="96" y="88" width="804" height="804" rx="190" fill="none" stroke="#11131a" stroke-width="38"/>
    </svg>`);

  const clippedFace = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: horse, left: 82, top: 72 }, { input: clip, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: backdrop }, { input: clippedFace }, { input: border }])
    .png()
    .toFile(output);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
