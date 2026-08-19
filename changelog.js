const releaseList = document.querySelector('#releases');
const latestVersion = document.querySelector('#latest-version');

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function formatPublishedAt(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { date: '时间待确认', time: '--:--:--', hour: null };

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return {
    date: `${values.year}.${values.month}.${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
    hour: Number(values.hour),
  };
}

function getAfterMidnightTag(hour, releaseIndex) {
  if (!Number.isInteger(hour) || hour < 0 || hour >= 6) return null;
  const tags = [
    { symbol: '☾', label: '马还没睡', tone: 'moon' },
    { symbol: '✦', label: '夜班修马', tone: 'deep' },
    { symbol: '☀', label: '太阳接班', tone: 'dawn' },
  ];
  return tags[releaseIndex % tags.length];
}

function renderRelease(release, index) {
  const publishedAt = formatPublishedAt(release.publishedAt);
  const afterMidnightTag = getAfterMidnightTag(publishedAt.hour, index);
  const notes = release.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  const windows = index === 0 && release.artifacts?.windows ? `<a href="${escapeHtml(release.artifacts.windows)}"><b>Windows</b><span>x64 安装包 ↓</span></a>` : '';
  const mac = index === 0 && release.artifacts?.mac ? `<a href="${escapeHtml(release.artifacts.mac)}"><b>macOS</b><span>Apple 芯片 ↓</span></a>` : '';
  const downloads = windows || mac ? `<div class="release-downloads" aria-label="最新版本安装包">${windows}${mac}</div>` : '';
  const nightTag = afterMidnightTag ? `<span class="after-midnight-tag" data-night-shift="${afterMidnightTag.tone}" title="凌晨发布"><i aria-hidden="true">${afterMidnightTag.symbol}</i>${afterMidnightTag.label}</span>` : '';
  return `<article class="release-card${index === 0 ? ' is-latest' : ''}">
    <div class="release-meta"><span class="release-kind">${index === 0 ? 'LATEST / 最新' : 'ARCHIVE / 存档'}</span><strong>V${escapeHtml(release.version)}</strong><div class="release-published"><time datetime="${escapeHtml(release.publishedAt)}"><b>${publishedAt.date}</b><em>${publishedAt.time}</em></time>${nightTag}</div></div>
    <div class="release-content"><h3>${index === 0 ? '这匹马，刚刚更新。' : '那次，马又进化了一点。'}</h3><ul>${notes}</ul>${downloads}</div>
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
