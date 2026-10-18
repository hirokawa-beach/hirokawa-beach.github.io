document.querySelectorAll<HTMLElement>('[data-brand-animation]').forEach(group => {
  const sequence = group.querySelector<HTMLElement>('[data-brand-sequence]')!;
  const fallback = group.querySelector<HTMLElement>('[data-brand-static]')!;
  const button = group.querySelector<HTMLButtonElement>('[data-brand-motion]')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let hovering = false;
  let focused = false;
  let visible = true;
  try { paused = sessionStorage.getItem('hb283-brand-paused') === 'true'; } catch { /* Storage is optional. */ }

  const sync = () => {
    const enabled = !reducedMotion.matches;
    sequence.hidden = !enabled;
    fallback.hidden = enabled;
    button.hidden = !enabled;
    group.dataset.brandPaused = String(paused || hovering || focused || !visible || document.hidden);
    const label = paused ? 'タイトルのアニメーションを再開' : 'タイトルのアニメーションを一時停止';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(paused));
    group.querySelector<HTMLElement>('[data-brand-icon="pause"]')!.hidden = paused;
    group.querySelector<HTMLElement>('[data-brand-icon="play"]')!.hidden = !paused;
  };
  button.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('hb283-brand-paused', String(paused)); } catch { /* Storage is optional. */ }
    sync();
  });
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    sync();
  });
  group.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    hovering = false;
    sync();
  });
  group.addEventListener('focusin', () => { focused = true; sync(); });
  group.addEventListener('focusout', event => {
    focused = group.contains(event.relatedTarget as Node | null);
    sync();
  });
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  observer.observe(group);
  sync();
});
