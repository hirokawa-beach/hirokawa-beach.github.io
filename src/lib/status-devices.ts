export interface StatusDevice { id: string; name: string; url: string }

function endpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || value !== value.trim()) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash
      && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)));
  } catch { return false; }
}

/** PUBLIC_STATUS_DEVICES replaces the legacy single URL when supplied. */
export function loadStatusDevices(raw = '', legacyUrl = ''): StatusDevice[] {
  if (!raw.trim()) {
    if (!legacyUrl.trim()) return [];
    if (!endpoint(legacyUrl.trim())) throw new Error('PUBLIC_STATUS_API_URL must be an HTTPS URL (HTTP is allowed for localhost).');
    return [{ id: 'default', name: 'Raspberry Pi', url: legacyUrl.trim() }];
  }
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('PUBLIC_STATUS_DEVICES must be a JSON array of {id, name, url}.'); }
  if (!Array.isArray(value) || value.length > 50) throw new Error('PUBLIC_STATUS_DEVICES must contain at most 50 devices.');
  const ids = new Set<string>();
  const urls = new Set<string>();
  return value.map((entry: unknown, index) => {
    const device = entry as Record<string, unknown> | null;
    if (!device || typeof device.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(device.id)
      || typeof device.name !== 'string' || !device.name.trim() || device.name.length > 80
      || /[\u0000-\u001f\u007f]/.test(device.name) || !endpoint(device.url)) {
      throw new Error(`Invalid device ${index + 1} in PUBLIC_STATUS_DEVICES: supply a unique id, name and HTTPS url.`);
    }
    const url = new URL(device.url).href;
    if (ids.has(device.id) || urls.has(url)) throw new Error('PUBLIC_STATUS_DEVICES contains duplicate ids or API URLs.');
    ids.add(device.id); urls.add(url);
    return { id: device.id, name: device.name.trim(), url };
  });
}
