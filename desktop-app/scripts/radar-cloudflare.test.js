const assert = require('assert');
const { createCloudflareRadarStore, normalizeRadius, normalizeCoordinate, normalizeSignalType } = require('../radar-cloudflare');

assert.equal(normalizeRadius(1), 1);
assert.equal(normalizeRadius('50'), 50);
assert.equal(normalizeRadius(999), 5);
assert.equal(normalizeCoordinate('31.2', -90, 90), 31.2);
assert.throws(() => normalizeCoordinate(181, -180, 180), /invalid-location/);
assert.equal(normalizeSignalType('water'), 'water');
assert.throws(() => normalizeSignalType('custom-text'), /invalid-signal-type/);

const calls = [];
const store = createCloudflareRadarStore({
  endpoint: 'ignored',
  config: { endpoint: 'https://radar.example.test/' },
  deviceId: '11111111-1111-4111-8111-111111111111',
  appVersion: '2.1.3',
  fetchImpl: async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, messageId: 7, people: [{ name: '同事甲', distanceKm: 0.2 }], messages: [{ id: 3, distanceMeters: 200 }], unreadCount: 1 }) };
  }
});

(async () => {
  const result = await store.syncLocation({ name: ' 我 ', latitude: 31.2, longitude: 121.5, radius: 5, tone: 'moyu' });
  assert.equal(result.ok, true);
  assert.equal(result.people.length, 1);
  assert.equal(result.messages[0].distanceMeters, 200);
  assert.equal(result.unreadCount, 1);
  assert.equal(calls[0].url, 'https://radar.example.test/v1/radar/sync');
  assert.equal(calls[0].body.name, '我');
  assert.equal(calls[0].body.deviceId, '11111111-1111-4111-8111-111111111111');
  const hidden = await store.hideSelf();
  assert.equal(hidden.ok, true);
  assert.equal(calls[1].url, 'https://radar.example.test/v1/radar/hide');
  const sent = await store.sendSignal({ toDeviceId: '33333333-3333-4333-8333-333333333333', fromName: '测试工友', type: 'water' });
  assert.equal(sent.ok, true);
  assert.equal(sent.messageId, 7);
  assert.equal(calls[2].url, 'https://radar.example.test/v1/radar/messages');
  assert.equal(calls[2].body.deviceId, '11111111-1111-4111-8111-111111111111');
  assert.equal(calls[2].body.toDeviceId, '33333333-3333-4333-8333-333333333333');
  assert.equal(calls[2].body.type, 'water');
  const read = await store.markMessagesRead();
  assert.equal(read.ok, true);
  assert.equal(calls[3].url, 'https://radar.example.test/v1/radar/messages/read');

  const failing = createCloudflareRadarStore({
    config: { endpoint: 'https://radar.example.test' },
    deviceId: '22222222-2222-4222-8222-222222222222',
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: 'too-many-requests' }) })
  });
  const failure = await failing.syncLocation({ latitude: 0, longitude: 0 });
  assert.equal(failure.ok, false);
  assert.equal(failure.reason, 'too-many-requests');

  const hanging = createCloudflareRadarStore({
    config: { endpoint: 'https://radar.example.test', requestTimeoutMs: 250 },
    deviceId: '44444444-4444-4444-8444-444444444444',
    fetchImpl: (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name:'AbortError' })), { once:true });
    })
  });
  const timedOut = await hanging.syncLocation({ latitude: 0, longitude: 0 });
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.reason, 'cloudflare-timeout');
  console.log('radar-cloudflare tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
