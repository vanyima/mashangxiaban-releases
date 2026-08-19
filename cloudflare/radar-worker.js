const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store'
};
const ONLINE_WINDOW_MS = 30 * 60 * 1000;
const STALE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MESSAGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SIGNAL_TYPES = new Set(['water', 'moyu', 'encourage', 'reply']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });
}

function text(value, maxLength, fallback = '') {
  return String(value || '').trim().slice(0, maxLength) || fallback;
}

function validDeviceId(value) {
  return /^[a-f0-9-]{20,80}$/i.test(String(value || ''));
}

function coordinate(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('invalid-location');
  return Math.round(number * 10000) / 10000;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function positionFor(deviceId, distanceKm, radius) {
  let hash = 2166136261;
  for (const char of deviceId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const angle = ((hash >>> 0) % 360) * Math.PI / 180;
  const spread = Math.min(38, 9 + (distanceKm / Math.max(radius, 1)) * 29);
  return { x: Math.round((50 + Math.cos(angle) * spread) * 10) / 10, y: Math.round((50 + Math.sin(angle) * spread) * 10) / 10 };
}

function publicPerson(row, selfLatitude, selfLongitude, radius) {
  const distanceKm = haversineKm(selfLatitude, selfLongitude, row.latitude, row.longitude);
  if (distanceKm > radius) return null;
  const spot = positionFor(row.device_id, distanceKm, radius);
  const proximity = distanceKm <= .05 ? 'within-50m' : distanceKm <= .1 ? 'within-100m' : '';
  return {
    id: row.device_id.slice(0, 8),
    peerId: row.device_id,
    name: text(row.display_name, 24, '匿名工友'),
    status: text(row.status, 16, '搬砖中'),
    copy: text(row.status_copy, 80),
    tone: ['work', 'moyu', 'late'].includes(row.tone) ? row.tone : 'work',
    distanceKm: Math.round(distanceKm * 10) / 10,
    distance: proximity === 'within-50m' ? '50m内' : proximity === 'within-100m' ? '100m内' : distanceKm < 1 ? `${Math.max(100, Math.round(distanceKm * 1000 / 100) * 100)}m` : `${(Math.round(distanceKm * 10) / 10).toFixed(1)}km`,
    proximity,
    x: spot.x,
    y: spot.y,
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function publicMessage(row, selfLatitude, selfLongitude) {
  const distanceMeters = Number.isFinite(Number(row.sender_latitude)) && Number.isFinite(Number(row.sender_longitude))
    ? Math.max(0, Math.round(haversineKm(selfLatitude, selfLongitude, row.sender_latitude, row.sender_longitude) * 1000 / 10) * 10)
    : null;
  return {
    id: row.id,
    fromDeviceId: row.sender_device_id,
    from: text(row.sender_name, 24, '匿名工友'),
    type: SIGNAL_TYPES.has(row.signal_type) ? row.signal_type : 'encourage',
    createdAt: new Date(row.created_at).toISOString(),
    distanceMeters,
    unread: row.read_at == null
  };
}

async function inboxFor(env, deviceId, selfLatitude, selfLongitude) {
  const result = await env.RADAR_DB.prepare(`SELECT m.id, m.sender_device_id, m.sender_name, m.signal_type, m.created_at, m.read_at,
      p.latitude AS sender_latitude, p.longitude AS sender_longitude
    FROM radar_messages m LEFT JOIN radar_presence p ON p.device_id = m.sender_device_id
    WHERE m.recipient_device_id = ? ORDER BY m.created_at DESC LIMIT 50`)
    .bind(deviceId).all();
  const messages = (result.results || []).map((row) => publicMessage(row, selfLatitude, selfLongitude));
  return { messages, unreadCount: messages.filter((message) => message.unread).length };
}

async function parseBody(request) {
  if (!String(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) throw new Error('json-required');
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4096) throw new Error('payload-too-large');
  return request.json();
}

async function sync(request, env) {
  const body = await parseBody(request);
  if (!validDeviceId(body.deviceId)) return json({ ok: false, error: 'invalid-device-id' }, 400);
  const latitude = coordinate(body.latitude, -90, 90);
  const longitude = coordinate(body.longitude, -180, 180);
  const radius = [1, 5, 50].includes(Number(body.radius)) ? Number(body.radius) : 5;
  const now = Date.now();
  await env.RADAR_DB.batch([
    env.RADAR_DB.prepare('DELETE FROM radar_presence WHERE updated_at < ?').bind(now - STALE_WINDOW_MS),
    env.RADAR_DB.prepare('DELETE FROM radar_messages WHERE created_at < ?').bind(now - MESSAGE_RETENTION_MS),
    env.RADAR_DB.prepare(`INSERT INTO radar_presence
      (device_id, display_name, latitude, longitude, status, status_copy, tone, updated_at, app_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        display_name=excluded.display_name, latitude=excluded.latitude, longitude=excluded.longitude,
        status=excluded.status, status_copy=excluded.status_copy, tone=excluded.tone,
        updated_at=excluded.updated_at, app_version=excluded.app_version`)
      .bind(body.deviceId, text(body.name, 24, '匿名工友'), latitude, longitude, text(body.status, 16, '搬砖中'), text(body.copy, 80), ['work', 'moyu', 'late'].includes(body.tone) ? body.tone : 'work', now, text(body.appVersion, 32))
  ]);
  const result = await env.RADAR_DB.prepare(`SELECT device_id, display_name, latitude, longitude, status, status_copy, tone, updated_at
    FROM radar_presence WHERE device_id <> ? AND updated_at >= ? ORDER BY updated_at DESC LIMIT 1000`)
    .bind(body.deviceId, now - ONLINE_WINDOW_MS).all();
  const people = (result.results || []).map((row) => publicPerson(row, latitude, longitude, radius)).filter(Boolean).sort((a, b) => a.distanceKm - b.distanceKm);
  const inbox = await inboxFor(env, body.deviceId, latitude, longitude);
  return json({ ok: true, people, ...inbox, onlineWindowMinutes: 30, precisionDecimals: 4 });
}

async function sendMessage(request, env) {
  const body = await parseBody(request);
  if (!validDeviceId(body.deviceId) || !validDeviceId(body.toDeviceId)) return json({ ok: false, error: 'invalid-device-id' }, 400);
  if (body.deviceId === body.toDeviceId) return json({ ok: false, error: 'cannot-message-self' }, 400);
  const signalType = text(body.type, 16);
  if (!SIGNAL_TYPES.has(signalType)) return json({ ok: false, error: 'invalid-signal-type' }, 400);

  const now = Date.now();
  const presences = await env.RADAR_DB.prepare(`SELECT device_id, latitude, longitude, updated_at FROM radar_presence
    WHERE device_id IN (?, ?) AND updated_at >= ?`)
    .bind(body.deviceId, body.toDeviceId, now - STALE_WINDOW_MS).all();
  const sender = (presences.results || []).find((row) => row.device_id === body.deviceId);
  const recipient = (presences.results || []).find((row) => row.device_id === body.toDeviceId);
  if (!sender || sender.updated_at < now - ONLINE_WINDOW_MS) return json({ ok: false, error: 'sender-not-visible' }, 409);
  if (!recipient) return json({ ok: false, error: 'recipient-unavailable' }, 409);
  if (haversineKm(sender.latitude, sender.longitude, recipient.latitude, recipient.longitude) > 50) {
    return json({ ok: false, error: 'recipient-out-of-range' }, 403);
  }

  const recent = await env.RADAR_DB.prepare('SELECT COUNT(*) AS count FROM radar_messages WHERE sender_device_id = ? AND created_at >= ?')
    .bind(body.deviceId, now - 60 * 1000).first();
  if (Number(recent?.count) >= 10) return json({ ok: false, error: 'too-many-requests' }, 429);

  const inserted = await env.RADAR_DB.prepare(`INSERT INTO radar_messages
    (sender_device_id, recipient_device_id, sender_name, signal_type, created_at, read_at)
    VALUES (?, ?, ?, ?, ?, NULL)`)
    .bind(body.deviceId, body.toDeviceId, text(body.fromName, 24, '匿名工友'), signalType, now).run();
  return json({ ok: true, messageId: inserted.meta?.last_row_id });
}

async function markMessagesRead(request, env) {
  const body = await parseBody(request);
  if (!validDeviceId(body.deviceId)) return json({ ok: false, error: 'invalid-device-id' }, 400);
  await env.RADAR_DB.prepare('UPDATE radar_messages SET read_at = ? WHERE recipient_device_id = ? AND read_at IS NULL')
    .bind(Date.now(), body.deviceId).run();
  return json({ ok: true });
}

async function hide(request, env) {
  const body = await parseBody(request);
  if (!validDeviceId(body.deviceId)) return json({ ok: false, error: 'invalid-device-id' }, 400);
  await env.RADAR_DB.prepare('DELETE FROM radar_presence WHERE device_id = ?').bind(body.deviceId).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, service: 'mashangxiaban-radar' });
      if (request.method === 'POST' && url.pathname === '/v1/radar/sync') return await sync(request, env);
      if (request.method === 'POST' && url.pathname === '/v1/radar/hide') return await hide(request, env);
      if (request.method === 'POST' && url.pathname === '/v1/radar/messages') return await sendMessage(request, env);
      if (request.method === 'POST' && url.pathname === '/v1/radar/messages/read') return await markMessagesRead(request, env);
      return json({ ok: false, error: 'not-found' }, 404);
    } catch (error) {
      const message = text(error?.message, 80, 'server-error');
      const clientError = ['invalid-location', 'json-required', 'payload-too-large'].includes(message);
      return json({ ok: false, error: message }, clientError ? 400 : 500);
    }
  }
};
