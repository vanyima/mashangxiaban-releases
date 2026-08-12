import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const files = await readdir('release-asset');
const dmgName = files.find((name) => name.toLowerCase().endsWith('.dmg'));
if (!dmgName) throw new Error('Release 必须包含一个 DMG 安装包。');

const tag = process.env.RELEASE_TAG || '';
const version = tag.replace(/^v/i, '');
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`无效的版本标签：${tag}`);
}
if (!dmgName.includes(version)) throw new Error(`DMG 文件名必须包含版本号 ${version}。`);

const bytes = await readFile(`release-asset/${dmgName}`);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const encodedName = dmgName.split('/').map(encodeURIComponent).join('/');
const downloadUrl = `https://github.com/${process.env.REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${encodedName}`;
const notes = String(process.env.RELEASE_BODY || '')
  .split(/\r?\n/)
  .map((line) => line.replace(/^[-*]\s*/, '').trim())
  .filter(Boolean);

const manifest = {
  version,
  publishedAt: process.env.PUBLISHED_AT || new Date().toISOString(),
  platform: 'darwin-arm64',
  downloadUrl,
  sha256,
  notes,
};
await writeFile('latest.json', `${JSON.stringify(manifest, null, 2)}\n`);

let html = await readFile('index.html', 'utf8');
html = html.replace(/https:\/\/github\.com\/vanyima\/mashangxiaban-releases\/releases\/download\/v[^"<]+\.dmg/g, downloadUrl);
html = html.replace(/(<div class="eyebrow"><span>打工人桌面陪伴应用<\/span><em>)V[^<]+/, `$1V${version}`);
html = html.replace(/下载马上下班\s+[0-9A-Za-z.+-]+/g, `下载马上下班 ${version}`);
html = html.replace(/SHA-256 · [a-f0-9]{64}/g, `SHA-256 · ${sha256}`);
await writeFile('index.html', html);
