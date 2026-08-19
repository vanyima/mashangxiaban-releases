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

  async function post(path, payload) {
    const response = await fetchImpl(`${endpoint}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });
    return readJson(response);
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
        return { ok: true, writeConfigured: true, people: Array.isArray(result.people) ? result.people : [] };
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
    }
  };
}

module.exports = { createCloudflareRadarStore, normalizeRadius, normalizeCoordinate };
