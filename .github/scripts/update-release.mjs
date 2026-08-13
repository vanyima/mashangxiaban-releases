import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';

const files = await readdir('release-asset');
const dmgName = files.find((name) => name.toLowerCase().endsWith('.dmg'));
const exeName = files.find((name) => name.toLowerCase().endsWith('.exe'));
if (!dmgName || !exeName) throw new Error('Release 必须同时包含 DMG 和 EXE 安装包。');

const tag = process.env.RELEASE_TAG || '';
const version = tag.replace(/^v/i, '');
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`无效的版本标签：${tag}`);
}
for (const name of [dmgName, exeName]) {
  if (!name.includes(version)) throw new Error(`安装包文件名必须包含版本号 ${version}：${name}`);
}

async function artifact(name) {
  const bytes = await readFile(`release-asset/${name}`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const encodedName = name.split('/').map(encodeURIComponent).join('/');
  const downloadUrl = `https://github.com/${process.env.REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${encodedName}`;
  return { downloadUrl, sha256, size: bytes.length, megabytes: Math.round(bytes.length / 1024 / 1024) };
}

const mac = await artifact(dmgName);
const windows = await artifact(exeName);
const notes = String(process.env.RELEASE_BODY || '')
  .split(/\r?\n/)
  .map((line) => line.replace(/^[-*]\s*/, '').trim())
  .filter(Boolean);

const manifest = {
  version,
  publishedAt: process.env.PUBLISHED_AT || new Date().toISOString(),
  artifacts: {
    'darwin-arm64': { downloadUrl: mac.downloadUrl, sha256: mac.sha256 },
    'win32-x64': { downloadUrl: windows.downloadUrl, sha256: windows.sha256 },
  },
  // 兼容 2.4.5 及更早的 macOS 客户端。
  platform: 'darwin-arm64',
  downloadUrl: mac.downloadUrl,
  sha256: mac.sha256,
  notes,
};
await writeFile('latest.json', `${JSON.stringify(manifest, null, 2)}\n`);

let html = await readFile('index.html', 'utf8');
html = html.replace(/https:\/\/github\.com\/vanyima\/mashangxiaban-releases\/releases\/download\/v[^"<]+\.dmg/g, mac.downloadUrl);
html = html.replace(/https:\/\/github\.com\/vanyima\/mashangxiaban-releases\/releases\/download\/v[^"<]+\.exe/g, windows.downloadUrl);
html = html.replace(/(<div class="eyebrow"><span>打工人桌面陪伴应用<\/span><em>)V[^<]+/, `$1V${version}`);
html = html.replace(/下载 Windows 版\s+[0-9A-Za-z.+-]+/g, `下载 Windows 版 ${version}`);
html = html.replace(/下载 macOS 版\s+[0-9A-Za-z.+-]+/g, `下载 macOS 版 ${version}`);
html = html.replace(/Windows 10 \/ 11 · x64 · \d+ MB/g, `Windows 10 / 11 · x64 · ${windows.megabytes} MB`);
html = html.replace(/Apple 芯片 · \d+ MB/g, `Apple 芯片 · ${mac.megabytes} MB`);
html = html.replace(/Windows SHA-256 · [a-f0-9]{64}/g, `Windows SHA-256 · ${windows.sha256}`);
html = html.replace(/macOS SHA-256 · [a-f0-9]{64}/g, `macOS SHA-256 · ${mac.sha256}`);
await writeFile('index.html', html);
