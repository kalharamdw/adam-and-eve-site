/* Mobile menu as a grabbable sheet: it enters and leaves along the same path,
   tracks the finger 1:1, resists past its open position, and decides on release
   by the sign of the velocity rather than by where the finger stopped. */

import { animate } from 'motion';
import { project, rubberband, VelocityTracker } from './gestures.js';

export function initSheet({ sheet, scrim, trigger }) {
  if (!sheet || !scrim || !trigger) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tracker = new VelocityTracker();

  let open = false;
  let height = 0;
  let y = 0;              // current translateY, 0 = fully open
  let dragging = false;
  let startY = 0;
  let startOffset = 0;
  let lastFocus = null;

  const setY = (value) => {
    y = value;
    sheet.style.transform = `translate3d(0, ${value}px, 0)`;
    const shown = height ? 1 - Math.min(Math.max(value / height, 0), 1) : 0;
    scrim.style.opacity = String(shown);
  };

  const spring = (to, velocity = 0, bounce = 0) =>
    animate(y, to, { type: 'spring', bounce, duration: 0.36, velocity, onUpdate: setY });

  function show() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;

    scrim.hidden = false;
    sheet.hidden = false;
    height = sheet.offsetHeight;
    setY(height);
    document.body.style.overflow = 'hidden';
    trigger.setAttribute('aria-expanded', 'true');

    if (reduced.matches) setY(0);
    else spring(0, 0, 0.16);

    sheet.querySelector('a')?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey);
  }

  function hide(velocity = 0) {
    if (!open) return;
    open = false;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);

    const done = () => {
      sheet.hidden = true;
      scrim.hidden = true;
      document.body.style.overflow = '';
      lastFocus?.focus?.({ preventScroll: true });
    };

    if (reduced.matches) { setY(height); done(); return; }
    animate(y, height, {
      type: 'spring', bounce: 0, duration: 0.32, velocity,
      onUpdate: setY,
      onComplete: done,
    });
  }

  function onKey(e) {
    if (e.key === 'Escape') { hide(); return; }
    if (e.key !== 'Tab') return;
    const focusable = sheet.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  trigger.addEventListener('click', () => (open ? hide() : show()));
  scrim.addEventListener('click', () => hide());
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) hide(); });

  /* drag to dismiss — never locked out, even mid-animation */
  sheet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    dragging = true;
    startY = e.clientY;
    startOffset = y;
    tracker.reset();
    tracker.add(e.clientY, e.timeStamp);
    sheet.setPointerCapture(e.pointerId);
  });

  sheet.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    tracker.add(e.clientY, e.timeStamp);
    const next = startOffset + (e.clientY - startY);
    // downward is free travel; upward past open meets progressive resistance
    setY(next >= 0 ? next : -rubberband(-next, height || sheet.offsetHeight));
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    if (sheet.hasPointerCapture?.(e.pointerId)) sheet.releasePointerCapture(e.pointerId);

    const velocity = tracker.velocity;
    const projected = y + project(velocity);
    if (projected > height * 0.4) hide(velocity);
    else spring(0, velocity, 0.14);
  };

  sheet.addEventListener('pointerup', endDrag);
  sheet.addEventListener('pointercancel', endDrag);

  const mq = window.matchMedia('(min-width: 62em)');
  mq.addEventListener('change', (e) => { if (e.matches && open) hide(); });
}
