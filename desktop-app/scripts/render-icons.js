const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const moods = ['doomed', 'zombie', 'hopeful', 'ready'];

async function renderMoodIcon(mood) {
  const source = path.join(projectRoot, `icon-${mood}.svg`);
  const target = path.join(projectRoot, `icon-${mood}.png`);
  const png = await sharp(source, { density: 256 })
    .resize(1024, 1024)
    .png()
    .toBuffer();

  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];
  const corners = [
    alphaAt(0, 0),
    alphaAt(info.width - 1, 0),
    alphaAt(0, info.height - 1),
    alphaAt(info.width - 1, info.height - 1)
  ];

  if (corners.some((alpha) => alpha !== 0)) {
    throw new Error(`${mood} icon has opaque corners: ${corners.join(',')}`);
  }

  fs.writeFileSync(target, png);
  console.log(`${mood}: ${info.width}x${info.height}, corner-alpha=${corners.join(',')}`);
}

(async () => {
  for (const mood of moods) await renderMoodIcon(mood);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
