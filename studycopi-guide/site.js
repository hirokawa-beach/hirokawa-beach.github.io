'use strict';
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (tabs.indexOf(tab) + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (tabs.indexOf(tab) - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
}

const walkthrough = document.querySelector('.walkthrough');
const screenshotDialog = document.querySelector('.screenshot-dialog');

// Native dialog gives keyboard focus trapping and Escape/close focus restoration.
document.addEventListener('click', event => {
  const button = event.target.closest('.screenshot-button');
  if (!button || !screenshotDialog) return;
  const picture = button.querySelector('picture').cloneNode(true);
  picture.querySelector('img').loading = 'eager';
  screenshotDialog.querySelector('.screenshot-dialog-content').replaceChildren(picture);
  screenshotDialog.showModal();
});
if (screenshotDialog) screenshotDialog.addEventListener('click', event => {
  if (event.target !== screenshotDialog) return;
  const rect = screenshotDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) screenshotDialog.close();
});

// Build the sticky presentation when the guide approaches, not during initial paint.
// Keep the complete illustrated guide as the fallback.
function enhanceWalkthrough() {
  const steps = [...walkthrough.querySelectorAll('.walkthrough-step')];
  const visual = walkthrough.querySelector('.walkthrough-visual');
  const stage = walkthrough.querySelector('.walkthrough-stage');
  const buttons = [...visual.querySelectorAll('[data-guide-step]')];
  const slides = steps.map(step => {
    const slide = step.querySelector('.walkthrough-shot').cloneNode(true);
    stage.append(slide);
    return slide;
  });
  visual.hidden = false;
  walkthrough.classList.add('is-enhanced');
  let current = -1;
  let hasEntered = false;
  function showStep(index) {
    if (index === current) return;
    current = index;
    walkthrough.dataset.step = String(index);
    visual.querySelector('.walkthrough-position').textContent = `手順 ${index + 1} / ${steps.length}`;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-current', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      slide.querySelector('button').tabIndex = active ? 0 : -1;
      // Load the next screen before the reader reaches it, without loading the whole site upfront.
      if (hasEntered && i <= index + 1) slide.querySelector('img').loading = 'eager';
    });
    steps.forEach((step, i) => step.classList.toggle('is-current', i === index));
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  showStep(0);
  const preload = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    hasEntered = true;
    slides.slice(0, current + 2).forEach(slide => { slide.querySelector('img').loading = 'eager'; });
    preload.disconnect();
  }, {rootMargin:'500px'});
  preload.observe(walkthrough);
  let observer;
  let geometryKey;
  function observeSteps(force = false) {
    const key = `${innerWidth}/${innerHeight}/${visual.offsetHeight}`;
    if (!force && key === geometryKey) return;
    geometryKey = key;
    if (observer) observer.disconnect();
    const mobile = matchMedia('(max-width:640px)').matches;
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    const readingTop = Math.min(innerHeight - 90, mobile ? headerHeight + visual.offsetHeight + 20 : Math.max(headerHeight + 60, innerHeight * .45));
    const pagePadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    walkthrough.style.setProperty('--guide-reading-top', `${Math.max(0, readingTop - pagePadding)}px`);
    const visible = new Set();
    const bandHeight = 50;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      const center = readingTop + bandHeight / 2;
      const step = [...visible].find(item => {
        const rect = item.getBoundingClientRect();
        return rect.top <= center && rect.bottom > center;
      }) || [...visible][0];
      if (step) showStep(steps.indexOf(step));
    }, {rootMargin: `-${readingTop}px 0px -${Math.max(0, innerHeight - readingTop - bandHeight)}px 0px`, threshold: 0});
    steps.forEach(step => observer.observe(step));
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    showStep(index);
    steps[index].scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
  }));
  observeSteps();
  if ('ResizeObserver' in window) new ResizeObserver(() => observeSteps()).observe(visual);
  window.addEventListener('resize', () => observeSteps());
  window.addEventListener('pageshow', () => observeSteps(true));
}
if (walkthrough && 'IntersectionObserver' in window) {
  const setup = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    setup.disconnect();
    enhanceWalkthrough();
  }, {rootMargin:'500px'});
  setup.observe(walkthrough);
}
