const assert = require('assert');
const { createCloudflareRadarStore, normalizeRadius, normalizeCoordinate } = require('../radar-cloudflare');

assert.equal(normalizeRadius(1), 1);
assert.equal(normalizeRadius('50'), 50);
assert.equal(normalizeRadius(999), 5);
assert.equal(normalizeCoordinate('31.2', -90, 90), 31.2);
assert.throws(() => normalizeCoordinate(181, -180, 180), /invalid-location/);

const calls = [];
const store = createCloudflareRadarStore({
  endpoint: 'ignored',
  config: { endpoint: 'https://radar.example.test/' },
  deviceId: '11111111-1111-4111-8111-111111111111',
  appVersion: '2.1.3',
  fetchImpl: async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ ok: true, people: [{ name: '同事甲', distanceKm: 0.2 }] }) };
  }
});

(async () => {
  const result = await store.syncLocation({ name: ' 我 ', latitude: 31.2, longitude: 121.5, radius: 5, tone: 'moyu' });
  assert.equal(result.ok, true);
  assert.equal(result.people.length, 1);
  assert.equal(calls[0].url, 'https://radar.example.test/v1/radar/sync');
  assert.equal(calls[0].body.name, '我');
  assert.equal(calls[0].body.deviceId, '11111111-1111-4111-8111-111111111111');
  const hidden = await store.hideSelf();
  assert.equal(hidden.ok, true);
  assert.equal(calls[1].url, 'https://radar.example.test/v1/radar/hide');

  const failing = createCloudflareRadarStore({
    config: { endpoint: 'https://radar.example.test' },
    deviceId: '22222222-2222-4222-8222-222222222222',
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: 'too-many-requests' }) })
  });
  const failure = await failing.syncLocation({ latitude: 0, longitude: 0 });
  assert.equal(failure.ok, false);
  assert.equal(failure.reason, 'too-many-requests');
  console.log('radar-cloudflare tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
