const releaseList = document.querySelector('#releases');
const latestVersion = document.querySelector('#latest-version');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'})
    .format(new Date(value)).replaceAll('/', '.');
}

function renderRelease(release, index) {
  const notes = release.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  const windows = release.artifacts?.windows ? `<a href="${escapeHtml(release.artifacts.windows)}"><b>Windows</b><span>x64 安装包 ↓</span></a>` : '';
  const mac = release.artifacts?.mac ? `<a href="${escapeHtml(release.artifacts.mac)}"><b>macOS</b><span>Apple 芯片 ↓</span></a>` : '';
  return `<article class="release-card${index === 0 ? ' is-latest' : ''}">
    <div class="release-meta"><span>${index === 0 ? 'LATEST / 最新' : 'ARCHIVE / 存档'}</span><strong>V${escapeHtml(release.version)}</strong><time datetime="${escapeHtml(release.publishedAt)}">${formatDate(release.publishedAt)}</time></div>
    <div class="release-content"><h3>${index === 0 ? '这匹马，刚刚更新。' : '那次，马又进化了一点。'}</h3><ul>${notes}</ul><div class="release-downloads">${windows}${mac}</div></div>
  </article>`;
}

fetch('changelog.json')
  .then((response) => { if (!response.ok) throw new Error('更新日志加载失败'); return response.json(); })
  .then((releases) => {
    if (!Array.isArray(releases) || !releases.length) throw new Error('更新日志为空');
    latestVersion.textContent = `V${releases[0].version}`;
    releaseList.innerHTML = releases.map(renderRelease).join('');
  })
  .catch(() => { releaseList.innerHTML = '<p class="release-loading">更新日志暂时走丢了，请稍后刷新页面。</p>'; });
