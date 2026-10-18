document.querySelectorAll<HTMLElement>('[data-brand-animation]').forEach(group => {
  const sequence = group.querySelector<HTMLElement>('[data-brand-sequence]')!;
  const fallback = group.querySelector<HTMLElement>('[data-brand-static]')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let hovering = false;
  let focused = false;
  let visible = true;

  const sync = () => {
    const enabled = !reducedMotion.matches;
    sequence.hidden = !enabled;
    fallback.hidden = enabled;
    group.dataset.brandPaused = String(hovering || focused || !visible || document.hidden);
  };
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
