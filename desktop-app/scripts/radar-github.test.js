'use strict';

const assert = require('assert');
const { nearbyPeople, parseCsv, serializeCsv } = require('../radar-github');

const rows = [{
  device_id: 'other-device', display_name: '带逗号,的工友', latitude: '31.231', longitude: '121.474',
  status: '摸鱼中', status_copy: '测试 "CSV" 转义', tone: 'moyu', updated_at: '2026-08-19T04:00:00.000Z', app_version: '2.5.0'
}];
const roundTrip = parseCsv(serializeCsv(rows));
assert.strictEqual(roundTrip[0].display_name, rows[0].display_name);
assert.strictEqual(roundTrip[0].status_copy, rows[0].status_copy);

const nearby = nearbyPeople(roundTrip, { latitude: 31.230, longitude: 121.473 }, {
  deviceId: 'self-device', radius: 1, now: Date.parse('2026-08-19T04:10:00.000Z')
});
assert.strictEqual(nearby.length, 1);
assert.strictEqual(nearby[0].name, rows[0].display_name);
assert.ok(nearby[0].distanceKm > 0 && nearby[0].distanceKm < 1);
assert.ok(nearby[0].x >= 5 && nearby[0].x <= 95);
assert.ok(nearby[0].y >= 5 && nearby[0].y <= 95);

const stale = nearbyPeople(roundTrip, { latitude: 31.230, longitude: 121.473 }, {
  radius: 50, now: Date.parse('2026-08-19T05:00:01.000Z')
});
assert.strictEqual(stale.length, 0);

console.log('radar-github tests passed');
