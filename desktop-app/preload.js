const { contextBridge, ipcRenderer } = require('electron');

const petSettingListeners = new WeakMap();

function addPetSettingListener(handler) {
  if (typeof handler !== 'function') return () => {};
  const listener = (_event, settings) => handler(settings);
  petSettingListeners.set(handler, listener);
  ipcRenderer.on('pet:setting-changed', listener);
  return () => {
    ipcRenderer.removeListener('pet:setting-changed', listener);
    petSettingListeners.delete(handler);
  };
}

function removePetSettingListener(handler) {
  const listener = petSettingListeners.get(handler);
  if (!listener) return;
  ipcRenderer.removeListener('pet:setting-changed', listener);
  petSettingListeners.delete(handler);
}

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('desktop:set-always-on-top', enabled),
  setMoodIcon: (mood) => ipcRenderer.invoke('desktop:set-mood-icon', mood),
  setCountdownBadge: (badge) => ipcRenderer.invoke('desktop:set-countdown-badge', badge),
  setDynamicIcon: (dataUrl, label) => ipcRenderer.invoke('desktop:set-dynamic-icon', { dataUrl, label }),
  setDesktopPinned: (enabled) => ipcRenderer.invoke('desktop:set-pinned', enabled),
  openNotificationSettings: () => ipcRenderer.invoke('desktop:open-notification-settings'),
  openFocusSettings: () => ipcRenderer.invoke('desktop:open-focus-settings'),
  notify: (title, body) => ipcRenderer.invoke('desktop:notify', { title, body }),
  setSoundEnabled: (enabled) => ipcRenderer.invoke('desktop:set-sound-enabled', enabled),
  speak: (text) => ipcRenderer.invoke('desktop:speak', text),
  checkForUpdate: () => ipcRenderer.invoke('desktop:check-for-update'),
  downloadUpdate: (update) => ipcRenderer.invoke('desktop:download-update', update),
  saveReportCard: (payload) => ipcRenderer.invoke('desktop:save-report-card', payload),
  onUpdateProgress: (handler) => ipcRenderer.on('desktop:update-progress', handler),
  offUpdateProgress: (handler) => ipcRenderer.removeListener('desktop:update-progress', handler),
  syncReminderSchedule: (shift) => ipcRenderer.invoke('desktop:sync-reminder-schedule', shift),
  onDailyReset: (handler) => ipcRenderer.on('desktop:daily-reset', handler),
  getAutoCheckInSettings: () => ipcRenderer.invoke('desktop:get-auto-check-in-settings'),
  setAutoCheckInEnabled: (enabled) => ipcRenderer.invoke('desktop:set-auto-check-in-enabled', enabled),
  onAutoCheckInRequest: (handler) => ipcRenderer.on('desktop:auto-check-in-request', (_event, payload) => handler(payload)),
  getRadarConfig: () => ipcRenderer.invoke('radar:get-config'),
  syncRadarLocation: (payload) => ipcRenderer.invoke('radar:sync-location', payload),
  hideRadarSelf: () => ipcRenderer.invoke('radar:hide-self'),
  sendRadarSignal: (payload) => ipcRenderer.invoke('radar:send-signal', payload),
  markRadarMessagesRead: () => ipcRenderer.invoke('radar:mark-messages-read'),
  openLocationSettings: () => ipcRenderer.invoke('desktop:open-location-settings'),
  showLocationGuide: () => ipcRenderer.invoke('desktop:show-location-guide'),
  getPetSettings: () => ipcRenderer.invoke('pet:get-settings'),
  setPetEnabled: (enabled) => ipcRenderer.invoke('pet:set-enabled', enabled),
  resetPetPosition: () => ipcRenderer.invoke('pet:reset-position'),
  startPetPatrol: () => ipcRenderer.invoke('pet:start-patrol'),
  syncPetState: (state) => ipcRenderer.invoke('pet:sync-state', state),
  onPetSettingChanged: (handler) => addPetSettingListener(handler),
  offPetSettingChanged: (handler) => removePetSettingListener(handler),
  onPetEnabledChanged: (handler) => ipcRenderer.on('pet:enabled-changed', (_event, enabled) => handler(enabled))
});
