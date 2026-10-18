import { chartGeometry, mergeHistory, parseTelemetry, type Sample, type Telemetry } from '../lib/telemetry';

const board = document.querySelector<HTMLElement>('[data-status-board]');
if (board) {
  const apiUrl = board.dataset.apiUrl ?? '';
  const pauseButton = board.querySelector<HTMLButtonElement>('[data-status-pause]')!;
  const connection = board.querySelector<HTMLElement>('#connection')!;
  const updated = board.querySelector<HTMLElement>('#updated')!;
  let samples: Sample[] = [];
  let latest: Telemetry | null = null;
  let range = 120;
  let paused = false;
  let pollInterval = 3000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | null = null;
  let generation = 0;

  const setText = (id: string, text: string) => { board.querySelector<HTMLElement>(`#${id}`)!.textContent = text; };
  const state = (name: string, text: string) => {
    board.dataset.state = name;
    if (connection.textContent !== text) connection.textContent = text;
    connection.dataset.state = name;
  };
  const render = () => {
    if (!latest) return;
    const end = latest.timestamp;
    const bounds = samples.filter(s => s.timestamp >= end - range);
    for (const figure of board.querySelectorAll<HTMLElement>('[data-chart]')) {
      const key = figure.dataset.chart as 'cpu' | 'memory' | 'temperature';
      const unit = key === 'temperature' ? '°C' : '%';
      const geometry = chartGeometry(bounds, key, end, range, 100, Math.max(10, latest.interval_seconds * 3));
      figure.querySelector('[data-chart-line]')!.setAttribute('d', geometry.line);
      figure.querySelector('[data-chart-area]')!.setAttribute('d', geometry.area);
      const empty = figure.querySelector<HTMLElement>('[data-chart-empty]')!;
      empty.hidden = geometry.count > 1;
      empty.textContent = key === 'temperature' && latest.temperature === null ? '温度センサーを取得できません' : '計測データを蓄積中';
      const value = latest[key];
      figure.querySelector('[data-chart-value]')!.textContent = value === null ? '取得不可' : value.toFixed(1) + unit;
      const numeric = bounds.map(s => s[key]).filter((v): v is number => v !== null);
      const title = figure.querySelector('h3')!.textContent;
      figure.querySelector('svg')!.setAttribute('aria-label', numeric.length
        ? `${title}、直近${range / 60}分。最新${value === null ? '取得不可' : value.toFixed(1) + unit}、最小${Math.min(...numeric).toFixed(1)}${unit}、最大${Math.max(...numeric).toFixed(1)}${unit}。`
        : `${title}、温度センサーを取得できません。`);
      figure.querySelector('[data-chart-start]')!.textContent = `${range / 60}分前`;
      figure.querySelector('[data-chart-end]')!.textContent = new Date(end * 1000).toLocaleTimeString('ja-JP');
    }
  };

  const refresh = async () => {
    clearTimeout(timer);
    if (!apiUrl || paused || document.hidden) return;
    const version = ++generation;
    request?.abort();
    const controller = new AbortController();
    request = controller;
    if (latest && Date.now() / 1000 - latest.timestamp > 15) {
      state('connecting', '再接続中');
      for (const id of ['cpu', 'memory', 'temperature', 'uptime']) setText(id, '--');
    }
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(apiUrl, { cache: 'no-store', signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('Unavailable');
      const data = parseTelemetry(await response.json());
      if (version !== generation) return;
      samples = mergeHistory(samples, data);
      latest = data;
      setText('cpu', data.cpu.toFixed(1) + '%');
      setText('memory', data.memory.toFixed(1) + '%');
      setText('temperature', data.temperature === null ? '取得不可' : data.temperature.toFixed(1) + '°C');
      const minutes = Math.floor(data.uptime / 60);
      setText('uptime', minutes >= 1440 ? `${Math.floor(minutes / 1440)}日 ${Math.floor(minutes / 60) % 24}時間`
        : minutes >= 60 ? `${Math.floor(minutes / 60)}時間 ${minutes % 60}分` : `${minutes}分`);
      state('online', 'オンライン');
      updated.textContent = `最終計測: ${new Date(data.timestamp * 1000).toLocaleTimeString('ja-JP')} / ${data.interval_seconds}秒間隔`;
      render();
    } catch {
      if (version !== generation) return;
      state('error', '取得できません');
      for (const id of ['cpu', 'memory', 'temperature', 'uptime']) setText(id, '--');
      updated.textContent = latest ? '現在の値を取得できません。グラフは最後に取得した実測値です。' : '計測APIに接続できません。接続先とCORS設定を確認してください。';
      if (!latest) for (const empty of board.querySelectorAll<HTMLElement>('[data-chart-empty]')) empty.textContent = '計測データを取得できません';
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
      if (version === generation && !paused && !document.hidden) timer = setTimeout(refresh, pollInterval);
    }
  };
  const interrupt = () => {
    clearTimeout(timer);
    generation++;
    request?.abort();
    request = null;
  };

  board.querySelectorAll<HTMLButtonElement>('[data-history-range]').forEach(button => {
    button.addEventListener('click', () => {
      range = Number(button.dataset.historyRange);
      board.querySelectorAll<HTMLButtonElement>('[data-history-range]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      for (const start of board.querySelectorAll('[data-chart-start]')) start.textContent = `${range / 60}分前`;
      render();
    });
  });
  board.querySelector<HTMLSelectElement>('[data-status-interval]')!.addEventListener('change', event => {
    const value = Number((event.target as HTMLSelectElement).value);
    if (![3000, 10000, 30000].includes(value)) return;
    pollInterval = value;
    clearTimeout(timer);
    if (!paused) void refresh();
  });
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? '更新を再開' : '更新を停止';
    if (paused) {
      interrupt();
      state('paused', '更新停止中');
    } else {
      state('connecting', '接続中');
      void refresh();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interrupt();
    else if (!paused) void refresh();
  });
  void refresh();
}
