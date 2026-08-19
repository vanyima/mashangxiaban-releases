const { app, BrowserWindow, ipcMain, Notification, nativeImage, shell, net, session, Menu, screen, dialog, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { createHash, randomUUID } = require('crypto');
const { Readable } = require('stream');
const { expectedExtension, platformKey, resolveUpdateArtifact } = require('./update-manifest');
const { createCloudflareRadarStore } = require('./radar-cloudflare');

let mainWindow;
let petWindow;
let petSettings;
let autoCheckInSettings;
let latestPetState = {};
let petDragSession = null;
let petAvoidanceRestorePosition = null;
let petProgrammaticMoveUntil = 0;
let petPointerInteractionUntil = 0;
let currentPetScale = 0.65;
let currentNativeBadgeKey = null;
let isQuitting = false;
const liveNotifications = new Set();
const reminderTimers = new Map();
let reminderWatchdog = null;
let soundEnabled = true;
let activeSpeechProcess = null;
let radarStore;

const isNotificationSelfTest = process.argv.includes('--test-notification');
const isQaSmoke = process.argv.includes('--qa-smoke');
const isIconPreviewExport = process.argv.includes('--export-icon-previews');
const gotSingleInstanceLock = isNotificationSelfTest || isQaSmoke || isIconPreviewExport || app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();
app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    if (app.isReady()) createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

const legacyUserDataPath = path.join(app.getPath('appData'), '下班请响铃');
app.setName('马上下班');
app.setPath('userData', legacyUserDataPath);
// Keep “马上下班” on its own permanent notification identity. Reusing the old
// “下班请响铃” bundle id left two installed apps competing for the same macOS
// notification registration, so the system could accept a delivery request
// without showing its banner for this app.
app.setAppUserModelId('com.mashangxiaban.companion');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function radarDeviceFile() {
  return path.join(app.getPath('userData'), 'radar-device.json');
}

function getRadarDeviceId() {
  try {
    const saved = JSON.parse(fs.readFileSync(radarDeviceFile(), 'utf8'));
    if (/^[a-f0-9-]{20,80}$/i.test(String(saved?.deviceId || ''))) return saved.deviceId;
  } catch {}
  const deviceId = randomUUID();
  fs.mkdirSync(path.dirname(radarDeviceFile()), { recursive: true });
  fs.writeFileSync(radarDeviceFile(), `${JSON.stringify({ deviceId }, null, 2)}\n`, { mode: 0o600 });
  return deviceId;
}

function getRadarStore() {
  if (radarStore) return radarStore;
  const packageInfo = require('./package.json');
  radarStore = createCloudflareRadarStore({
    fetchImpl: (url, options) => net.fetch(url, options),
    config: packageInfo.radarDataSource,
    deviceId: getRadarDeviceId(),
    appVersion: app.getVersion()
  });
  return radarStore;
}

async function showNativeNotification({ title, body }) {
  if (!Notification.isSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  return new Promise((resolve) => {
    const notification = new Notification({
      title,
      subtitle: process.platform === 'darwin' ? 'OFF DUTY DEPARTMENT' : undefined,
      body,
      silent: !soundEnabled,
      sound: process.platform === 'darwin' && soundEnabled ? 'default' : undefined
    });
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    liveNotifications.add(notification);
    notification.once('show', () => {
      finish({ ok: true, reason: 'shown' });
    });
    notification.once('failed', (_event, error) => finish({ ok: false, reason: error || 'failed' }));
    notification.once('close', () => liveNotifications.delete(notification));
    notification.once('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    notification.show();

    setTimeout(() => finish({ ok: true, reason: 'submitted' }), 650);
    setTimeout(() => liveNotifications.delete(notification), 30000);
  });
}

async function showRendererNotification({ title, body }) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) return { ok: false, reason: 'renderer-unavailable' };
  try {
    const payload = JSON.stringify({ title: String(title || '马上下班'), body: String(body || ''), silent: !soundEnabled });
    return await mainWindow.webContents.executeJavaScript(`(() => new Promise(async (resolve) => {
      try {
        const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (permission !== 'granted') { resolve({ ok:false, reason:'permission-' + permission }); return; }
        window.__visibleNotifications ||= new Set();
        const notification = new Notification(${payload}.title, { body:${payload}.body, silent:${payload}.silent });
        window.__visibleNotifications.add(notification);
        let done = false;
        const finish = (result) => { if (done) return; done = true; resolve(result); };
        notification.onshow = () => finish({ ok:true, reason:'renderer-shown' });
        notification.onerror = () => finish({ ok:false, reason:'renderer-error' });
        notification.onclose = () => window.__visibleNotifications.delete(notification);
        setTimeout(() => finish({ ok:false, reason:'renderer-no-show-event' }), 2500);
        setTimeout(() => window.__visibleNotifications.delete(notification), 30000);
      } catch (error) { resolve({ ok:false, reason:error?.message || 'renderer-exception' }); }
    }))()`);
  } catch (error) {
    return { ok: false, reason: error?.message || 'renderer-execute-failed' };
  }
}

async function showVisibleNotification(payload) {
  const nativeResult = await showNativeNotification(payload);
  if (nativeResult.ok) return nativeResult;
  const rendererResult = await showRendererNotification(payload);
  if (rendererResult.ok) return rendererResult;
  if (process.platform === 'darwin') {
    const scriptResult = await showMacScriptNotification(payload);
    return scriptResult.ok ? scriptResult : { ok: false, reason: `${nativeResult.reason}; ${rendererResult.reason}; ${scriptResult.reason}` };
  }
  return nativeResult;
}

function showMacScriptNotification({ title, body }) {
  return new Promise((resolve) => {
    const script = [
      'on run argv',
      soundEnabled
        ? 'display notification (item 2 of argv) with title (item 1 of argv) sound name "default"'
        : 'display notification (item 2 of argv) with title (item 1 of argv)',
      'end run'
    ];
    const args = script.flatMap((line) => ['-e', line]);
    args.push('--', String(title || '马上下班').slice(0, 120), String(body || '').slice(0, 240));
    execFile('/usr/bin/osascript', args, { timeout: 6000 }, (error) => {
      resolve(error ? { ok: false, reason: error.message || 'osascript-failed' } : { ok: true, reason: 'mac-script-banner' });
    });
  });
}

function speakAnnouncement(text) {
  if (!soundEnabled) return Promise.resolve({ ok: false, reason: 'muted' });
  if (process.platform !== 'darwin') return Promise.resolve({ ok: false, reason: 'native-speech-unavailable' });
  if (activeSpeechProcess) activeSpeechProcess.kill();
  return new Promise((resolve) => {
    const child = execFile('/usr/bin/say', ['-v', 'Tingting', String(text || '').slice(0, 360)], { timeout: 30000 }, (error) => {
      if (activeSpeechProcess === child) activeSpeechProcess = null;
      resolve(error ? { ok: false, reason: error.message || 'speech-failed' } : { ok: true, reason: 'mac-speech' });
    });
    activeSpeechProcess = child;
  });
}

function compareVersions(left, right) {
  const a = String(left || '').split('.').map((value) => Number(value) || 0);
  const b = String(right || '').split('.').map((value) => Number(value) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0) ? 1 : -1;
  }
  return 0;
}

async function checkForAppUpdate() {
  const currentVersion = app.getVersion();
  const manifestUrl = String(require('./package.json').updateManifestUrl || '').trim();
  if (!/^https:\/\//i.test(manifestUrl)) return { ok: false, reason: 'not-configured', currentVersion };
  try {
    const response = await net.fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) return { ok: false, reason: `http-${response.status}`, currentVersion };
    const manifest = await response.json();
    const artifact = resolveUpdateArtifact(manifest, manifestUrl);
    if (!artifact.ok) return { ...artifact, currentVersion };
    const notes = Array.isArray(manifest.notes) ? manifest.notes.join('\n') : String(manifest.notes || '');
    return { ...artifact, currentVersion, notes, available: compareVersions(artifact.latestVersion, currentVersion) > 0 };
  } catch (error) {
    return { ok: false, reason: error?.message || 'network-error', currentVersion };
  }
}

async function downloadAppUpdate(update = {}) {
  const latestVersion = String(update.latestVersion || '');
  const downloadUrl = String(update.downloadUrl || '');
  const expectedHash = String(update.sha256 || '').toLowerCase();
  const currentPlatformKey = platformKey();
  const extension = expectedExtension();
  let downloadPathname = '';
  try { downloadPathname = decodeURIComponent(new URL(downloadUrl).pathname).toLowerCase(); } catch {}
  if (update.platformKey !== currentPlatformKey || !extension || !downloadPathname.endsWith(extension) || !/^https:\/\//i.test(downloadUrl) || !/^[a-f0-9]{64}$/.test(expectedHash) || compareVersions(latestVersion, app.getVersion()) <= 0) {
    return { ok: false, reason: '更新信息无效，请重新检查版本。' };
  }
  const updateDir = path.join(app.getPath('userData'), 'updates');
  fs.mkdirSync(updateDir, { recursive: true });
  const platformLabel = process.platform === 'win32' ? 'Windows-x64' : 'macOS-Apple芯片';
  const filePath = path.join(updateDir, `马上下班-${latestVersion}-${platformLabel}${extension}`);
  const temporaryPath = `${filePath}.download`;
  try {
    const response = await net.fetch(downloadUrl, { cache: 'no-store' });
    if (!response.ok || !response.body) return { ok: false, reason: `下载服务器返回 ${response.status}` };
    const total = Number(response.headers.get('content-length')) || 0;
    let received = 0;
    const hash = createHash('sha256');
    const output = await fs.promises.open(temporaryPath, 'w');
    try {
      for await (const chunk of Readable.fromWeb(response.body)) {
        received += chunk.length; hash.update(chunk); await output.write(chunk);
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('desktop:update-progress', { received, total, percent: total ? received / total * 100 : 0 });
      }
    } finally {
      await output.close();
    }
    const actualHash = hash.digest('hex');
    if (actualHash !== expectedHash) { fs.rmSync(temporaryPath, { force: true }); return { ok: false, reason: '安装包校验失败，已停止安装。' }; }
    fs.renameSync(temporaryPath, filePath);
    const opened = await shell.openPath(filePath);
    return opened ? { ok: false, reason: `安装包已下载，但无法打开：${opened}` } : { ok: true, filePath, version: latestVersion, platformKey: currentPlatformKey };
  } catch (error) {
    try { fs.rmSync(temporaryPath, { force: true }); } catch {}
    return { ok: false, reason: error?.message || '下载失败' };
  }
}

async function showImmediateNotification(payload) {
  const result = await showNativeNotification(payload);
  if (!result.ok && process.platform === 'darwin') {
    const fallback = await showMacScriptNotification(payload);
    return { ...fallback, reason: fallback.ok ? `native-${result.reason}; mac-script-banner` : `${result.reason}; ${fallback.reason}`, windowHidden: false };
  }
  return { ...result, windowHidden: false };
}

const reminderMessages = {
  '3h': ['距离下班还有 3 小时', '今天的戏演到后半场了，体力留着回家做人。'],
  '2h': ['距离下班还有 2 小时', '工作可以继续长，你的工时不该无限续杯。'],
  '1h': ['距离下班还有 1 小时', '撤离倒计时启动。现在开的新坑，通常会埋到自己。'],
  '30m': ['距离下班还有 30 分钟', '停止追加剧情，只允许保存、同步和收拾表情。'],
  '5m': ['距离下班还有 5 分钟', '每一次多余的双击，都可能成为今晚的新事故。'],
  'zero': ['好耶，下班啦！', '今日工位副本通关，快去过自己的生活。'],
  'ot10': ['已超时 10 分钟', '该收拾东西下班了。'],
  'ot30': ['已超时 30 分钟', '别再加钟，早点回去。'],
  'ot60': ['已超时 1 小时', '请立刻下班，别再硬撑。'],
  'ot120': ['已超时 2 小时', '红色提醒：现在就走。'],
  'ot180': ['已超时 3 小时', '停止工作，马上离开工位。']
};

const reminderVoices = {
  zero: '下班，请注意。下班，请注意。',
  ot10: '已经超时。该下班了。',
  ot60: '已经超时一小时。请立刻下班。',
  ot120: '加班已经两小时。红色警报。请马上离开工位。你怎么还在，明天不过了吗？'
};

function scheduleFilePath() {
  return path.join(app.getPath('userData'), 'notification-schedule.json');
}

function readReminderSchedule() {
  try { return JSON.parse(fs.readFileSync(scheduleFilePath(), 'utf8')); } catch { return null; }
}

function writeReminderSchedule(schedule) {
  try { fs.writeFileSync(scheduleFilePath(), JSON.stringify(schedule || null)); } catch (error) { console.error('[reminder-schedule]', error); }
}

function clearReminderTimers(prefix = '') {
  for (const [key, timer] of reminderTimers) {
    if (!prefix || key.startsWith(prefix)) { clearTimeout(timer); reminderTimers.delete(key); }
  }
}

function reminderScheduleIdentity(schedule) {
  if (!schedule) return null;
  return schedule.shiftId ? `id:${schedule.shiftId}` : schedule.startedAt ? `started:${schedule.startedAt}` : null;
}

function isSameReminderSchedule(left, right) {
  const leftIdentity = reminderScheduleIdentity(left);
  return Boolean(leftIdentity && leftIdentity === reminderScheduleIdentity(right));
}

function markReminderDelivered(sourceSchedule, key) {
  const schedule = readReminderSchedule();
  if (!isSameReminderSchedule(schedule, sourceSchedule)) return;
  schedule.delivered = [...new Set([...(schedule.delivered || []), key])];
  writeReminderSchedule(schedule);
}

function shiftResetAt(scheduleOrStartedAt) {
  const explicit = typeof scheduleOrStartedAt === 'object' ? new Date(scheduleOrStartedAt?.resetAt) : null;
  if (explicit && !Number.isNaN(explicit.getTime())) return explicit;
  const startedAt = typeof scheduleOrStartedAt === 'object' ? scheduleOrStartedAt?.startedAt : scheduleOrStartedAt;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const resetAt = new Date(start);
  resetAt.setHours(8, 0, 0, 0);
  if (start >= resetAt) resetAt.setDate(resetAt.getDate() + 1);
  return resetAt;
}

function scheduleActiveShiftReminders(schedule = readReminderSchedule()) {
  clearReminderTimers('shift:');
  if (!schedule?.startedAt || !schedule?.plannedEndAt || schedule.endedAt) return;
  const plannedEnd = Date.parse(schedule.plannedEndAt);
  const resetAt = shiftResetAt(schedule);
  if (!Number.isFinite(plannedEnd) || !resetAt) return;
  if (Date.now() >= resetAt.getTime()) {
    writeReminderSchedule(null);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('desktop:daily-reset');
    return;
  }
  const resetKey = `shift:reset:${schedule.startedAt}`;
  reminderTimers.set(resetKey, setTimeout(() => {
    reminderTimers.delete(resetKey);
    const latest = readReminderSchedule();
    if (!isSameReminderSchedule(latest, schedule)) return;
    writeReminderSchedule(null);
    clearReminderTimers('shift:');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('desktop:daily-reset');
  }, Math.max(250, resetAt.getTime() - Date.now())));
  const points = [
    ['3h', -10800000], ['2h', -7200000], ['1h', -3600000], ['30m', -1800000], ['5m', -300000], ['zero', 0],
    ['ot10', 600000], ['ot30', 1800000], ['ot60', 3600000], ['ot120', 7200000], ['ot180', 10800000]
  ];
  const delivered = new Set(schedule.delivered || []);
  // A sleeping Mac or a just-restored notification permission can make the
  // event loop resume a few seconds after the intended moment. Keep a small
  // recovery window so 5-minute and exact-time reminders are not lost merely
  // because the process did not run on the exact millisecond.
  const recoveryWindow = 2 * 60 * 1000;
  for (const [key, offset] of points) {
    if (delivered.has(key)) continue;
    const reminderAt = plannedEnd + offset;
    if (reminderAt >= resetAt.getTime()) continue;
    const delay = reminderAt - Date.now();
    if (delay < -recoveryWindow || delay > 2147483647) continue;
    const timerKey = `shift:${reminderScheduleIdentity(schedule)}:${key}`;
    reminderTimers.set(timerKey, setTimeout(async () => {
      reminderTimers.delete(timerKey);
      const latest = readReminderSchedule();
      if (!isSameReminderSchedule(latest, schedule) || latest.endedAt) return;
      const [title, body] = reminderMessages[key];
      if (reminderVoices[key]) setTimeout(() => speakAnnouncement(reminderVoices[key]), key === 'zero' ? 3180 : 0);
      const result = await showVisibleNotification({ title, body });
      if (result.ok) markReminderDelivered(schedule, key);
    }, Math.max(250, delay)));
  }
}

function startReminderWatchdog() {
  if (reminderWatchdog) clearInterval(reminderWatchdog);
  reminderWatchdog = setInterval(() => scheduleActiveShiftReminders(), 30000);
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const lunchReminderMessages = Object.freeze([
  { title: '先喂人，再喂需求', body: '十二点了，暂停内耗，开始摄入碳水。下午的命靠这一口续。' },
  { title: '胃部发来紧急需求', body: '饭点已到。你的胃不是可以无限延期的需求，请立即处理。' },
  { title: '键盘临时失去监护权', body: '十二点整，请离开工位去吃饭。键盘会努力照顾好自己。' },
  { title: '午饭会议已经开始', body: '本次会议唯一议题：你什么时候到场？建议现在。' },
  { title: '请勿拿咖啡冒充午饭', body: '液体工牌不算营养。去吃点能用筷子夹起来的东西。' },
  { title: '米饭资产急需补仓', body: '系统检测到胃部空仓，请立即补充碳水和快乐。' },
  { title: '空腹工作风险提示', body: '空腹写出的代码和方案，通常也饿得站不稳。先吃饭。' },
  { title: '老板不会因此上市', body: '少嚼两口并不能加速上市。慢慢吃，午休属于人类。' },
  { title: '需求不会被饿死', body: '先去吃饭。需求有产品经理喂，你的胃目前只有你。' },
  { title: '马歇歇开饭了', body: '它已经掀开饭盒开始炫饭，你再不去就只能云品尝。' }
]);
let lastLunchMessageIndex = -1;

function nextLunchReminderMessage() {
  if (lunchReminderMessages.length < 2) return lunchReminderMessages[0];
  let index = Math.floor(Math.random() * lunchReminderMessages.length);
  if (index === lastLunchMessageIndex) index = (index + 1) % lunchReminderMessages.length;
  lastLunchMessageIndex = index;
  return lunchReminderMessages[index];
}

function triggerPetAction(action, text) {
  if (!readPetSettings().enabled || !petWindow || petWindow.isDestroyed() || petWindow.webContents.isLoading()) return false;
  petWindow.webContents.send('pet:action', { action, text });
  return true;
}

function scheduleLunchReminder() {
  clearReminderTimers('lunch:');
  const now = new Date();
  const lunch = new Date(now); lunch.setHours(12, 0, 0, 0);
  if (lunch <= now) lunch.setDate(lunch.getDate() + 1);
  const key = `lunch:${localDateKey(lunch)}`;
  reminderTimers.set(key, setTimeout(async () => {
    reminderTimers.delete(key);
    const message = nextLunchReminderMessage();
    triggerPetAction('lunch', message.body);
    speakAnnouncement(`${message.title}。${message.body}`);
    await showVisibleNotification(message);
    scheduleLunchReminder();
  }, lunch - now));
}

function syncReminderSchedule(payload) {
  const previous = readReminderSchedule();
  if (!payload?.startedAt || payload.endedAt) {
    if (!payload?.startedAt || !previous || isSameReminderSchedule(previous, payload)) {
      writeReminderSchedule(null);
      scheduleActiveShiftReminders(null);
    }
    return true;
  }
  const schedule = {
    shiftId: payload.shiftId ? String(payload.shiftId) : undefined,
    startedAt: String(payload.startedAt),
    plannedEndAt: String(payload.plannedEndAt),
    resetAt: payload.resetAt ? String(payload.resetAt) : undefined,
    endedAt: null,
    delivered: isSameReminderSchedule(previous, payload) ? previous.delivered || [] : []
  };
  writeReminderSchedule(schedule);
  scheduleActiveShiftReminders(schedule);
  return true;
}

function setAppMoodIcon(mood) {
  const allowedMoods = new Set(['doomed', 'zombie', 'hopeful', 'ready']);
  if (!allowedMoods.has(mood)) return false;
  const image = nativeImage.createFromPath(path.join(__dirname, `icon-${mood}.png`));
  if (image.isEmpty()) return false;

  if (process.platform === 'darwin' && app.dock) app.dock.setIcon(image);
  if (mainWindow && process.platform !== 'darwin') mainWindow.setIcon(image);
  return true;
}

function createWindowsCountdownOverlay(dataUrl) {
  const safeDataUrl = String(dataUrl || '');
  if (!safeDataUrl.startsWith('data:image/png;base64,') || safeDataUrl.length > 200000) return nativeImage.createEmpty();
  return nativeImage.createFromDataURL(safeDataUrl).resize({ width: 32, height: 32 });
}

function setCountdownBadge(payload = {}) {
  const label = String(payload.label || '').slice(0, 8);
  const description = String(payload.description || '下班倒计时').slice(0, 80);

  if (process.platform === 'darwin' && app.dock) {
    const badgeKey = `mac:${label}`;
    if (badgeKey === currentNativeBadgeKey) return true;
    currentNativeBadgeKey = badgeKey;
    app.dock.setBadge(label);
    return true;
  }

  if (process.platform === 'win32' && mainWindow) {
    const badgeKey = `win:${payload.compact}:${payload.tone}`;
    if (badgeKey === currentNativeBadgeKey) return true;
    const overlay = createWindowsCountdownOverlay(payload.overlayDataUrl);
    if (overlay.isEmpty()) return false;
    currentNativeBadgeKey = badgeKey;
    mainWindow.setOverlayIcon(overlay, description);
    return true;
  }

  return false;
}

function setDynamicIcon(payload = {}) {
  const dataUrl = String(payload.dataUrl || '');
  if (!dataUrl.startsWith('data:image/png;base64,') || dataUrl.length > 3000000) return false;
  const image = nativeImage.createFromDataURL(dataUrl);
  if (image.isEmpty()) return false;
  if (process.platform === 'darwin' && app.dock) app.dock.setIcon(image);
  if (mainWindow && process.platform !== 'darwin') mainWindow.setIcon(image);
  return true;
}

function setDesktopPinned(enabled) {
  if (!mainWindow) return { enabled: false };
  const active = Boolean(enabled);
  if (active) {
    if (process.platform === 'darwin') {
      mainWindow.setAlwaysOnTop(true, 'desktop');
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
    } else {
      mainWindow.setAlwaysOnTop(false);
    }
  } else {
    mainWindow.setAlwaysOnTop(false);
    if (process.platform === 'darwin') mainWindow.setVisibleOnAllWorkspaces(false);
  }
  return { enabled: active, platform: process.platform };
}

const PET_LAPTOP_SCALE = 0.65;
const PET_MONITOR_SCALE = 1;
const PET_BASE_WINDOW_SIZE = Object.freeze({ width: 320, height: 390 });
const PET_DEFAULT_ENABLE_MIGRATION = '2.4.12-default-off-v1';

function petScaleForDisplay(display) {
  if (typeof display?.internal === 'boolean') return display.internal ? PET_LAPTOP_SCALE : PET_MONITOR_SCALE;
  const area = display?.workArea || display?.bounds || {};
  return Number(area.width) <= 1600 || Number(area.height) <= 900 ? PET_LAPTOP_SCALE : PET_MONITOR_SCALE;
}

function petWindowSizeForDisplay(display) {
  const scale = petScaleForDisplay(display);
  return {
    width: Math.round(PET_BASE_WINDOW_SIZE.width * scale),
    height: Math.round(PET_BASE_WINDOW_SIZE.height * scale)
  };
}

function sendPetDisplayScale(scale = currentPetScale) {
  if (!petWindow || petWindow.isDestroyed() || petWindow.webContents.isLoading()) return false;
  petWindow.webContents.send('pet:display-scale-changed', scale);
  return true;
}

function autoCheckInSettingsFilePath() {
  return path.join(app.getPath('userData'), 'auto-check-in.json');
}

function readAutoCheckInSettings() {
  if (autoCheckInSettings) return autoCheckInSettings;
  try {
    const saved = JSON.parse(fs.readFileSync(autoCheckInSettingsFilePath(), 'utf8'));
    autoCheckInSettings = { enabled: saved.enabled === true };
  } catch {
    autoCheckInSettings = { enabled: false };
  }
  return autoCheckInSettings;
}

function writeAutoCheckInSettings() {
  try {
    fs.mkdirSync(path.dirname(autoCheckInSettingsFilePath()), { recursive: true });
    fs.writeFileSync(autoCheckInSettingsFilePath(), JSON.stringify(readAutoCheckInSettings(), null, 2));
  } catch (error) {
    console.error('[auto-check-in-settings]', error);
  }
}

function loginItemIsEnabled() {
  try { return app.getLoginItemSettings().openAtLogin === true; } catch { return false; }
}

function getAutoCheckInSettings() {
  const enabled = readAutoCheckInSettings().enabled === true;
  return { enabled, openAtLogin: enabled && loginItemIsEnabled(), supported: ['darwin', 'win32'].includes(process.platform) };
}

function setAutoCheckInEnabled(enabled) {
  const active = Boolean(enabled);
  try {
    app.setLoginItemSettings({ openAtLogin: active });
    readAutoCheckInSettings().enabled = active;
    writeAutoCheckInSettings();
    return { ...getAutoCheckInSettings(), ok: true };
  } catch (error) {
    console.error('[auto-check-in-login-item]', error);
    return { ...getAutoCheckInSettings(), ok: false, reason: error?.message || 'login-item-failed' };
  }
}

function requestAutomaticCheckIn(source = 'system') {
  const now = new Date();
  if (now.getDay() === 0 || now.getDay() === 6 || !readAutoCheckInSettings().enabled || !mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) return false;
  mainWindow.webContents.send('desktop:auto-check-in-request', { source, requestedAt: now.toISOString() });
  return true;
}

function petSettingsFilePath() {
  return path.join(app.getPath('userData'), 'desktop-pet.json');
}

function readPetSettings() {
  if (petSettings) return petSettings;
  try {
    const saved = JSON.parse(fs.readFileSync(petSettingsFilePath(), 'utf8'));
    const needsDefaultEnableMigration = saved.defaultEnableMigration !== PET_DEFAULT_ENABLE_MIGRATION;
    petSettings = {
      enabled: needsDefaultEnableMigration ? false : saved.enabled === true,
      position: Number.isFinite(saved.position?.x) && Number.isFinite(saved.position?.y)
        ? { x: Math.round(saved.position.x), y: Math.round(saved.position.y) }
        : null,
      defaultEnableMigration: PET_DEFAULT_ENABLE_MIGRATION
    };
  } catch {
    petSettings = { enabled: false, position: null, defaultEnableMigration: PET_DEFAULT_ENABLE_MIGRATION };
  }
  return petSettings;
}

function writePetSettings() {
  try {
    fs.mkdirSync(path.dirname(petSettingsFilePath()), { recursive: true });
    fs.writeFileSync(petSettingsFilePath(), JSON.stringify(readPetSettings(), null, 2));
  } catch (error) {
    console.error('[desktop-pet-settings]', error);
  }
}

function defaultPetPosition(display = screen.getPrimaryDisplay()) {
  const area = display.workArea;
  const size = petWindowSizeForDisplay(display);
  return {
    x: Math.round(area.x + area.width - size.width - 22),
    y: Math.round(area.y + area.height - size.height - 18)
  };
}

function clampPetPosition(position, preferredDisplay) {
  const hasPosition = Number.isFinite(position?.x) && Number.isFinite(position?.y);
  const safePosition = hasPosition
    ? { x: Math.round(position.x), y: Math.round(position.y) }
    : defaultPetPosition(preferredDisplay || screen.getPrimaryDisplay());
  const matchingDisplay = preferredDisplay || screen.getDisplayNearestPoint(safePosition);
  const area = matchingDisplay.workArea;
  const size = petWindowSizeForDisplay(matchingDisplay);
  return {
    x: Math.min(Math.max(safePosition.x, area.x), Math.max(area.x, area.x + area.width - size.width)),
    y: Math.min(Math.max(safePosition.y, area.y), Math.max(area.y, area.y + area.height - size.height))
  };
}

function syncPetScaleForDisplay(display) {
  if (!petWindow || petWindow.isDestroyed() || !display) return false;
  const nextScale = petScaleForDisplay(display);
  if (nextScale === currentPetScale) {
    sendPetDisplayScale(nextScale);
    return false;
  }
  currentPetScale = nextScale;
  const [x, y] = petWindow.getPosition();
  const position = clampPetPosition({ x, y }, display);
  const size = petWindowSizeForDisplay(display);
  petProgrammaticMoveUntil = Date.now() + 450;
  petWindow.setBounds({ ...position, ...size }, false);
  readPetSettings().position = position;
  sendPetDisplayScale(nextScale);
  return true;
}

function rectanglesOverlap(left, right, gap = 0) {
  return left.x < right.x + right.width + gap
    && left.x + left.width + gap > right.x
    && left.y < right.y + right.height + gap
    && left.y + left.height + gap > right.y;
}

async function rendererElementScreenBounds(window, selector) {
  if (!window || window.isDestroyed() || window.webContents.isLoading()) return null;
  try {
    const rect = await window.webContents.executeJavaScript(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element || getComputedStyle(element).display === 'none' || getComputedStyle(element).visibility === 'hidden') return null;
      const rect = element.getBoundingClientRect();
      return { x:rect.x, y:rect.y, width:rect.width, height:rect.height };
    })()`);
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const content = window.getContentBounds();
    return { x:content.x + rect.x, y:content.y + rect.y, width:rect.width, height:rect.height };
  } catch { return null; }
}

async function avoidPetMainMascotOverlap({ force = false } = {}) {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || (!force && !mainWindow.isFocused())) return false;
  if (!petWindow || petWindow.isDestroyed() || !petWindow.isVisible() || petDragSession) return false;
  const [hero, petArt] = await Promise.all([
    rendererElementScreenBounds(mainWindow, '#hero-avatar'),
    rendererElementScreenBounds(petWindow, '#pet-sprite')
  ]);
  const gap = 18;
  if (!hero || !petArt || !rectanglesOverlap(hero, petArt, gap)) return false;
  const [windowX, windowY] = petWindow.getPosition();
  const [windowWidth, windowHeight] = petWindow.getSize();
  petAvoidanceRestorePosition ||= { x:windowX, y:windowY };
  const candidates = [
    { x:hero.x - windowWidth - gap, y:windowY },
    { x:hero.x + hero.width + gap, y:windowY },
    { x:windowX, y:hero.y - windowHeight - gap },
    { x:windowX, y:hero.y + hero.height + gap }
  ].map((position) => clampPetPosition(position));
  const preferred = candidates.filter((position) => {
    const movedWindow = { ...position, width:windowWidth, height:windowHeight };
    return !rectanglesOverlap(hero, movedWindow, gap);
  }).sort((left, right) => Math.hypot(left.x-windowX, left.y-windowY)-Math.hypot(right.x-windowX, right.y-windowY))[0];
  if (!preferred) return false;
  petProgrammaticMoveUntil = Date.now() + 450;
  petWindow.setPosition(preferred.x, preferred.y, false);
  return true;
}

function restorePetAfterMainAvoidance() {
  if (!petAvoidanceRestorePosition || !petWindow || petWindow.isDestroyed() || petDragSession) return false;
  const position = clampPetPosition(petAvoidanceRestorePosition);
  petAvoidanceRestorePosition = null;
  petProgrammaticMoveUntil = Date.now() + 450;
  petWindow.setPosition(position.x, position.y, false);
  return true;
}

function notifyMainPetSettingChanged() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const payload = { enabled: readPetSettings().enabled };
  mainWindow.webContents.send('pet:setting-changed', payload);
  mainWindow.webContents.send('pet:enabled-changed', payload.enabled);
}

function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) return petWindow;
  const settings = readPetSettings();
  const initialDisplay = settings.position
    ? screen.getDisplayNearestPoint(settings.position)
    : screen.getPrimaryDisplay();
  currentPetScale = petScaleForDisplay(initialDisplay);
  const windowSize = petWindowSizeForDisplay(initialDisplay);
  const position = clampPetPosition(settings.position, initialDisplay);
  settings.position = position;
  petWindow = new BrowserWindow({
    ...windowSize,
    ...position,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    focusable: false,
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'pet-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  petWindow.setAlwaysOnTop(true, process.platform === 'darwin' ? 'floating' : 'normal');
  if (process.platform === 'darwin') {
    petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  }
  petWindow.loadFile('pet.html');
  petWindow.once('ready-to-show', () => {
    if (!readPetSettings().enabled || !petWindow || petWindow.isDestroyed()) return;
    sendPetDisplayScale();
    syncPetVisibility();
    petWindow.webContents.send('pet:state-changed', latestPetState);
    setTimeout(() => avoidPetMainMascotOverlap(), 120);
  });
  petWindow.on('moved', () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    if (Date.now() < petProgrammaticMoveUntil) return;
    const display = screen.getDisplayMatching(petWindow.getBounds());
    syncPetScaleForDisplay(display);
    const [x, y] = petWindow.getPosition();
    readPetSettings().position = clampPetPosition({ x, y }, display);
  });
  petWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    readPetSettings().enabled = false;
    writePetSettings();
    petWindow.hide();
    notifyMainPetSettingChanged();
  });
  petWindow.on('closed', () => { petWindow = null; petDragSession = null; });
  writePetSettings();
  return petWindow;
}

function syncPetVisibility() {
  if (!petWindow || petWindow.isDestroyed()) return false;
  const shouldShow = readPetSettings().enabled;
  if (shouldShow && !petWindow.webContents.isLoading()) petWindow.showInactive();
  else petWindow.hide();
  return shouldShow;
}

function setPetEnabled(enabled, { notify = false } = {}) {
  const active = Boolean(enabled);
  const settings = readPetSettings();
  settings.enabled = active;
  writePetSettings();
  if (active) {
    const window = createPetWindow();
    const [currentX, currentY] = window.getPosition();
    const display = screen.getDisplayNearestPoint(settings.position || { x:currentX, y:currentY });
    syncPetScaleForDisplay(display);
    const position = clampPetPosition(settings.position, display);
    settings.position = position;
    window.setPosition(position.x, position.y, false);
    if (!window.webContents.isLoading()) {
      syncPetVisibility();
      window.webContents.send('pet:state-changed', latestPetState);
    }
  } else if (petWindow && !petWindow.isDestroyed()) {
    petWindow.hide();
  }
  writePetSettings();
  if (notify) notifyMainPetSettingChanged();
  return { enabled: active, position: settings.position };
}

function resetPetPosition() {
  const display = petWindow && !petWindow.isDestroyed()
    ? screen.getDisplayMatching(petWindow.getBounds())
    : screen.getPrimaryDisplay();
  const position = defaultPetPosition(display);
  syncPetScaleForDisplay(display);
  readPetSettings().position = position;
  writePetSettings();
  if (petWindow && !petWindow.isDestroyed()) petWindow.setPosition(position.x, position.y, true);
  return position;
}

function showPetContextMenu() {
  if (!petWindow || petWindow.isDestroyed()) return false;
  Menu.buildFromTemplate([
    { label: '回到默认位置', click: () => resetPetPosition() },
    { type: 'separator' },
    { label: '关闭桌面宠物', click: () => setPetEnabled(false, { notify: true }) }
  ]).popup({ window: petWindow });
  return true;
}

function movePetDuringDrag(payload = {}) {
  if (!petWindow || petWindow.isDestroyed()) return false;
  let target;
  let preferredDisplay;
  if (petDragSession && Number.isFinite(payload.screenX) && Number.isFinite(payload.screenY)) {
    preferredDisplay = screen.getDisplayNearestPoint({ x: payload.screenX, y: payload.screenY });
    target = {
      x: petDragSession.windowPosition.x + payload.screenX - petDragSession.cursorPosition.x,
      y: petDragSession.windowPosition.y + payload.screenY - petDragSession.cursorPosition.y
    };
  } else if (Number.isFinite(payload.x) && Number.isFinite(payload.y)) {
    target = { x: payload.x, y: payload.y };
  } else if (Number.isFinite(payload.deltaX) && Number.isFinite(payload.deltaY)) {
    const origin = petDragSession?.windowPosition || (() => {
      const [x, y] = petWindow.getPosition(); return { x, y };
    })();
    target = { x: origin.x + payload.deltaX, y: origin.y + payload.deltaY };
  } else if (petDragSession) {
    const cursor = screen.getCursorScreenPoint();
    target = {
      x: petDragSession.windowPosition.x + cursor.x - petDragSession.cursorPosition.x,
      y: petDragSession.windowPosition.y + cursor.y - petDragSession.cursorPosition.y
    };
  } else {
    return false;
  }
  const position = clampPetPosition(target, preferredDisplay);
  if (preferredDisplay) syncPetScaleForDisplay(preferredDisplay);
  petAvoidanceRestorePosition = null;
  petWindow.setPosition(position.x, position.y, false);
  readPetSettings().position = position;
  return position;
}

function startPetDrag(payload = {}) {
  if (!petWindow || petWindow.isDestroyed()) return false;
  const [x, y] = petWindow.getPosition();
  petDragSession = {
    cursorPosition: Number.isFinite(payload.screenX) && Number.isFinite(payload.screenY)
      ? { x: payload.screenX, y: payload.screenY }
      : screen.getCursorScreenPoint(),
    windowPosition: { x, y }
  };
  return true;
}

function endPetDrag(payload) {
  if (payload) movePetDuringDrag(payload);
  petDragSession = null;
  writePetSettings();
  return readPetSettings().position;
}

function createWindow() {
  if (process.platform === 'win32') currentNativeBadgeKey = null;
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 790,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#1f45d8',
    icon: path.join(__dirname, 'app-icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('focus', () => setTimeout(() => avoidPetMainMascotOverlap(), 100));
  mainWindow.on('blur', () => restorePetAfterMainAvoidance());
  mainWindow.on('hide', () => restorePetAfterMainAvoidance());
  mainWindow.on('minimize', () => restorePetAfterMainAvoidance());
  mainWindow.on('restore', () => setTimeout(() => avoidPetMainMascotOverlap(), 100));
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (process.platform !== 'darwin' && !isQuitting) app.quit();
  });
}

function pointInsideBounds(point, bounds) {
  return Boolean(point && bounds
    && point.x >= bounds.x && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y && point.y <= bounds.y + bounds.height);
}

function cursorIsOverVisiblePet(point = screen.getCursorScreenPoint()) {
  return Boolean(petWindow && !petWindow.isDestroyed() && petWindow.isVisible()
    && pointInsideBounds(point, petWindow.getBounds()));
}

function markPetPointerActivity(active = true) {
  // macOS can emit `activate` before the renderer receives the matching click.
  // Keep a short hover/click grace period so a desktop-pet interaction never
  // gets mistaken for a Dock click that should reveal the main window.
  petPointerInteractionUntil = active
    ? Date.now() + 1600
    : Math.max(petPointerInteractionUntil, Date.now() + 260);
}

function shouldSuppressMainActivation() {
  return Date.now() < petPointerInteractionUntil || cursorIsOverVisiblePet();
}

async function runQaSmoke() {
  const outputDir = '/private/tmp/xiaban-countdown-qa';
  fs.mkdirSync(outputDir, { recursive: true });
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const capture = async (name) => {
    const image = await mainWindow.webContents.capturePage();
    fs.writeFileSync(path.join(outputDir, `${name}.png`), image.toPNG());
  };
  const captureRect = async (name, rect) => {
    const image = await mainWindow.webContents.capturePage({
      x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)
    });
    fs.writeFileSync(path.join(outputDir, `${name}.png`), image.toPNG());
  };
  await wait(650);
  await capture('boot-loader');
  await wait(2200);
  const initialState = await mainWindow.webContents.executeJavaScript(`({
    initialStartTime: document.querySelector('#start-time')?.textContent,
    actionHintPresent: Boolean(document.querySelector('#action-note')),
    timePickerPresent: Boolean(document.querySelector('#time-picker-button')),
    planInputType: document.querySelector('#plan-time')?.type,
    planDefault: document.querySelector('#plan-time')?.value,
    planReadOnly: document.querySelector('#plan-time')?.readOnly,
    tapCueVisible: [...document.querySelectorAll('.tap-cue')].some(node => getComputedStyle(node).display !== 'none'),
    todoBoardPresent: Boolean(document.querySelector('#todo-list'))
  })`);
  const petEnabledBeforeQa = readPetSettings().enabled;
  setPetEnabled(false);
  const petSingleClickBefore = await mainWindow.webContents.executeJavaScript(`(async () => {
    await petSettingsReady;
    renderPetSetting(false);
    return {
      enabled:petEnabled,
      pressed:document.querySelector('#pet-toggle').getAttribute('aria-pressed'),
      stored:localStorage.getItem('ma-xiexie-pet-enabled-v1'),
      heroVisible:getComputedStyle(document.querySelector('#hero-avatar')).visibility !== 'hidden' && getComputedStyle(document.querySelector('#hero-avatar')).display !== 'none'
    };
  })()`);
  await mainWindow.webContents.executeJavaScript(`document.querySelector('#pet-toggle').click()`);
  await wait(900);
  const petSingleClickAfter = await mainWindow.webContents.executeJavaScript(`({ enabled:petEnabled, pressed:document.querySelector('#pet-toggle').getAttribute('aria-pressed'), stored:localStorage.getItem('ma-xiexie-pet-enabled-v1') })`);
  const petSingleClick = {
    before: petSingleClickBefore,
    after: petSingleClickAfter,
    mainEnabled: readPetSettings().enabled,
    windowCreated: Boolean(petWindow && !petWindow.isDestroyed()),
    visible: Boolean(petWindow && !petWindow.isDestroyed() && petWindow.isVisible())
  };
  if (petWindow && !petWindow.isDestroyed()) {
    const bounds = petWindow.getBounds();
    petSingleClick.petClickSuppressesMainActivation = cursorIsOverVisiblePet({ x:bounds.x + Math.floor(bounds.width / 2), y:bounds.y + Math.floor(bounds.height / 2) });
    petSingleClick.outsideClickKeepsMainActivation = !cursorIsOverVisiblePet({ x:bounds.x - 12, y:bounds.y - 12 });
    markPetPointerActivity(true);
    petSingleClick.pointerActivitySuppressesActivation = shouldSuppressMainActivation();
    petPointerInteractionUntil = 0;
    const heroBounds = await rendererElementScreenBounds(mainWindow, '#hero-avatar');
    const petArtBounds = await rendererElementScreenBounds(petWindow, '#pet-sprite');
    if (heroBounds && petArtBounds) {
      const originalPetPosition = petWindow.getPosition();
      const forced = clampPetPosition({
        x:originalPetPosition[0] + heroBounds.x - petArtBounds.x,
        y:originalPetPosition[1] + heroBounds.y - petArtBounds.y
      });
      petProgrammaticMoveUntil = Date.now() + 450;
      petWindow.setPosition(forced.x, forced.y, false);
      await wait(120);
      const forcedPetArtBounds = await rendererElementScreenBounds(petWindow, '#pet-sprite');
      petSingleClick.overlapBeforeAvoidance = rectanglesOverlap(heroBounds, forcedPetArtBounds, 18);
      petSingleClick.avoidanceTriggered = await avoidPetMainMascotOverlap({ force:true });
      await wait(220);
      const movedPetArtBounds = await rendererElementScreenBounds(petWindow, '#pet-sprite');
      petSingleClick.overlapAfterAvoidance = rectanglesOverlap(heroBounds, movedPetArtBounds, 18);
      petAvoidanceRestorePosition = null;
      petProgrammaticMoveUntil = Date.now() + 450;
      petWindow.setPosition(originalPetPosition[0], originalPetPosition[1], false);
    }
  }
  const todoCrud = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-todos-v1');
    localStorage.removeItem('ma-xiexie-todos-v1'); renderTodos();
    document.querySelector('#todo-add').click(); document.querySelector('#todo-input').value = '先完成的事项';
    document.querySelector('#todo-composer').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.querySelector('#todo-add').click(); document.querySelector('#todo-input').value = '仍未完成的事项';
    document.querySelector('#todo-composer').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const completedId = getTodos().find(todo => todo.text === '先完成的事项').id;
    document.querySelector('[data-todo-id="' + completedId + '"] .todo-check').click();
    const rendered = [...document.querySelectorAll('.todo-note')].map(note => note.querySelector('.todo-text').textContent);
    document.querySelector('#todo-clear').click(); document.querySelector('#todo-clear').click();
    const result = { ordered: rendered, incompleteFirst: rendered[0] === '仍未完成的事项', clearAllCount: getTodos().length };
    backup === null ? localStorage.removeItem('ma-xiexie-todos-v1') : localStorage.setItem('ma-xiexie-todos-v1', backup); renderTodos();
    return result;
  })()`);
  const todoLayout = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-todos-v1');
    const previousState = document.querySelector('#app').dataset.state; document.querySelector('#app').dataset.state = 'working';
    localStorage.removeItem('ma-xiexie-todos-v1'); renderTodos();
    const board = document.querySelector('.todo-board'); const list = document.querySelector('#todo-list');
    const emptyBoardHeight = board.getBoundingClientRect().height;
    localStorage.setItem('ma-xiexie-todos-v1', JSON.stringify(Array.from({ length: 6 }, (_, index) => ({ id: 'qa-' + index, text: '便利贴 ' + (index + 1), done: index > 2 }))));
    renderTodos();
    const fullBoardHeight = board.getBoundingClientRect().height;
    const result = { emptyBoardHeight, fullBoardHeight, fixedHeight: emptyBoardHeight === fullBoardHeight, listClientHeight: list.clientHeight, listScrollHeight: list.scrollHeight, overflowY: getComputedStyle(list).overflowY };
    document.querySelector('#app').dataset.state = previousState;
    backup === null ? localStorage.removeItem('ma-xiexie-todos-v1') : localStorage.setItem('ma-xiexie-todos-v1', backup); renderTodos();
    return result;
  })()`);
  const automaticPlan = await mainWindow.webContents.executeJavaScript(`(() => {
    const started = new Date(); started.setHours(10, 15, 0, 0);
    const planned = plannedEndFor(started);
    return { started: timeText(started), planned: timeText(planned), durationHours: (planned - started) / 3600000 };
  })()`);
  const heroWorkStages = await mainWindow.webContents.executeJavaScript(`(() => {
    const now = new Date();
    return [.1, 3, 7].map((hours) => {
      const started = new Date(now.getTime() - hours * 3600000);
      const visual = heroMascotVisual({ name:'working', shift:{ startedAt:started.toISOString() } }, now);
      return { hours, key:visual.key, image:visual.image, position:visual.position };
    });
  })()`);
  const initialLayout = await mainWindow.webContents.executeJavaScript(`({
    activePages: [...document.querySelectorAll('.page.is-active')].map(page => page.id),
    todayDisplay: getComputedStyle(document.querySelector('#page-today')).display,
    todayRect: document.querySelector('#page-today').getBoundingClientRect().toJSON(),
    gridRect: document.querySelector('.today-grid').getBoundingClientRect().toJSON(),
    bodyHeight: document.body.scrollHeight
  })`);
  await capture('today');
  const notificationOnboarding = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-active-shift-v1','ma-xiexie-notifications-v1','ma-xiexie-notification-ready-v2','ma-xiexie-notification-onboarding-seen-v1','ma-xiexie-notification-skip-date-v1'];
    const backup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    saveShift(null);
    localStorage.removeItem('ma-xiexie-notifications-v1');
    localStorage.removeItem('ma-xiexie-notification-ready-v2');
    localStorage.removeItem('ma-xiexie-notification-onboarding-seen-v1');
    localStorage.removeItem('ma-xiexie-notification-skip-date-v1');
    applyState('ready'); renderNotificationExperience({ reveal: true });
    window.__qaNotificationBackup = backup;
    return {
      visible: getComputedStyle(document.querySelector('#notification-onboarding')).display !== 'none',
      title: document.querySelector('#notification-onboarding h3')?.textContent,
      body: document.querySelector('#notification-onboarding p')?.textContent,
      bellOff: document.querySelector('#notification-shortcut')?.classList.contains('is-off'),
      readyActionVisible: getComputedStyle(document.querySelector('.side-action-zone .action-button-wrap[data-for="ready"]')).display !== 'none'
    };
  })()`);
  await wait(250);
  await capture('notification-onboarding');
  const notificationClose = await mainWindow.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('#notification-onboarding-close');
    const beforeVisible = getComputedStyle(document.querySelector('#notification-onboarding')).display !== 'none';
    button.click();
    return {
      present: Boolean(button),
      label: button?.getAttribute('aria-label'),
      beforeVisible,
      afterVisible: getComputedStyle(document.querySelector('#notification-onboarding')).display !== 'none',
      onboardingSeen: localStorage.getItem('ma-xiexie-notification-onboarding-seen-v1') === '1'
    };
  })()`);
  await mainWindow.webContents.executeJavaScript(`(() => {
    Object.entries(window.__qaNotificationBackup || {}).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    const next = getState(); applyState(next.name); tick(); renderNotificationExperience();
  })()`);
  const notificationAlreadyEnabled = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-notifications-v1','ma-xiexie-notification-ready-v2','ma-xiexie-notification-onboarding-seen-v1','ma-xiexie-notification-skip-date-v1'];
    const backup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    localStorage.setItem('ma-xiexie-notifications-v1', 'on');
    localStorage.removeItem('ma-xiexie-notification-ready-v2');
    localStorage.removeItem('ma-xiexie-notification-onboarding-seen-v1');
    localStorage.removeItem('ma-xiexie-notification-skip-date-v1');
    notificationPromptVisible = true;
    renderNotificationExperience({ reveal:true });
    const result = { ready:isNotificationReady(), visible:getComputedStyle(document.querySelector('#notification-onboarding')).display !== 'none' };
    Object.entries(backup).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    renderNotificationExperience();
    return result;
  })()`);
  const editablePlan = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-active-shift-v1','ma-xiexie-notification-ready-v2','ma-xiexie-notification-skip-date-v1'];
    const backup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    const started = new Date(); started.setHours(10, 15, 0, 0);
    const automatic = plannedEndFor(started);
    saveShift({ date: dateKey(started), startedAt: started.toISOString(), endedAt: null, plan: timeText(automatic), plannedEndAt: automatic.toISOString() });
    localStorage.setItem('ma-xiexie-notification-ready-v2', dateKey());
    const changed = updatePlannedEnd('23:45');
    const normalized = normalizeShiftPlan(getShift());
    applyState('working'); tick(); renderNotificationExperience();
    window.__qaEditablePlanBackup = backup;
    return {
      changed,
      plan: normalized.plan,
      preservedAfterNormalize: normalized.plan === '23:45',
      inputType: document.querySelector('#plan-time').type,
      inputReadOnly: document.querySelector('#plan-time').readOnly,
      inputValue: document.querySelector('#plan-time').value,
      cue: document.querySelector('.plan-auto-cue').textContent.trim()
    };
  })()`);
  await wait(250);
  await capture('editable-plan-time');
  await mainWindow.webContents.executeJavaScript(`(() => {
    Object.entries(window.__qaEditablePlanBackup || {}).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    const next = getState(); applyState(next.name); tick(); renderNotificationExperience();
  })()`);
  const editableStart = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-active-shift-v1');
    const now = new Date();
    const started = new Date(now.getTime() - 2 * 3600000);
    const automatic = plannedEndFor(started);
    saveShift({ shiftId:'qa-edit-start', date:dateKey(started), startedAt:started.toISOString(), endedAt:null, plan:timeText(automatic), plannedEndAt:automatic.toISOString(), planMode:'automatic' });
    const earlier = new Date(started.getTime() - 30 * 60000);
    const autoChanged = updateStartTime(timeText(earlier));
    const automaticShift = getShift();
    const manualClock = timeText(new Date(now.getTime() + 5 * 3600000));
    const manualChanged = updatePlannedEnd(manualClock);
    const earlierAgain = new Date(started.getTime() - 45 * 60000);
    const manualStartChanged = updateStartTime(timeText(earlierAgain));
    const manualShift = getShift();
    const beforeInvalid = JSON.stringify(manualShift);
    const futureChanged = updateStartTime(timeText(new Date(now.getTime() + 30 * 60000)));
    const invalidPreserved = JSON.stringify(getShift()) === beforeInvalid;
    const ten = new Date(now); ten.setHours(10, 0, 0, 0);
    const resetAt = defaultResetAtForStart(ten);
    const tenEnd = plannedEndFor(ten);
    saveShift({ shiftId:'qa-before-eight', date:dateKey(ten), startedAt:ten.toISOString(), endedAt:null, plan:timeText(tenEnd), plannedEndAt:tenEnd.toISOString(), planMode:'automatic', resetAt:resetAt.toISOString() });
    const beforeEightChanged = updateStartTime('07:30');
    const beforeEightState = getState(now);
    const beforeEightShift = getShift();
    const staleStarted = new Date(now.getTime() - 90 * 60000);
    const staleEnd = plannedEndFor(staleStarted);
    const staleReset = new Date(now.getTime() - 60000);
    saveShift({ shiftId:'qa-editing-guard', date:dateKey(staleStarted), startedAt:staleStarted.toISOString(), endedAt:null, plan:timeText(staleEnd), plannedEndAt:staleEnd.toISOString(), planMode:'automatic', resetAt:staleReset.toISOString() });
    document.querySelector('#start-time').disabled = false;
    document.querySelector('#start-time').dispatchEvent(new FocusEvent('focus'));
    tick();
    const survivedWhileTyping = Boolean(getShift()) && currentState !== 'ready';
    const guardedChanged = updateStartTime(timeText(new Date(staleStarted.getTime() - 10 * 60000)));
    document.querySelector('#start-time').dispatchEvent(new FocusEvent('blur'));
    const guardedShift = getShift();
    const survivedAfterChange = Boolean(guardedShift) && getState(now).name !== 'ready';
    const expiredBoundaryRepaired = new Date(guardedShift?.resetAt) > now;
    backup === null ? saveShift(null) : localStorage.setItem('ma-xiexie-active-shift-v1', backup);
    tick();
    return {
      autoChanged,
      automaticStart: timeText(new Date(automaticShift.startedAt)),
      automaticEnd: automaticShift.plan,
      automaticDurationHours: (new Date(automaticShift.plannedEndAt) - new Date(automaticShift.startedAt)) / 3600000,
      stableShiftId: automaticShift.shiftId === manualShift.shiftId,
      manualChanged,
      manualStartChanged,
      manualEndPreserved: manualShift.plan === manualClock,
      futureRejected: !futureChanged,
      invalidPreserved,
      beforeEightChanged,
      beforeEightStayedActive: Boolean(beforeEightShift) && beforeEightState.name !== 'ready',
      resetBoundaryPreserved: beforeEightShift?.resetAt === resetAt.toISOString(),
      survivedWhileTyping,
      guardedChanged,
      survivedAfterChange,
      expiredBoundaryRepaired
    };
  })()`);
  const partialStartEdit = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-active-shift-v1');
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 3600000);
    start.setSeconds(0, 0);
    const end = plannedEndFor(start);
    saveShift({ shiftId:'qa-partial-start', date:dateKey(start), startedAt:start.toISOString(), endedAt:null, plan:timeText(end), plannedEndAt:end.toISOString(), planMode:'automatic', resetAt:defaultResetAtForStart(now).toISOString() });
    const input = document.querySelector('#start-time');
    input.disabled = false;
    input.value = timeText(start);
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '01:15';
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    const afterFirstDigit = getShift();
    const completeStart = new Date(start.getTime() - 15 * 60000);
    input.value = timeText(completeStart);
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new FocusEvent('blur'));
    const committed = getShift();
    const result = {
      endUnchangedDuringEdit: afterFirstDigit.plannedEndAt === end.toISOString(),
      startUnchangedDuringEdit: afterFirstDigit.startedAt === start.toISOString(),
      committedOnBlur: committed.startedAt === completeStart.toISOString(),
      endRecalculatedAfterCommit: new Date(committed.plannedEndAt) - new Date(committed.startedAt) === 9 * 3600000,
      finalStart: timeText(new Date(committed.startedAt)),
      finalEnd: timeText(new Date(committed.plannedEndAt))
    };
    backup === null ? saveShift(null) : localStorage.setItem('ma-xiexie-active-shift-v1', backup);
    tick();
    return result;
  })()`);
  const shutdownShield = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-todos-v1');
    localStorage.setItem('ma-xiexie-todos-v1', JSON.stringify([
      { id:'qa-finished', text:'已经完成', done:true },
      { id:'qa-pending', text:'未完成任务', done:false }
    ]));
    renderTodos();
    applyState('near');
    const beforeCount = getTodos().length;
    document.querySelector('#todo-add').click();
    const composerBlocked = !document.querySelector('#todo-composer').classList.contains('is-open');
    const noTodoAdded = getTodos().length === beforeCount;
    document.querySelector('#defer-todos').click();
    const deferred = getTodos().find(todo => todo.id === 'qa-pending');
    const completed = getTodos().find(todo => todo.id === 'qa-finished');
    localStorage.setItem('ma-xiexie-todos-v1', JSON.stringify([{ id:'qa-carry', text:'昨天延期', done:false, deferredTo:dateKey() }]));
    const carried = getTodos()[0];
    const result = {
      visible: getComputedStyle(document.querySelector('#shutdown-shield')).display !== 'none',
      composerBlocked,
      noTodoAdded,
      pendingDeferred: deferred?.deferredTo === tomorrowDateKey(),
      completedNotDeferred: !completed?.deferredTo,
      deferredLabelVisible: document.querySelector('[data-todo-id="qa-pending"] .todo-note-status')?.textContent === '明天继续',
      restoredNextDay: !carried?.deferredTo && Boolean(carried?.carriedFrom)
    };
    backup === null ? localStorage.removeItem('ma-xiexie-todos-v1') : localStorage.setItem('ma-xiexie-todos-v1', backup);
    renderTodos();
    const next = getState(); applyState(next.name); tick();
    return result;
  })()`);
  const shutdownLayout = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-todos-v1');
    const shiftBackup = localStorage.getItem('ma-xiexie-active-shift-v1');
    window.__qaShutdownLayoutBackup = backup;
    window.__qaShutdownShiftBackup = shiftBackup;
    const now = new Date(); const start = new Date(now.getTime() - 8 * 3600000 - 45 * 60000); const end = new Date(now.getTime() + 15 * 60000);
    saveShift({ shiftId:'qa-shield-layout', date:dateKey(start), startedAt:start.toISOString(), endedAt:null, plan:timeText(end), plannedEndAt:end.toISOString(), planMode:'manual', resetAt:defaultResetAtForStart(now).toISOString() });
    localStorage.setItem('ma-xiexie-todos-v1', JSON.stringify(Array.from({ length:4 }, (_,index) => ({ id:'qa-shield-' + index, text:'收尾事项 ' + (index + 1), done:false }))));
    document.querySelector('.toast')?.remove(); renderTodos(); tick();
    const board = document.querySelector('.todo-board'); const list = document.querySelector('#todo-list');
    return { boardHeight:board.getBoundingClientRect().height, listClientHeight:list.clientHeight, listScrollHeight:list.scrollHeight, shieldHeight:document.querySelector('#shutdown-shield').getBoundingClientRect().height };
  })()`);
  await wait(180);
  await capture('shutdown-shield');
  await mainWindow.webContents.executeJavaScript(`(() => {
    window.__qaShutdownLayoutBackup === null ? localStorage.removeItem('ma-xiexie-todos-v1') : localStorage.setItem('ma-xiexie-todos-v1', window.__qaShutdownLayoutBackup);
    window.__qaShutdownShiftBackup === null ? localStorage.removeItem('ma-xiexie-active-shift-v1') : localStorage.setItem('ma-xiexie-active-shift-v1', window.__qaShutdownShiftBackup);
    renderTodos(); const next=getState(); applyState(next.name); tick();
  })()`);
  const dateDisplay = await mainWindow.webContents.executeJavaScript(`(() => {
    const start = new Date(); start.setHours(20, 30, 0, 0);
    const end = plannedEndFor(start);
    renderShiftDates(null, start);
    document.querySelector('#start-time').value = timeText(start);
    document.querySelector('#plan-time').value = timeText(end);
    applyState('working');
    return {
      startDate: document.querySelector('#start-date').textContent,
      planDate: document.querySelector('#plan-date').textContent,
      startRelative: document.querySelector('#start-date').dataset.relative,
      planRelative: document.querySelector('#plan-date').dataset.relative,
      startTime: document.querySelector('#start-time').value,
      planTime: document.querySelector('#plan-time').value,
      durationHours: (end - start) / 3600000,
      crossesDay: dateKey(start) !== dateKey(end)
    };
  })()`);
  const planDayToggle = await mainWindow.webContents.executeJavaScript(`(() => {
    const backup = localStorage.getItem('ma-xiexie-active-shift-v1');
    const start = new Date(); start.setHours(10, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1); end.setHours(22, 0, 0, 0);
    saveShift({ shiftId:'qa-plan-day', date:dateKey(start), startedAt:start.toISOString(), endedAt:null, plan:'22:00', plannedEndAt:end.toISOString(), planDayOffset:1, planMode:'manual', resetAt:resetAtAfterPlannedEnd(end).toISOString() });
    tick();
    const before = { label:document.querySelector('#plan-date').textContent, time:document.querySelector('#plan-time').value };
    document.querySelector('#plan-date').click();
    const sameDay = getShift();
    const afterFirst = { label:document.querySelector('#plan-date').textContent, time:document.querySelector('#plan-time').value, offset:calendarDayOffset(new Date(sameDay.startedAt), new Date(sameDay.plannedEndAt)) };
    document.querySelector('#plan-date').click();
    const nextDay = getShift();
    const afterSecond = { label:document.querySelector('#plan-date').textContent, time:document.querySelector('#plan-time').value, offset:calendarDayOffset(new Date(nextDay.startedAt), new Date(nextDay.plannedEndAt)), resetAfterEnd:new Date(nextDay.resetAt) > new Date(nextDay.plannedEndAt) };
    backup === null ? localStorage.removeItem('ma-xiexie-active-shift-v1') : localStorage.setItem('ma-xiexie-active-shift-v1', backup);
    tick();
    return { before, afterFirst, afterSecond };
  })()`);
  console.log(`[qa-plan-day] ${JSON.stringify({ petSingleClick, heroWorkStages, planDayToggle })}`);
  await wait(180);
  await capture('shift-dates-cross-day');
  await mainWindow.webContents.executeJavaScript(`(() => { const next = getState(); applyState(next.name); tick(); })()`);
  const checkoutReport = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-active-shift-v1','ma-xiexie-attendance-v1','ma-xiexie-todos-v1','ma-xiexie-vent-counts-v1'];
    const backup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    const now = new Date();
    const start = new Date(now.getTime() - 9 * 3600000 - 32 * 60000);
    const planned = new Date(now.getTime() - 32 * 60000);
    const day = dateKey(start);
    localStorage.setItem('ma-xiexie-todos-v1', JSON.stringify([
      { id:'qa-report-done', text:'已完成事项', done:true },
      { id:'qa-report-deferred', text:'明天事项', done:false, deferredTo:tomorrowDateKey() }
    ]));
    localStorage.setItem('ma-xiexie-vent-counts-v1', JSON.stringify({ [day]:7 }));
    saveShift({ shiftId:'qa-report', date:day, startedAt:start.toISOString(), endedAt:null, plan:timeText(planned), plannedEndAt:planned.toISOString(), planMode:'manual', resetAt:defaultResetAtForStart(now).toISOString(), healthScoreAtStart:100 });
    finishWork();
    const savedShift = getShift();
    const savedRecord = getRecords().find(record => record.shiftId === 'qa-report');
    const rect = document.querySelector('#checkout-report-card').getBoundingClientRect().toJSON();
    window.__qaCheckoutReportBackup = backup;
    window.__qaCheckoutReportRect = rect;
    return {
      state: document.querySelector('#app').dataset.state,
      reportVisible: getComputedStyle(document.querySelector('#off-shift-summary')).display !== 'none',
      title: document.querySelector('#checkout-report-card h3').textContent,
      stamp: document.querySelector('#report-stamp').textContent,
      start: document.querySelector('#report-start').textContent,
      end: document.querySelector('#report-end').textContent,
      overtime: document.querySelector('#report-overtime').textContent,
      vent: document.querySelector('#report-vent').textContent,
      health: document.querySelector('#report-health').textContent,
      todos: document.querySelector('#report-todos').textContent,
      recordHasReport: Boolean(savedRecord?.report),
      shiftHasReport: Boolean(savedShift?.report),
      saveButtonPresent: Boolean(document.querySelector('#report-save')),
      saveButtonText: document.querySelector('#report-save').textContent,
      cardRect: rect
    };
  })()`);
  await wait(220);
  await capture('checkout-report-page');
  checkoutReport.saveResult = await mainWindow.webContents.executeJavaScript(`window.desktop.saveReportCard({ rect:${JSON.stringify(checkoutReport.cardRect)}, date:'${new Date().toISOString().slice(0,10)}', qaFilePath:'/private/tmp/xiaban-countdown-qa/checkout-report-saved.png' })`);
  await captureRect('checkout-report-card', checkoutReport.cardRect);
  await mainWindow.webContents.executeJavaScript(`(() => {
    Object.entries(window.__qaCheckoutReportBackup || {}).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    renderTodos(); const next = getState(); applyState(next.name); tick();
  })()`);
  const attendanceData = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-active-shift-v1','ma-xiexie-attendance-v1','ma-xiexie-vent-counts-v1'];
    const backup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    const now = new Date();
    const start = new Date(now.getTime() - 2 * 3600000);
    const oldStart = new Date(start.getTime() - 15 * 60000);
    const oldEnd = new Date(now.getTime() - 30 * 60000);
    const plan = plannedEndFor(start);
    const duplicateA = { date:dateKey(now), startedAt:oldStart.toISOString(), endedAt:oldEnd.toISOString(), plan:timeText(oldEnd), plannedEndAt:oldEnd.toISOString(), overtimeMinutes:0 };
    const duplicateB = { ...duplicateA, startedAt:start.toISOString(), endedAt:now.toISOString() };
    saveRecords([duplicateA, duplicateB]);
    saveShift({ shiftId:'qa-attendance-live', date:dateKey(now), startedAt:start.toISOString(), endedAt:null, plan:timeText(plan), plannedEndAt:plan.toISOString(), planMode:'automatic', resetAt:defaultResetAtForStart(now).toISOString() });
    renderLedgerMode('user');
    const renderedDates = [...document.querySelectorAll('#user-dashboard tbody tr td:first-child')].map(node => node.textContent.trim());
    const result = {
      defaultWithData: hasUserLedgerData() ? 'user' : 'mock',
      healedStoredCount: getRecords().length,
      renderedRowCount: renderedDates.length,
      currentDayOccurrences: renderedDates.filter(value => value.startsWith(dateKey(now).slice(5).replace('-', '/'))).length,
      chartRowCount: document.querySelectorAll('#user-dashboard .day-row').length
    };
    saveShift(null); saveRecords([]); localStorage.removeItem('ma-xiexie-vent-counts-v1');
    result.defaultWithoutData = hasUserLedgerData() ? 'user' : 'mock';
    Object.entries(backup).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    renderLedgerMode(hasUserLedgerData() ? 'user' : 'mock');
    return result;
  })()`);
  await mainWindow.webContents.executeJavaScript("document.querySelector('#vent-button').click()");
  await wait(180);
  const ventUi = await mainWindow.webContents.executeJavaScript(`({
    topVentButtonCount: document.querySelectorAll('.top-actions #vent-button').length,
    centerVentButtonCount: document.querySelectorAll('.mascot-vent #vent-button').length,
    floatingCopyCount: document.querySelectorAll('.vent-float-copy').length,
    floatingCopy: document.querySelector('.vent-float-copy')?.textContent.trim() || ''
  })`);
  await capture('vent-float');
  await mainWindow.webContents.executeJavaScript("document.querySelector('[data-page=attendance]').click()");
  await wait(350);
  await capture('attendance-mock');
  await mainWindow.webContents.executeJavaScript("document.querySelector('#data-mode-toggle').click()");
  await wait(350);
  await capture('attendance-user');
  await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-active-shift-v1','ma-xiexie-attendance-v1','ma-xiexie-plan-time-v1'];
    window.__qaStorageBackup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    const at = (offsetDays, hours, minutes) => { const date = new Date(); date.setDate(date.getDate() + offsetDays); date.setHours(hours, minutes, 0, 0); return date; };
    const make = (offsetDays, startHour, startMinute, endHour, endMinute, overtimeMinutes) => {
      const start = at(offsetDays, startHour, startMinute); const end = at(offsetDays, endHour, endMinute); const plan = new Date(end.getTime() - overtimeMinutes * 60000);
      return { date: start.toISOString().slice(0,10), startedAt: start.toISOString(), endedAt: end.toISOString(), plan: String(plan.getHours()).padStart(2,'0') + ':' + String(plan.getMinutes()).padStart(2,'0'), plannedEndAt: plan.toISOString(), overtimeMinutes, epitaph: '“今天到此为止，剩下的让明天继续倒霉。”' };
    };
    localStorage.setItem('ma-xiexie-attendance-v1', JSON.stringify([make(-3,9,6,18,34,34), make(-2,8,47,20,53,900), make(-1,9,14,19,9,69)]));
    renderUserData(); renderHealth();
  })()`);
  await wait(350);
  await capture('attendance-user-data');
  const radarUi = await mainWindow.webContents.executeJavaScript(`(() => {
    const keys = ['ma-xiexie-radar-mode-v1','ma-xiexie-radar-discovery-v1','ma-xiexie-radar-radius-v1','ma-xiexie-radar-name-v1'];
    window.__qaRadarBackup = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    document.querySelector('[data-page=radar]').click();
    const startupDefaults = {
      mode: document.querySelector('#radar-shell').dataset.mode,
      discoveryOn: document.querySelector('#radar-discovery-toggle').getAttribute('aria-pressed') === 'true'
    };
    localStorage.setItem('ma-xiexie-radar-discovery-v1', 'on');
    localStorage.setItem('ma-xiexie-radar-radius-v1', '5');
    renderRadar('mock');
    const firstAction = document.querySelector('#radar-people [data-radar-action]');
    firstAction.click();
    const result = {
      startupDefaults,
      anonymousName: document.querySelector('#radar-self-name').textContent,
      blipCount: document.querySelectorAll('.radar-blip').length,
      cardCount: document.querySelectorAll('.radar-person').length,
      interactionToast: document.querySelector('.toast')?.textContent || '',
      mockVisible: getComputedStyle(document.querySelector('.radar-mock')).display !== 'none',
      compactSelfMarker: document.querySelector('.radar-self > strong')?.textContent === '我',
      discoveryOn: document.querySelector('#radar-discovery-toggle').getAttribute('aria-pressed') === 'true',
      activeRadius: document.querySelector('[data-radar-radius].is-active')?.dataset.radarRadius
    };
    result.proximityMarkers = {
      within50mBlips: document.querySelectorAll('.radar-blip[data-proximity="within-50m"]').length,
      within100mBlips: document.querySelectorAll('.radar-blip[data-proximity="within-100m"]').length,
      within50mCards: document.querySelectorAll('.radar-proximity[data-proximity="within-50m"]').length,
      within100mCards: document.querySelectorAll('.radar-proximity[data-proximity="within-100m"]').length
    };
    const nameInput = document.querySelector('#radar-name-input');
    nameInput.value = '今晚不加班·01';
    document.querySelector('#radar-name-save').click();
    const customName = document.querySelector('#radar-self-name').textContent;
    document.querySelector('#radar-name-dice').click();
    const randomName = document.querySelector('#radar-self-name').textContent;
    result.nameEditor = {
      customName,
      storedCustom: customName === '今晚不加班·01',
      randomName,
      diceChangedName: randomName !== customName,
      builtinCombinationCount: radarNameHeads.length * radarNameTails.length,
      inputSynced: nameInput.value === randomName
    };
    document.querySelector('.toast')?.remove();
    return result;
  })()`);
  await wait(350);
  await capture('radar-mock');
  radarUi.fiftyKm = await mainWindow.webContents.executeJavaScript(`(() => {
    document.querySelector('[data-radar-radius="50"]').click();
    return { blipCount:document.querySelectorAll('.radar-blip').length, cardCount:document.querySelectorAll('.radar-person').length, label:document.querySelector('#radar-range-label').textContent };
  })()`);
  await wait(180);
  await capture('radar-50km');
  radarUi.oneKm = await mainWindow.webContents.executeJavaScript(`(() => {
    document.querySelector('[data-radar-radius="1"]').click();
    return { blipCount:document.querySelectorAll('.radar-blip').length, cardCount:document.querySelectorAll('.radar-person').length, label:document.querySelector('#radar-range-label').textContent };
  })()`);
  await wait(180);
  await capture('radar-1km');
  radarUi.blipSelection = await mainWindow.webContents.executeJavaScript(`(() => {
    document.querySelector('.radar-blip').click();
    return { selectedBlipCount:document.querySelectorAll('.radar-blip.is-selected').length, selectedCardCount:document.querySelectorAll('.radar-person.is-selected').length, nearbyTabVisible:!document.querySelector('#radar-people').hidden };
  })()`);
  radarUi.inbox = await mainWindow.webContents.executeJavaScript(`(() => {
    document.querySelector('[data-radar-tab="inbox"]').click();
    return { visible:!document.querySelector('#radar-inbox').hidden, messageCount:document.querySelectorAll('.radar-message').length, unreadCount:document.querySelectorAll('.radar-message.is-unread').length };
  })()`);
  await wait(180);
  await capture('radar-inbox');
  await mainWindow.webContents.executeJavaScript("document.querySelector('#radar-mode-toggle').click()");
  await wait(250);
  radarUi.realDataVisible = await mainWindow.webContents.executeJavaScript("getComputedStyle(document.querySelector('.radar-data-view')).display !== 'none'");
  radarUi.realDiscoveryOff = await mainWindow.webContents.executeJavaScript(`({
    stored:localStorage.getItem('ma-xiexie-radar-discovery-v1'),
    pressed:document.querySelector('#radar-discovery-toggle').getAttribute('aria-pressed')
  })`);
  await capture('radar-real-empty');
  radarUi.mockDiscoveryOn = await mainWindow.webContents.executeJavaScript(`(async () => {
    await switchRadarMode('mock');
    return {
      stored:localStorage.getItem('ma-xiexie-radar-discovery-v1'),
      pressed:document.querySelector('#radar-discovery-toggle').getAttribute('aria-pressed'),
      visiblePeople:document.querySelectorAll('#radar-people .radar-person').length
    };
  })()`);
  await mainWindow.webContents.executeJavaScript(`(() => {
    Object.entries(window.__qaRadarBackup || {}).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value));
    document.querySelector('[data-page=health]').click();
  })()`);
  await wait(350);
  const healthCurrentHeight = await mainWindow.webContents.executeJavaScript("document.querySelector('.health-shell').getBoundingClientRect().height");
  await capture('health-with-data');
  await mainWindow.webContents.executeJavaScript("document.querySelectorAll('.health-stage-button')[4].click()");
  await wait(350);
  const healthPreviewHeight = await mainWindow.webContents.executeJavaScript("document.querySelector('.health-shell').getBoundingClientRect().height");
  await capture('health-icu');
  await mainWindow.webContents.executeJavaScript("document.querySelectorAll('.health-stage-button')[5].click()");
  await wait(350);
  await capture('health-death');
  await mainWindow.webContents.executeJavaScript(`(() => {
    document.querySelector('[data-page=today]').click();
    applyState('overtime'); renderTimer(38 * 60, 'overtime');
  })()`);
  await wait(350);
  await capture('overtime');
  const offSummary = await mainWindow.webContents.executeJavaScript(`(() => {
    const now = new Date(); const started = new Date(now.getTime() - 5 * 60000); const planned = plannedEndFor(started);
    const shift = { date: dateKey(started), startedAt: started.toISOString(), endedAt: now.toISOString(), plan: timeText(planned), plannedEndAt: planned.toISOString() };
    localStorage.setItem('ma-xiexie-active-shift-v1', JSON.stringify(shift)); tick();
    return {
      state: document.querySelector('#app').dataset.state,
      duration: document.querySelector('#off-summary-duration').textContent,
      summaryDisplay: getComputedStyle(document.querySelector('#off-shift-summary')).display,
      attendanceDisplay: getComputedStyle(document.querySelector('.attendance-main')).display
    };
  })()`);
  await wait(250);
  await capture('off-summary');
  const offSummaryFit = await mainWindow.webContents.executeJavaScript(`(() => {
    const element = document.querySelector('#off-summary-duration');
    element.textContent = '23 小时 59 分钟'; fitOffSummaryDuration();
    return {
      value: element.textContent,
      fontSize: getComputedStyle(element).fontSize,
      whiteSpace: getComputedStyle(element).whiteSpace,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      fits: element.scrollWidth <= element.clientWidth
    };
  })()`);
  const shortOvertime = await mainWindow.webContents.executeJavaScript(`(() => {
    const current = new Date(); current.setHours(0, 22, 0, 0);
    const started = new Date(current); started.setDate(started.getDate() - 1); started.setHours(15, 0, 0, 0);
    const planned = plannedEndFor(started);
    localStorage.setItem('ma-xiexie-active-shift-v1', JSON.stringify({ date: dateKey(started), startedAt: started.toISOString(), endedAt: null, plan: timeText(planned), plannedEndAt: planned.toISOString() }));
    const result = getState(current); applyState(result.name); renderTimer(result.seconds, result.name); updateProgress(current, result);
    return { state: result.name, seconds: result.seconds, timer: document.querySelector('#timer-value').textContent, side: document.querySelector('#side-progress').textContent, label: document.querySelector('#side-progress-label').textContent };
  })()`);
  await wait(250);
  await capture('short-overtime');
  const morningReset = await mainWindow.webContents.executeJavaScript(`(() => {
    const started = new Date(); started.setHours(0, 12, 0, 0);
    const planned = plannedEndFor(started);
    localStorage.setItem('ma-xiexie-active-shift-v1', JSON.stringify({ date: started.toISOString().slice(0,10), startedAt: started.toISOString(), endedAt: null, plan: timeText(planned), plannedEndAt: planned.toISOString() }));
    const afterEight = new Date(); afterEight.setHours(8, 1, 0, 0);
    const result = getState(afterEight);
    return { started: timeText(started), checkedAt: timeText(afterEight), state: result.name, activeShift: Boolean(localStorage.getItem('ma-xiexie-active-shift-v1')) };
  })()`);
  const report = await mainWindow.webContents.executeJavaScript(`({
    electron: Boolean(window.desktop?.isElectron),
    state: document.querySelector('#app')?.dataset.state,
    title: document.title,
    visiblePrototypeText: document.body.innerText.includes('原型'),
    health: document.querySelector('#health-score')?.textContent,
    notificationButton: document.querySelector('#notification-shortcut')?.getAttribute('aria-label'),
    notificationPermission: typeof Notification === 'undefined' ? 'unavailable' : Notification.permission,
    healthCurrentMarkers: document.querySelectorAll('.health-stage-button.is-current').length,
    settingsMenuPresent: Boolean(document.querySelector('#settings-menu')),
    ledgerClearButtonCount: document.querySelectorAll('#clear-attendance-data').length,
    overtimeAlertVisible: getComputedStyle(document.querySelector('.overtime-alert')).display,
    readyActionText: document.querySelector('#work-button')?.textContent.trim()
  })`);
  const handVisibility = await mainWindow.webContents.executeJavaScript(`(() => {
    const root = document.querySelector('#app'); const previous = root.dataset.state;
    const visible = () => [...document.querySelectorAll('.tap-cue')].filter(node => getComputedStyle(node).display !== 'none').length;
    root.dataset.state = 'ready'; const ready = visible();
    root.dataset.state = 'working'; const working = visible();
    root.dataset.state = 'checkout'; const checkout = visible();
    root.dataset.state = 'overtime'; const overtime = visible();
    root.dataset.state = previous;
    return { ready, working, checkout, overtime };
  })()`);
  const pinOn = setDesktopPinned(true);
  const pinOff = setDesktopPinned(false);
  const iconDurationLabels = await mainWindow.webContents.executeJavaScript(`({
    underHour: formatOvertimeIconDuration(59 * 60 + 59),
    oneHour: formatOvertimeIconDuration(60 * 60),
    decimalHour: formatOvertimeIconDuration(90 * 60)
  })`);
  let petQa = { available: false };
  if (petWindow && !petWindow.isDestroyed()) {
    // QA captures the pet while the main window is focused. Production hides
    // it in that situation to avoid overlapping the in-app mascot.
    petWindow.showInactive();
    const petState = async (payload, name, settleMs = 360) => {
      latestPetState = payload;
      await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.setState(${JSON.stringify(payload)})`);
      await wait(settleMs);
      const result = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
      const image = await petWindow.webContents.capturePage();
      fs.writeFileSync(path.join(outputDir, `${name}.png`), image.toPNG());
      return result;
    };
    const early = await petState({ stage:'early', healthScore:100, healthLevel:0, reducedMotion:false }, 'pet-early');
    const helpBefore = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    await petWindow.webContents.executeJavaScript(`document.querySelector('#help-chip').click()`);
    await wait(120);
    const helpAfter = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    await wait(420);
    const earlyNext = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    await wait(2600);
    const earlyRest = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    const lunchCopy = lunchReminderMessages[0].body;
    const lunchStarted = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.playLunch(${JSON.stringify(lunchCopy)}); window.MA_XIEXIE_PET.getState()`);
    await wait(1450);
    const lunchEating = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    const lunchImage = await petWindow.webContents.capturePage();
    fs.writeFileSync(path.join(outputDir, 'pet-lunch-eating.png'), lunchImage.toPNG());
    await wait(3300);
    const lunchFinished = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    const weary = await petState({ stage:'weary', healthScore:52, healthLevel:2, reducedMotion:false }, 'pet-weary');
    const overtime2 = await petState({ stage:'overtime2', healthScore:72, healthLevel:1, reducedMotion:false }, 'pet-overtime-angry');
    const overtime4 = await petState({ stage:'overtime4', healthScore:8, healthLevel:4, reducedMotion:false }, 'pet-overtime4');
    await wait(4700);
    const collapsed = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    const nearPacking = await petState({ stage:'near', healthScore:78, healthLevel:1, reducedMotion:false }, 'pet-near-packing', 180);
    await wait(3600);
    const packed = await petWindow.webContents.executeJavaScript(`window.MA_XIEXIE_PET.getState()`);
    const gaze = await petWindow.webContents.executeJavaScript(`(() => {
      const pet = document.querySelector('#pet');
      const rect = pet.getBoundingClientRect();
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.right - 18, clientY: rect.top + rect.height * .38, bubbles: true }));
      return window.MA_XIEXIE_PET.getState();
    })()`);
    const hydration = await petWindow.webContents.executeJavaScript(`(() => {
      document.querySelector('#speech-bubble').hidden = true;
      window.MA_XIEXIE_PET.setState({ stage:'steady', shiftId:'qa-hydration', workedMinutes:59, healthScore:100, healthLevel:0 });
      window.MA_XIEXIE_PET.setState({ stage:'steady', shiftId:'qa-hydration', workedMinutes:60, healthScore:100, healthLevel:0 });
      return window.MA_XIEXIE_PET.getState();
    })()`);
    const activeDisplay = screen.getDisplayMatching(petWindow.getBounds());
    syncPetScaleForDisplay({ ...activeDisplay, internal:false });
    await wait(120);
    const monitorBounds = petWindow.getBounds();
    const monitorImage = await petWindow.webContents.capturePage();
    fs.writeFileSync(path.join(outputDir, 'pet-monitor-size.png'), monitorImage.toPNG());
    syncPetScaleForDisplay({ ...activeDisplay, internal:true });
    await wait(120);
    const laptopBounds = petWindow.getBounds();
    syncPetScaleForDisplay(activeDisplay);
    petQa = {
      available: true,
      adaptiveSizing: {
        laptopScale: petScaleForDisplay({ internal:true }),
        monitorScale: petScaleForDisplay({ internal:false }),
        activeDisplay: activeDisplay.internal,
        activeScale: currentPetScale,
        laptopBounds,
        monitorBounds,
        sizeSwitchWorks: laptopBounds.width === 208 && laptopBounds.height === 254 && monitorBounds.width === 320 && monitorBounds.height === 390
      },
      early,
      defaultEnabled: readPetSettings().enabled,
      visibleAtLaunch: petWindow.isVisible(),
      helpClickWorks: helpAfter.hintIndex === helpBefore.hintIndex + 1 && helpAfter.speechVisible && Boolean(helpAfter.speechText),
      helpBefore,
      helpAfter,
      earlyNext,
      frameAdvanced: early.motion === earlyNext.motion && early.frame !== earlyNext.frame,
      quietCadence: earlyRest.motion === early.motion && earlyRest.resting === true,
      earlyRest,
      lunch: {
        messageCount: lunchReminderMessages.length,
        uniqueMessages: new Set(lunchReminderMessages.map((message) => `${message.title}\n${message.body}`)).size,
        started: lunchStarted,
        eating: lunchEating,
        finished: lunchFinished,
        resumedStage: lunchFinished.stage === early.stage && lunchFinished.motion === early.motion
      },
      weary,
      overtime2,
      overtime4,
      collapsed,
      nearPacking,
      packed,
      gaze,
      hydration: {
        triggeredAtOneHour: hydration.lastHydrationHour === 1 && hydration.speechVisible,
        text: hydration.speechText
      },
      trueFrameRenderer: early.renderer === 'frame-atlas-v2' && early.spriteLayers === 1 && early.fakeEyeLayers === 0,
      transparent: petWindow.isVisible()
    };
  }
  await mainWindow.webContents.executeJavaScript(`Object.entries(window.__qaStorageBackup || {}).forEach(([key,value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key,value))`);
  setPetEnabled(petEnabledBeforeQa);
  console.log(`[qa-smoke] ${JSON.stringify({ ...initialState, petSingleClick, todoCrud, todoLayout, automaticPlan, initialLayout, notificationOnboarding, notificationClose, notificationAlreadyEnabled, editablePlan, editableStart, partialStartEdit, shutdownShield, shutdownLayout, dateDisplay, planDayToggle, checkoutReport, attendanceData, radarUi, ventUi, healthCurrentHeight, healthPreviewHeight, offSummary, offSummaryFit, shortOvertime, morningReset, ...report, handVisibility, pinOn, pinOff, iconDurationLabels, petQa, outputDir })}`);
  app.quit();
}

app.whenReady().then(() => {
  const allowedRendererPermissions = new Set(['notifications', 'geolocation']);
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => allowedRendererPermissions.has(permission));
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => callback(allowedRendererPermissions.has(permission)));
  const openLocationSettings = async () => {
    const settingsUrl = process.platform === 'darwin'
      ? 'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices'
      : process.platform === 'win32' ? 'ms-settings:privacy-location' : '';
    if (!settingsUrl) return { ok: false, reason: 'unsupported-platform' };
    try {
      if (process.platform === 'darwin') {
        await new Promise((resolve, reject) => execFile('/usr/bin/open', [settingsUrl], (error) => error ? reject(error) : resolve()));
      } else {
        await shell.openExternal(settingsUrl);
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error?.message || 'settings-open-failed' };
    }
  };
  ipcMain.handle('desktop:set-always-on-top', (_event, enabled) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(Boolean(enabled), 'floating');
    return Boolean(enabled);
  });
  ipcMain.handle('desktop:open-location-settings', openLocationSettings);
  ipcMain.handle('desktop:show-location-guide', async () => {
    if (process.platform !== 'win32') return openLocationSettings();
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '开启 Windows 定位权限',
      message: '请在同一个“位置”设置页面开启 3 个选项',
      detail: '1. 定位服务\n2. 允许应用访问你的位置\n3. 向下滚动，开启“允许桌面应用访问你的位置”\n\n完成后返回马上下班，应用会自动重新尝试。',
      buttons: ['打开定位设置', '暂不开启'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (result.response !== 0) return { ok: false, canceled: true };
    return openLocationSettings();
  });

  ipcMain.handle('desktop:notify', (_event, payload) => showImmediateNotification(payload));
  ipcMain.handle('desktop:set-sound-enabled', (_event, enabled) => {
    soundEnabled = Boolean(enabled);
    if (!soundEnabled && activeSpeechProcess) { activeSpeechProcess.kill(); activeSpeechProcess = null; }
    return soundEnabled;
  });
  ipcMain.handle('desktop:speak', (_event, text) => speakAnnouncement(text));
  ipcMain.handle('desktop:check-for-update', () => checkForAppUpdate());
  ipcMain.handle('desktop:download-update', (_event, update) => downloadAppUpdate(update));
  ipcMain.handle('desktop:save-report-card', async (_event, payload = {}) => {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, reason: 'window-unavailable' };
    const raw = payload?.rect || {};
    const [contentWidth, contentHeight] = mainWindow.getContentSize();
    const x = Math.max(0, Math.round(Number(raw.x) || 0));
    const y = Math.max(0, Math.round(Number(raw.y) || 0));
    const width = Math.min(contentWidth - x, Math.max(1, Math.round(Number(raw.width) || 0)));
    const height = Math.min(contentHeight - y, Math.max(1, Math.round(Number(raw.height) || 0)));
    if (width < 120 || height < 120) return { ok: false, reason: 'invalid-card-bounds' };
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(payload?.date || '')) ? payload.date : new Date().toISOString().slice(0, 10);
    const qaPath = path.resolve(String(payload?.qaFilePath || ''));
    let filePath = '';
    if (isQaSmoke && path.dirname(qaPath) === '/private/tmp/xiaban-countdown-qa' && path.extname(qaPath).toLowerCase() === '.png') {
      filePath = qaPath;
    } else {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: '保存今日下班小结',
        defaultPath: path.join(app.getPath('pictures'), `马歇歇-今日下班小结-${date}.png`),
        filters: [{ name: 'PNG 图片', extensions: ['png'] }]
      });
      if (result.canceled || !result.filePath) return { ok: false, canceled: true };
      filePath = result.filePath;
    }
    const image = await mainWindow.webContents.capturePage({ x, y, width, height });
    await fs.promises.writeFile(filePath, image.toPNG());
    return { ok: true, filePath };
  });
  ipcMain.handle('desktop:sync-reminder-schedule', (_event, payload) => syncReminderSchedule(payload));
  ipcMain.handle('desktop:get-auto-check-in-settings', () => getAutoCheckInSettings());
  ipcMain.handle('desktop:set-auto-check-in-enabled', (_event, enabled) => setAutoCheckInEnabled(enabled));
  ipcMain.handle('desktop:set-mood-icon', (_event, mood) => setAppMoodIcon(mood));
  ipcMain.handle('desktop:set-countdown-badge', (_event, payload) => setCountdownBadge(payload));
  ipcMain.handle('desktop:set-dynamic-icon', (_event, payload) => setDynamicIcon(payload));
  ipcMain.handle('desktop:set-pinned', (_event, enabled) => setDesktopPinned(enabled));
  ipcMain.handle('radar:get-config', () => {
    const store = getRadarStore();
    return { source: store.source, writeConfigured: store.writeConfigured };
  });
  ipcMain.handle('radar:sync-location', (_event, payload = {}) => getRadarStore().syncLocation(payload));
  ipcMain.handle('radar:hide-self', () => getRadarStore().hideSelf());
  ipcMain.handle('radar:send-signal', (_event, payload = {}) => getRadarStore().sendSignal(payload));
  ipcMain.handle('radar:mark-messages-read', () => getRadarStore().markMessagesRead());
  ipcMain.handle('pet:get-settings', () => ({ ...readPetSettings() }));
  ipcMain.handle('pet:set-enabled', (_event, enabled) => setPetEnabled(typeof enabled === 'object' ? enabled?.enabled : enabled));
  ipcMain.handle('pet:reset-position', () => resetPetPosition());
  ipcMain.handle('pet:sync-state', (_event, state) => {
    latestPetState = state && typeof state === 'object' ? state : {};
    if (petWindow && !petWindow.isDestroyed() && !petWindow.webContents.isLoading()) {
      petWindow.webContents.send('pet:state-changed', latestPetState);
    }
    return true;
  });
  ipcMain.handle('pet:get-state', () => ({ ...latestPetState, enabled: readPetSettings().enabled, displayScale: currentPetScale }));
  ipcMain.handle('pet:show-context-menu', () => showPetContextMenu());
  ipcMain.handle('pet:close', () => setPetEnabled(false, { notify: true }));
  ipcMain.handle('pet:set-ignore-mouse-events', (_event, ignore, options = {}) => {
    if (!petWindow || petWindow.isDestroyed()) return false;
    petWindow.setIgnoreMouseEvents(Boolean(ignore), Boolean(ignore) && options?.forward ? { forward: true } : undefined);
    return true;
  });
  ipcMain.on('pet:pointer-activity', (_event, active) => markPetPointerActivity(active !== false));
  ipcMain.handle('pet:drag-start', (_event, payload) => startPetDrag(payload));
  ipcMain.handle('pet:drag-move', (_event, payload) => movePetDuringDrag(payload));
  ipcMain.handle('pet:drag-end', (_event, payload) => endPetDrag(payload));
  ipcMain.on('pet:drag-start', (_event, payload) => startPetDrag(payload));
  ipcMain.on('pet:drag-move', (_event, payload) => movePetDuringDrag(payload));
  ipcMain.on('pet:drag-end', (_event, payload) => endPetDrag(payload));
  ipcMain.handle('desktop:open-notification-settings', async () => {
    const url = process.platform === 'darwin'
      ? 'x-apple.systempreferences:com.apple.Notifications-Settings.extension'
      : process.platform === 'win32'
        ? 'ms-settings:notifications'
        : null;
    if (!url) return false;
    await shell.openExternal(url);
    return true;
  });
  ipcMain.handle('desktop:open-focus-settings', async () => {
    if (process.platform !== 'darwin') return false;
    await shell.openExternal('x-apple.systempreferences:com.apple.Focus-Settings.extension');
    return true;
  });

  createWindow();
  mainWindow.webContents.once('did-finish-load', () => requestAutomaticCheckIn('startup'));
  if (readPetSettings().enabled) createPetWindow();
  const keepPetOnScreen = () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    const display = screen.getDisplayMatching(petWindow.getBounds());
    syncPetScaleForDisplay(display);
    const position = clampPetPosition(petWindow.getBounds(), display);
    petWindow.setPosition(position.x, position.y, false);
    readPetSettings().position = position;
    writePetSettings();
  };
  screen.on('display-added', keepPetOnScreen);
  screen.on('display-removed', keepPetOnScreen);
  screen.on('display-metrics-changed', keepPetOnScreen);
  powerMonitor.on('resume', () => requestAutomaticCheckIn('resume'));
  powerMonitor.on('unlock-screen', () => requestAutomaticCheckIn('unlock'));
  scheduleActiveShiftReminders();
  startReminderWatchdog();
  scheduleLunchReminder();
  if (process.argv.includes('--qa-smoke')) {
    mainWindow.webContents.once('did-finish-load', () => {
      runQaSmoke().catch((error) => {
        console.error(`[qa-smoke] ${error.stack || error}`);
        app.exit(1);
      });
    });
  }
  if (process.argv.includes('--test-notification')) {
    setTimeout(async () => {
      const result = await showVisibleNotification({
        title: '马上下班 · 系统提醒自检 ✓',
        body: '可见横幅通知通道正在工作。'
      });
      console.log(`[notification-self-test] ${JSON.stringify(result)}`);
      setTimeout(() => app.quit(), 1200);
    }, 800);
  }
  if (process.argv.includes('--test-renderer-notification')) {
    mainWindow.webContents.once('did-finish-load', async () => {
      const result = await mainWindow.webContents.executeJavaScript(`(async () => {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return { ok:false, permission };
        new Notification('马上下班 · 新通知通道自检', { body:'这条消息由现代网页通知通道发送。', silent:false });
        return { ok:true, permission };
      })()`);
      console.log(`[renderer-notification-self-test] ${JSON.stringify(result)}`);
    });
  }
  if (process.argv.includes('--test-icons')) {
    const moods = ['doomed', 'zombie', 'hopeful', 'ready'];
    moods.forEach((mood, index) => {
      setTimeout(() => {
        const ok = setAppMoodIcon(mood);
        console.log(`[icon-self-test] ${mood}=${ok}`);
      }, 700 + index * 700);
    });
  }
  if (isIconPreviewExport) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const previews = await mainWindow.webContents.executeJavaScript(`({
        countdown: createDockIconDataUrl({ name:'working', seconds:5*3600+37*60 })?.dataUrl,
        near: createDockIconDataUrl({ name:'near', seconds:5*60+42 })?.dataUrl,
        overtime: createDockIconDataUrl({ name:'overtime', seconds:2*3600+8*60 })?.dataUrl
      })`);
      const previewDir = '/private/tmp/xiaban-countdown-icon-previews';
      fs.mkdirSync(previewDir, { recursive: true });
      for (const [name, dataUrl] of Object.entries(previews)) {
        if (dataUrl) fs.writeFileSync(path.join(previewDir, `${name}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
      }
      console.log(`[icon-previews] ${previewDir}`);
      app.quit();
    });
  }
  if (process.argv.includes('--test-badge')) {
    mainWindow.webContents.once('did-finish-load', async () => {
      const dataUrl = await mainWindow.webContents.executeJavaScript("createCountdownOverlayDataUrl('9m', 'urgent')");
      const overlay = createWindowsCountdownOverlay(dataUrl);
      const ok = setCountdownBadge({ label: '09:42', compact: '9m', tone: 'urgent', description: '距离下班还有 9 分 42 秒' });
      console.log(`[badge-self-test] badge=${ok} overlay=${!overlay.isEmpty()}`);
    });
  }
  app.on('activate', () => {
    // Clicking the non-focusable pet can activate the owning macOS app. Keep
    // that click as a pet interaction instead of unexpectedly opening the
    // main window. Dock clicks occur outside the pet bounds and still work.
    if (shouldSuppressMainActivation()) return;
    if (!mainWindow || mainWindow.isDestroyed()) createWindow();
    else { mainWindow.show(); mainWindow.focus(); }
    if (readPetSettings().enabled) createPetWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition();
    readPetSettings().position = clampPetPosition({ x, y });
    writePetSettings();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
