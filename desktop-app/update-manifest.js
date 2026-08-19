function platformKey(platform = process.platform, arch = process.arch) {
  return `${platform}-${arch}`;
}

function expectedExtension(platform = process.platform) {
  if (platform === 'darwin') return '.dmg';
  if (platform === 'win32') return '.exe';
  return '';
}

function resolveUpdateArtifact(manifest, manifestUrl, platform = process.platform, arch = process.arch) {
  const key = platformKey(platform, arch);
  const latestVersion = String(manifest?.version || '').trim();
  const artifacts = manifest?.artifacts && typeof manifest.artifacts === 'object' ? manifest.artifacts : null;
  let artifact = artifacts?.[key] || null;

  // 兼容已经发布的单平台 Mac 清单；仅在 platform 明确匹配时启用，
  // 防止 Windows 客户端误把旧清单里的 DMG 当成自己的更新。
  if (!artifact && String(manifest?.platform || '') === key) {
    artifact = { downloadUrl: manifest.downloadUrl, sha256: manifest.sha256 };
  }

  if (!artifact) return { ok: false, reason: 'platform-unavailable', platformKey: key, latestVersion };

  const rawUrl = String(artifact.downloadUrl || artifact.url || '').trim();
  const sha256 = String(artifact.sha256 || '').trim().toLowerCase();
  let downloadUrl = '';
  try { downloadUrl = new URL(rawUrl, manifestUrl).href; } catch {}
  const extension = expectedExtension(platform);
  let pathname = '';
  try { pathname = decodeURIComponent(new URL(downloadUrl).pathname).toLowerCase(); } catch {}

  if (!latestVersion || !/^https:\/\//i.test(downloadUrl) || !/^[a-f0-9]{64}$/.test(sha256) || !extension || !pathname.endsWith(extension)) {
    return { ok: false, reason: 'invalid-manifest', platformKey: key, latestVersion };
  }

  return { ok: true, latestVersion, downloadUrl, sha256, platformKey: key, extension };
}

module.exports = { expectedExtension, platformKey, resolveUpdateArtifact };
