export interface Sample {
  timestamp: number;
  cpu: number;
  memory: number;
  temperature: number | null;
}
export interface DeviceInfo {
  name: string | null;
  os: string | null;
  model: string | null;
  architecture: string | null;
}
export interface Telemetry extends Sample {
  uptime: number;
  interval_seconds: number;
  history: Sample[];
  device: DeviceInfo | null;
}

function parseDeviceInfo(value: unknown): DeviceInfo | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const text = (key: string) => typeof data[key] === 'string' && data[key].trim()
    && data[key].length <= 160 && !/[\u0000-\u001f\u007f]/.test(data[key]) ? data[key].trim() : null;
  return { name: text('name'), os: text('os'), model: text('model'), architecture: text('architecture') };
}

const numberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

function isSample(value: unknown): value is Sample {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return numberIn(s.timestamp, 1, 1e11) && numberIn(s.cpu, 0, 100)
    && numberIn(s.memory, 0, 100)
    && (s.temperature === null || numberIn(s.temperature, -40, 150));
}

export function parseTelemetry(value: unknown, now = Date.now() / 1000): Telemetry {
  if (!value || typeof value !== 'object') throw new Error('Invalid response');
  const data = value as Record<string, unknown>;
  // Older four-field endpoints still work; their history accumulates in this tab.
  const latest = { ...data, timestamp: data.timestamp ?? now };
  if (!isSample(latest) || !numberIn(data.uptime, 0, 1e10)) throw new Error('Invalid metrics');
  const interval = data.interval_seconds ?? 2;
  if (!numberIn(interval, 1, 60)) throw new Error('Invalid interval');
  if (latest.timestamp > now + 30 || now - latest.timestamp > Math.max(15, interval * 3)) {
    throw new Error('Stale metrics');
  }
  const history = data.history ?? [];
  if (!Array.isArray(history) || history.length > 601 || !history.every(isSample)) {
    throw new Error('Invalid history');
  }
  if (history.some(s => s.timestamp > latest.timestamp)) throw new Error('Future history');
  return { timestamp: latest.timestamp, cpu: latest.cpu, memory: latest.memory, temperature: latest.temperature,
    uptime: data.uptime, interval_seconds: interval, history, device: parseDeviceInfo(data.device) };
}

export function mergeHistory(previous: Sample[], data: Telemetry): Sample[] {
  const samples = new Map<number, Sample>();
  // A new boot must not connect its graph to measurements from the previous boot.
  const boot = data.timestamp - data.uptime;
  for (const sample of [...previous, ...data.history, data]) {
    if (sample.timestamp >= Math.max(boot, data.timestamp - 600) && sample.timestamp <= data.timestamp) {
      samples.set(sample.timestamp, sample);
    }
  }
  return [...samples.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-601);
}

export function chartGeometry(
  samples: Sample[], key: 'cpu' | 'memory' | 'temperature', end: number,
  seconds: number, ceiling: number, maxGap: number,
): { line: string; area: string; last: { x: number; y: number } | null; count: number } {
  const segments: { x: number; y: number }[][] = [];
  let segment: { x: number; y: number }[] = [];
  let previous = -Infinity;
  for (const sample of samples) {
    if (sample.timestamp < end - seconds || sample.timestamp > end) continue;
    const value = sample[key];
    if (value === null || sample.timestamp - previous > maxGap) {
      if (segment.length) segments.push(segment);
      segment = [];
    }
    if (value !== null) {
      segment.push({ x: Math.round((sample.timestamp - end + seconds) / seconds * 1000),
        y: Math.round((1 - Math.max(0, Math.min(value, ceiling)) / ceiling) * 200) });
    }
    previous = sample.timestamp;
  }
  if (segment.length) segments.push(segment);
  const path = (s: { x: number; y: number }[]) => s.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  return {
    line: segments.map(path).join(' '),
    area: segments.filter(s => s.length > 1).map(s => `${path(s)} L${s.at(-1)!.x},200 L${s[0].x},200 Z`).join(' '),
    last: segments.at(-1)?.at(-1) ?? null,
    count: segments.reduce((count, s) => count + s.length, 0),
  };
}
