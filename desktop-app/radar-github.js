'use strict';

const RADAR_COLUMNS = Object.freeze([
  'device_id',
  'display_name',
  'latitude',
  'longitude',
  'status',
  'status_copy',
  'tone',
  'updated_at',
  'app_version'
]);

const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const RETENTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function parseCsv(text = '') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const input = String(text).replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const nonEmptyRows = rows.filter((values) => values.some((value) => value !== ''));
  if (!nonEmptyRows.length) return [];
  const headers = nonEmptyRows[0].map((value) => value.trim());
  return nonEmptyRows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function serializeCsv(rows = []) {
  const lines = [RADAR_COLUMNS.join(',')];
  rows.forEach((row) => lines.push(RADAR_COLUMNS.map((column) => csvCell(row[column])).join(',')));
  return `${lines.join('\n')}\n`;
}

function clampText(value, length) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, length);
}

function normalizeCoordinate(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('invalid-location');
  // About 110 metres of precision at the equator: enough for the 1 km mode,
  // while avoiding a trail of device-grade exact coordinates in the shared file.
  return number.toFixed(3);
}

function normalizeRow(row = {}) {
  const updatedAt = new Date(row.updated_at);
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!clampText(row.device_id, 80) || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Number.isNaN(updatedAt.getTime())) return null;
  return {
    device_id: clampText(row.device_id, 80),
    display_name: clampText(row.display_name, 18) || '匿名工友',
    latitude: latitude.toFixed(3),
    longitude: longitude.toFixed(3),
    status: clampText(row.status, 12) || '工位在线',
    status_copy: clampText(row.status_copy, 80) || '正在附近安静搬砖。',
    tone: ['moyu', 'late', 'work'].includes(row.tone) ? row.tone : 'work',
    updated_at: updatedAt.toISOString(),
    app_version: clampText(row.app_version, 24)
  };
}

function radians(degrees) { return degrees * Math.PI / 180; }

function distanceKm(leftLatitude, leftLongitude, rightLatitude, rightLongitude) {
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(rightLatitude - leftLatitude);
  const longitudeDelta = radians(rightLongitude - leftLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(leftLatitude)) * Math.cos(radians(rightLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(leftLatitude, leftLongitude, rightLatitude, rightLongitude) {
  const start = radians(leftLatitude);
  const end = radians(rightLatitude);
  const longitudeDelta = radians(rightLongitude - leftLongitude);
  const y = Math.sin(longitudeDelta) * Math.cos(end);
  const x = Math.cos(start) * Math.sin(end) - Math.sin(start) * Math.cos(end) * Math.cos(longitudeDelta);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function formatDistance(distance) {
  if (distance < 0.2) return '约 0.2km 内';
  if (distance < 1) return `约 ${distance.toFixed(1)}km`;
  return `约 ${distance.toFixed(distance < 10 ? 1 : 0)}km`;
}

function nearbyPeople(rows, location, { deviceId = '', radius = 50, now = Date.now() } = {}) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('invalid-location');
  const safeRadius = [1, 5, 50].includes(Number(radius)) ? Number(radius) : 5;
  return rows.map(normalizeRow).filter(Boolean).filter((row) => (
    row.device_id !== deviceId && now - new Date(row.updated_at).getTime() <= ACTIVE_WINDOW_MS
  )).map((row) => {
    const distance = distanceKm(latitude, longitude, Number(row.latitude), Number(row.longitude));
    const bearing = bearingDegrees(latitude, longitude, Number(row.latitude), Number(row.longitude));
    const visualDistance = Math.min(0.88, 0.18 + Math.sqrt(Math.max(0, distance / safeRadius)) * 0.7);
    const angle = radians(bearing - 90);
    return {
      id: row.device_id.slice(0, 12),
      name: row.display_name,
      status: row.status,
      copy: row.status_copy,
      tone: row.tone,
      distanceKm: Number(distance.toFixed(3)),
      distance: formatDistance(distance),
      x: Number((50 + Math.cos(angle) * visualDistance * 50).toFixed(1)),
      y: Number((50 + Math.sin(angle) * visualDistance * 50).toFixed(1)),
      updatedAt: row.updated_at
    };
  }).filter((person) => person.distanceKm <= safeRadius).sort((left, right) => left.distanceKm - right.distanceKm);
}

function githubHeaders(token = '') {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function createGitHubRadarStore({ fetchImpl, config, token = '', deviceId, appVersion = '', now = () => Date.now() }) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch-required');
  const owner = clampText(config?.owner, 80);
  const repo = clampText(config?.repo, 100);
  const branch = clampText(config?.branch, 100) || 'main';
  const filePath = String(config?.path || 'data/radar-users.csv').replace(/^\/+/, '');
  const rawUrl = clampText(config?.readUrl, 500) || `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;

  async function fetchPublicRows() {
    const response = await fetchImpl(`${rawUrl}?t=${now()}`, { headers: { Accept: 'text/csv' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`github-read-${response.status}`);
    return parseCsv(await response.text());
  }

  async function fetchContents() {
    const response = await fetchImpl(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers: githubHeaders(token), cache: 'no-store' });
    if (!response.ok) throw new Error(`github-read-${response.status}`);
    const result = await response.json();
    return { sha: result.sha, rows: parseCsv(Buffer.from(String(result.content || '').replace(/\n/g, ''), 'base64').toString('utf8')) };
  }

  async function putRows(rows, sha, message) {
    const response = await fetchImpl(apiUrl, {
      method: 'PUT',
      headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, branch, sha, content: Buffer.from(serializeCsv(rows), 'utf8').toString('base64') })
    });
    if (!response.ok) throw new Error(`github-write-${response.status}`);
    return response.json();
  }

  async function mutate(update, message) {
    if (!token) throw new Error('write-not-configured');
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const current = await fetchContents();
        const cutoff = now() - RETENTION_WINDOW_MS;
        const rows = current.rows.map(normalizeRow).filter(Boolean).filter((row) => new Date(row.updated_at).getTime() >= cutoff);
        const nextRows = update(rows);
        await putRows(nextRows, current.sha, message);
        return nextRows;
      } catch (error) {
        lastError = error;
        if (!String(error?.message).includes('github-write-409')) break;
      }
    }
    throw lastError;
  }

  async function readNearby(location, radius) {
    const rows = await fetchPublicRows();
    return nearbyPeople(rows, location, { deviceId, radius, now: now() });
  }

  async function syncLocation(payload = {}) {
    const location = {
      latitude: Number(normalizeCoordinate(payload.latitude, -90, 90)),
      longitude: Number(normalizeCoordinate(payload.longitude, -180, 180))
    };
    const row = normalizeRow({
      device_id: deviceId,
      display_name: payload.name,
      latitude: location.latitude,
      longitude: location.longitude,
      status: payload.status,
      status_copy: payload.copy,
      tone: payload.tone,
      updated_at: new Date(now()).toISOString(),
      app_version: appVersion
    });
    try {
      const rows = await mutate(
        (current) => [...current.filter((item) => item.device_id !== deviceId), row],
        `radar: update ${deviceId.slice(0, 8)}`
      );
      return { ok: true, writeConfigured: true, people: nearbyPeople(rows, location, { deviceId, radius: payload.radius, now: now() }) };
    } catch (error) {
      let people = [];
      try { people = await readNearby(location, payload.radius); } catch {}
      return { ok: false, writeConfigured: Boolean(token), reason: error?.message || 'github-sync-failed', people };
    }
  }

  async function hideSelf() {
    try {
      await mutate((rows) => rows.filter((row) => row.device_id !== deviceId), `radar: hide ${deviceId.slice(0, 8)}`);
      return { ok: true, writeConfigured: true };
    } catch (error) {
      return { ok: false, writeConfigured: Boolean(token), reason: error?.message || 'github-hide-failed' };
    }
  }

  return { readNearby, syncLocation, hideSelf, writeConfigured: Boolean(token), source: `${owner}/${repo}/${filePath}` };
}

module.exports = {
  ACTIVE_WINDOW_MS,
  RADAR_COLUMNS,
  createGitHubRadarStore,
  distanceKm,
  nearbyPeople,
  parseCsv,
  serializeCsv
};
