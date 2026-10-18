import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTelemetry, mergeHistory, chartGeometry } from '../src/lib/telemetry.ts';

const point = (timestamp, overrides = {}) => ({ timestamp, cpu: 25, memory: 40, temperature: 50, ...overrides });
const payload = (overrides = {}) => ({ ...point(1000), uptime: 900, interval_seconds: 2, history: [point(998), point(1000)], ...overrides });

test('accepts missing sensor without inventing a temperature', () => {
  assert.equal(parseTelemetry(payload({ temperature: null }), 1000).temperature, null);
});
test('accepts the original four-field endpoint', () => {
  const result = parseTelemetry({ cpu: 12, memory: 40, temperature: 50, uptime: 100 }, 1000);
  assert.equal(result.timestamp, 1000);
  assert.deepEqual(result.history, []);
});
test('rejects stale, future, invalid and excessive responses', () => {
  for (const data of [payload({ timestamp: 900, history: [] }), payload({ timestamp: 1040 }),
    payload({ cpu: NaN }), payload({ memory: '40' }), payload({ temperature: 999 }),
    payload({ uptime: -1 }), payload({ interval_seconds: 0 }), payload({ history: [point(1001)] }),
    payload({ history: [point(999, { cpu: 101 })] }), payload({ history: Array(602).fill(point(999)) })]) {
    assert.throws(() => parseTelemetry(data, 1000));
  }
});
test('sorts and deduplicates history, trims to ten minutes and removes pre-boot points', () => {
  const result = mergeHistory([point(100), point(999), point(998)], parseTelemetry(payload(), 1000));
  assert.deepEqual(result.map(x => x.timestamp), [998, 999, 1000]);
  assert.equal(mergeHistory([point(990)], parseTelemetry(payload({ uptime: 2, history: [] }), 1000)).length, 1);
});
test('maps actual time and percentage to chart coordinates', () => {
  const result = chartGeometry([point(880, { cpu: 0 }), point(1000, { cpu: 100 })], 'cpu', 1000, 120, 100, 150);
  assert.equal(result.line, 'M0,200 L1000,0');
  assert.ok(result.area.endsWith('L1000,200 L0,200 Z'));
});
test('missing sensor readings and collection gaps leave separate segments', () => {
  const data = [point(990), point(992, { temperature: null }), point(994), point(1000)];
  const missing = chartGeometry(data, 'temperature', 1000, 120, 100, 10);
  assert.equal(missing.line.split('M').length - 1, 2);
  const gap = chartGeometry([point(900), point(1000)], 'cpu', 1000, 120, 100, 10);
  assert.equal(gap.line.split('M').length - 1, 2);
  assert.equal(gap.area, '');
});
test('empty and single samples do not fabricate a filled history', () => {
  assert.deepEqual(chartGeometry([], 'cpu', 1000, 120, 100, 10), { line: '', area: '', last: null, count: 0 });
  const single = chartGeometry([point(1000)], 'cpu', 1000, 120, 100, 10);
  assert.equal(single.count, 1);
  assert.equal(single.area, '');
});
