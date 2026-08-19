const { contextBridge, ipcRenderer } = require('electron');

const on = (channel, handler) => {
  if (typeof handler !== 'function') return () => {};
  const listener = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('petDesktop', {
  platform: process.platform,
  showContextMenu: (details = {}) => ipcRenderer.invoke('pet:show-context-menu', details),
  close: () => ipcRenderer.invoke('pet:close'),
  setIgnoreMouseEvents: (ignore, options = { forward: true }) => ipcRenderer.invoke('pet:set-ignore-mouse-events', Boolean(ignore), options),
  markPointerActivity: (active = true) => ipcRenderer.send('pet:pointer-activity', Boolean(active)),
  startDrag: (point = {}) => ipcRenderer.send('pet:drag-start', {
    ...point,
    x: point.x ?? point.screenX,
    y: point.y ?? point.screenY
  }),
  dragMove: (point = {}) => ipcRenderer.send('pet:drag-move', {
    ...point,
    x: point.x ?? point.screenX,
    y: point.y ?? point.screenY
  }),
  endDrag: (point = {}) => ipcRenderer.send('pet:drag-end', {
    ...point,
    x: point.x ?? point.screenX,
    y: point.y ?? point.screenY
  }),
  getState: () => ipcRenderer.invoke('pet:get-state'),
  onState: (handler) => on('pet:state-changed', handler),
  onSpeak: (handler) => on('pet:speak', handler),
  onAction: (handler) => on('pet:action', handler),
  onReducedMotion: (handler) => on('pet:reduced-motion', handler),
  onDisplayScale: (handler) => on('pet:display-scale-changed', handler)
});
