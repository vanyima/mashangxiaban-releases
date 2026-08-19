import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const endpoint = (process.env.RADAR_ENDPOINT || 'https://mashangxiaban-radar.vanyima1126.workers.dev').replace(/\/+$/, '');
const first = randomUUID();
const second = randomUUID();

async function post(path, body) {
  const response = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  assert.equal(response.ok, true, `${path}: ${JSON.stringify(json)}`);
  assert.equal(json.ok, true, `${path}: ${JSON.stringify(json)}`);
  return json;
}

const presence = (deviceId, name, latitude, longitude) => ({
  deviceId,
  name,
  latitude,
  longitude,
  radius: 1,
  status: '测试中',
  copy: '自动化测试记录，会立即删除。',
  tone: 'work',
  appVersion: 'smoke-test'
});

try {
  const health = await fetch(`${endpoint}/health`).then((response) => response.json());
  assert.deepEqual(health, { ok: true, service: 'mashangxiaban-radar' });
  await post('/v1/radar/sync', presence(first, '测试设备甲', 0, 0));
  const seenBySecond = await post('/v1/radar/sync', presence(second, '测试设备乙', 0.0004, 0));
  assert.equal(seenBySecond.people.some((person) => person.name === '测试设备甲'), true);
  const seenByFirst = await post('/v1/radar/sync', presence(first, '测试设备甲', 0, 0));
  const secondPerson = seenByFirst.people.find((person) => person.name === '测试设备乙');
  assert.equal(secondPerson?.proximity, 'within-50m');
  assert.equal(secondPerson?.peerId, second);
  await post('/v1/radar/messages', { deviceId:first, toDeviceId:second, fromName:'测试设备甲', type:'water' });
  const inbox = await post('/v1/radar/sync', presence(second, '测试设备乙', 0.0004, 0));
  const received = inbox.messages.find((message) => message.fromDeviceId === first && message.type === 'water');
  assert.equal(received?.unread, true);
  assert.equal(received?.distanceMeters, 40);
  assert.equal(inbox.unreadCount >= 1, true);
  await post('/v1/radar/messages/read', { deviceId:second });
  const readInbox = await post('/v1/radar/sync', presence(second, '测试设备乙', 0.0004, 0));
  assert.equal(readInbox.messages.find((message) => message.id === received.id)?.unread, false);
  await post('/v1/radar/sync', presence(second, '测试设备乙', 0.0008, 0));
  const seenAtOneHundred = await post('/v1/radar/sync', presence(first, '测试设备甲', 0, 0));
  assert.equal(seenAtOneHundred.people.find((person) => person.name === '测试设备乙')?.proximity, 'within-100m');
  assert.equal(seenByFirst.people.some((person) => 'latitude' in person || 'longitude' in person), false);
  console.log(JSON.stringify({ ok: true, mutualVisibility: true, messaging: true, distanceMeters: received.distanceMeters, markRead: true, within50m: true, within100m: true, coordinatesReturned: false }));
} finally {
  await Promise.allSettled([
    post('/v1/radar/hide', { deviceId: first }),
    post('/v1/radar/hide', { deviceId: second })
  ]);
}
