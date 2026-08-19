function clampText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeEndpoint(value) {
  return clampText(value, 500).replace(/\/+$/, '');
}

function normalizeRadius(value) {
  const radius = Number(value);
  return [1, 5, 50].includes(radius) ? radius : 5;
}

function normalizeCoordinate(value, min, max) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) throw new Error('invalid-location');
  return coordinate;
}

const RADAR_SIGNAL_TYPES = Object.freeze(['water', 'moyu', 'encourage', 'reply']);

function normalizeSignalType(value) {
  const type = clampText(value, 16);
  if (!RADAR_SIGNAL_TYPES.includes(type)) throw new Error('invalid-signal-type');
  return type;
}

async function readJson(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(clampText(body?.error, 120) || `cloudflare-${response.status}`);
  if (!body || typeof body !== 'object') throw new Error('invalid-cloudflare-response');
  return body;
}

function createCloudflareRadarStore({ fetchImpl, config, deviceId, appVersion = '' }) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch-required');
  const endpoint = normalizeEndpoint(config?.endpoint);
  if (!endpoint) throw new Error('radar-endpoint-required');
  const configuredTimeout = Number(config?.requestTimeoutMs);
  const requestTimeoutMs = Number.isFinite(configuredTimeout) ? Math.min(30000, Math.max(250, configuredTimeout)) : 12000;

  async function post(path, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchImpl(`${endpoint}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal
      });
      return await readJson(response);
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') throw new Error('cloudflare-timeout');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    source: endpoint,
    writeConfigured: true,

    async syncLocation(payload = {}) {
      try {
        const result = await post('/v1/radar/sync', {
          deviceId,
          appVersion: clampText(appVersion, 32),
          name: clampText(payload.name, 24) || '匿名工友',
          latitude: normalizeCoordinate(payload.latitude, -90, 90),
          longitude: normalizeCoordinate(payload.longitude, -180, 180),
          radius: normalizeRadius(payload.radius),
          status: clampText(payload.status, 16) || '搬砖中',
          copy: clampText(payload.copy, 80),
          tone: ['work', 'moyu', 'late'].includes(payload.tone) ? payload.tone : 'work'
        });
        return {
          ok: true,
          writeConfigured: true,
          people: Array.isArray(result.people) ? result.people : [],
          messages: Array.isArray(result.messages) ? result.messages : [],
          unreadCount: Number(result.unreadCount) || 0
        };
      } catch (error) {
        return { ok: false, writeConfigured: true, reason: error?.message || 'cloudflare-sync-failed', people: [] };
      }
    },

    async hideSelf() {
      try {
        await post('/v1/radar/hide', { deviceId });
        return { ok: true, writeConfigured: true };
      } catch (error) {
        return { ok: false, writeConfigured: true, reason: error?.message || 'cloudflare-hide-failed' };
      }
    },

    async sendSignal(payload = {}) {
      try {
        const result = await post('/v1/radar/messages', {
          deviceId,
          toDeviceId: clampText(payload.toDeviceId, 80),
          fromName: clampText(payload.fromName, 24) || '匿名工友',
          type: normalizeSignalType(payload.type)
        });
        return { ok: true, writeConfigured: true, messageId: result.messageId };
      } catch (error) {
        return { ok: false, writeConfigured: true, reason: error?.message || 'cloudflare-message-failed' };
      }
    },

    async markMessagesRead() {
      try {
        await post('/v1/radar/messages/read', { deviceId });
        return { ok: true, writeConfigured: true };
      } catch (error) {
        return { ok: false, writeConfigured: true, reason: error?.message || 'cloudflare-message-read-failed' };
      }
    }
  };
}

module.exports = { createCloudflareRadarStore, normalizeRadius, normalizeCoordinate, normalizeSignalType };
