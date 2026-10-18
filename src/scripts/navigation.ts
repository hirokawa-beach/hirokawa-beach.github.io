const navigation = document.querySelector<HTMLElement>('.nav');
const toggle = document.querySelector<HTMLButtonElement>('[data-navigation-toggle]');
const links = document.getElementById('site-navigation');

if (navigation && toggle && links) {
  const mobile = window.matchMedia('(max-width: 650px)');
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    links.hidden = mobile.matches && !open;
  };
  const sync = () => {
    const focusWasInside = links.contains(document.activeElement);
    const focusWasToggle = document.activeElement === toggle;
    toggle.hidden = !mobile.matches;
    setOpen(false);
    if (mobile.matches && focusWasInside) toggle.focus();
    if (!mobile.matches && focusWasToggle) links.querySelector<HTMLAnchorElement>('a')?.focus();
  };

  navigation.dataset.menuReady = 'true';
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mobile.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
    event.preventDefault();
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (mobile.matches && !navigation.contains(event.target as Node)) setOpen(false);
  });
  navigation.addEventListener('focusout', event => {
    if (mobile.matches && !navigation.contains(event.relatedTarget as Node | null)) setOpen(false);
  });
  mobile.addEventListener('change', sync);
  sync();
}
