/* ============================================================================
   Scroll choreography

   Lenis supplies inertia, GSAP/ScrollTrigger reads scroll position and drives
   the sequences. Everything here reacts to scroll; nothing takes it. No
   snapping, no wheel interception, no forced pacing.

   The timing system is the one declared in styles.css. Read it from the
   custom properties so there is a single source of truth rather than two.
   ========================================================================= */

import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

CustomEase.create('entrance', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('exit', 'M0,0 C0.4,0 1,1 1,1');
CustomEase.create('inout', 'M0,0 C0.76,0 0.24,1 1,1');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

const css = getComputedStyle(document.documentElement);
const ms = (name, fallback) => {
  const v = css.getPropertyValue(name).trim();
  if (v.endsWith('ms')) return parseFloat(v) / 1000;
  if (v.endsWith('s')) return parseFloat(v);
  return fallback;
};

export const T = {
  micro: ms('--t-micro', 0.2),
  standard: ms('--t-standard', 0.5),
  cinematic: ms('--t-cinematic', 1),
  stagger: ms('--stagger', 0.06),
};

gsap.defaults({ duration: T.standard, ease: 'entrance' });

/* ── Lenis, synced to ScrollTrigger ───────────────────────────────────── */
export function initSmoothScroll() {
  if (reduced.matches) return null;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const chromeH = () => document.getElementById('chrome')?.offsetHeight ?? 72;

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -(chromeH() + 12), duration: 1.1 });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  return lenis;
}

/* ── the unified reveal: NOW REPEATING CONSTANTLY ON SCROLL ───────────── */
const REVEALS = [
  '.bay__head',
  '.statement__p',
  '.bento .tile',
  '.portfolio-banner',
  '.list .row',
  '.pillars',
  '.voices .voice',
  '.dirs .dir',
  '.end__left',
  '.form .field',
  '.form > .pill',
  '.foot__row',
];

const TEXT_REVEALS = '.bay__head, .statement__p, .end__left, .form .field, .form > .pill, .foot__row';

export function initReveals() {
  document.querySelectorAll(REVEALS.join(',')).forEach((el) => el.classList.add('reveal'));
  document.querySelectorAll(TEXT_REVEALS).forEach((el) => el.classList.add('reveal--text'));

  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  document.documentElement.classList.add('js-motion');

  if (reduced.matches) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Changed once: true to once: false so effects trigger endlessly on scroll up & down
  ScrollTrigger.batch(items, {
    start: 'top 95%',
    end: 'bottom 5%',
    once: false,
    onEnter: (batch) => {
      batch.forEach((el, i) => {
        const delay = Math.min(i * T.stagger, T.stagger * 8);
        gsap.delayedCall(delay, () => el.classList.add('is-in'));
      });
    },
    onLeave: (batch) => batch.forEach((el) => el.classList.remove('is-in')),
    onEnterBack: (batch) => {
      batch.forEach((el, i) => {
        const delay = Math.min(i * T.stagger, T.stagger * 8);
        gsap.delayedCall(delay, () => el.classList.add('is-in'));
      });
    },
    onLeaveBack: (batch) => batch.forEach((el) => el.classList.remove('is-in')),
  });

  const showIfVisible = () => {
    for (const el of items) {
      if (el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    }
  };
  window.addEventListener('load', showIfVisible);
  setTimeout(showIfVisible, 400);
}

export function revealAll() {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
}
if (typeof window !== 'undefined') window.__revealAll = revealAll;

/* ── hero: staged load, then parallax that separates the layers ───────── */
export function initHero({ playImmediately = false } = {}) {
  const frame = document.querySelector('.hero__frame');
  const video = document.querySelector('.hero__video');
  const copy = document.querySelector('.hero__copy');
  const heading = document.querySelector('.hero__h');
  if (!frame || !heading) return () => { };

  const sub = document.querySelector('.hero__sub');
  const cta = document.querySelector('.hero__act .pill');

  if (reduced.matches) return () => { };

  let introTimeline = null;

  SplitText.create(heading, {
    type: 'lines',
    autoSplit: true,
    linesClass: 'hero__line',
    onSplit: (self) => {
      const targets = self.lines.length ? self.lines : [heading];
      introTimeline = gsap.timeline({ defaults: { ease: 'entrance' }, paused: !playImmediately });
      introTimeline
        .from(video, { scale: 1.08, duration: T.cinematic * 1.6 }, 0)
        .fromTo(targets, {
          x: () => Math.max(window.innerWidth * 0.75, 380),
          opacity: 0,
        }, {
          x: 0,
          opacity: 1,
          duration: 1.25,
          ease: 'back.out(1.18)',
          stagger: 0.08,
          clearProps: 'transform',
        }, 0.15)
        .from([sub, cta].filter(Boolean), {
          opacity: 0,
          y: 18,
          duration: T.standard,
          stagger: T.stagger,
        }, 0.65);

      if (playImmediately) {
        introTimeline.play();
      }
      return introTimeline;
    },
  });

  const play = () => {
    if (introTimeline) {
      introTimeline.play();
    }
  };

  gsap.to(copy, {
    yPercent: -26,
    opacity: 0,
    filter: 'blur(6px)',
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '62% top', scrub: true },
  });

  gsap.to(frame, {
    scale: 0.9,
    borderRadius: getComputedStyle(document.documentElement).getPropertyValue('--r-lg') || '1.75rem',
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '78% top', scrub: true },
  });

  gsap.to(video, {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  return play;
}


/* ── depth: INCREASED IMAGE PARALLAX FOR A CONSTANT SCROLL FEEL ───────── */
export function initParallax() {
  if (reduced.matches) return;

  document.querySelectorAll('.tile__shot img, .dir img').forEach((img) => {
    // Increased from 2.5% to 6% so images really move inside their frames as you scroll
    gsap.fromTo(img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: img.closest('.tile, .dir'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
  });
}

/* ── method: the three ideas pass through, nothing stops ──────────────── */
export function initMethod() {
  const list = document.querySelector('.pillars');
  if (!list || reduced.matches) return;
  if (!window.matchMedia('(min-width: 52em)').matches) return;

  [...list.children].forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0.55, y: 26 },
      {
        opacity: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 94%', end: 'top 56%', scrub: 0.5 },
      });

    gsap.to(card, {
      y: -16 - i * 10,
      ease: 'none',
      scrollTrigger: { trigger: list, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    });
  });
}

/* ── clients: the roster never stops moving, and the scroll pushes it ──── */
export function initMarquee() {
  const wall = document.querySelector('.wall');
  if (!wall) return null;

  const viewport = document.createElement('div');
  viewport.className = 'marquee';
  wall.parentNode.insertBefore(viewport, wall);
  viewport.append(wall);
  wall.classList.add('marquee__track');

  if (reduced.matches) return null;

  for (const li of [...wall.children]) {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    wall.append(clone);
  }

  let half = wall.scrollWidth / 2;
  const measure = () => { half = wall.scrollWidth / 2; };
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  let x = 0;
  // BUMPED DRIFT SPEED UP HERE: -0.5 is now -0.9
  const drift = -0.9;
  let push = 0;

  gsap.ticker.add(() => {
    x = gsap.utils.wrap(-half, 0, x + drift + push);
    gsap.set(wall, { x });
    push *= 0.92;
  });

  return (velocity) => { push = gsap.utils.clamp(-30, 30, -velocity * 0.06); };
}

/* ── intro: the loading screen with snake video and spatial transition ── */
export function initIntro({ onStartTransition, onComplete } = {}) {
  if (reduced.matches) {
    if (onStartTransition) onStartTransition();
    if (onComplete) onComplete();
    return;
  }

  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  curtain.setAttribute('aria-hidden', 'true');

  curtain.innerHTML = `
    <canvas id="intro-particles" style="position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
    <video class="curtain__video" src="/media/snake.mp4" muted playsinline autoplay disablepictureinpicture style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:1;mix-blend-mode:screen;transform:translateZ(0);"></video>
    <button type="button" class="curtain__skip" aria-label="Skip intro">Skip</button>
  `;
  document.body.prepend(curtain);
  document.documentElement.classList.add('is-loading');

  const video = curtain.querySelector('.curtain__video');
  const canvas = curtain.querySelector('#intro-particles');
  const skipBtn = curtain.querySelector('.curtain__skip');

  // Speed up snake so it finishes ~4 seconds faster than its natural duration
  const setSpeed = () => {
    const dur = video.duration;
    if (dur && dur > 4) {
      video.playbackRate = dur / (dur - 4);
    }
  };
  video.addEventListener('loadedmetadata', setSpeed);
  if (video.readyState >= 1) setSpeed(); // already loaded

  // Attempt autoplay immediately
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Snake video autoplay prevented:', err);
    });
  }

  function createSubtleParticles() {
    if (!canvas) return () => { };
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => { };
    const dpr = window.devicePixelRatio || 1;
    const W = curtain.offsetWidth || window.innerWidth;
    const H = curtain.offsetHeight || window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const isMobile = window.innerWidth < 768;
    const DUST_COUNT = isMobile ? 15 : 40;
    const ORB_COUNT = isMobile ? 2 : 6;

    const dust = [];
    const orbs = [];

    for (let i = 0; i < DUST_COUNT; i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.15 + 0.05
      });
    }

    for (let i = 0; i < ORB_COUNT; i++) {
      orbs.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 120 + 60,
        alpha: Math.random() * 0.04 + 0.01
      });
    }

    let raf;
    function tick() {
      ctx.clearRect(0, 0, W, H);

      for (const orb of orbs) {
        orb.x += orb.vx; orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = W + orb.r; if (orb.x > W + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = H + orb.r; if (orb.y > H + orb.r) orb.y = -orb.r;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `rgba(207, 163, 53, ${orb.alpha})`);
        grad.addColorStop(1, `rgba(207, 163, 53, 0)`);
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }

      for (const d of dust) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(227, 190, 99, ${d.alpha})`; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  const stopParticles = createSubtleParticles();

  const done = () => {
    stopParticles();
    curtain.remove();
    document.documentElement.classList.remove('is-loading');
    ScrollTrigger.refresh();
    for (const ev of ['pointerdown', 'keydown']) {
      window.removeEventListener(ev, onUserInteract);
    }
    if (onComplete) onComplete();
  };

  const tl = gsap.timeline({ onComplete: done, paused: true });

  tl.to(curtain, {
    scale: 1.08,
    opacity: 0,
    filter: 'blur(12px)',
    duration: 0.45,
    ease: 'power2.inOut',
    onStart: () => {
      if (onStartTransition) onStartTransition();
    }
  });

  let finished = false;
  const endIntro = () => {
    if (finished) return;
    finished = true;
    tl.play();
  };

  // Safety fallback — video should end naturally; this catches load failures
  const timeoutId = setTimeout(endIntro, 10000);

  video.addEventListener('timeupdate', () => {
    if (video.duration > 0 && video.currentTime >= video.duration - 0.15) {
      endIntro();
    }
  });

  video.addEventListener('ended', endIntro);
  video.addEventListener('error', endIntro);

  function skip() {
    clearTimeout(timeoutId);
    endIntro();
  }

  skipBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    skip();
  });

  function onUserInteract(e) {
    if (e.target?.closest('.curtain__skip')) return;
    skip();
  }

  for (const ev of ['pointerdown', 'keydown']) {
    window.addEventListener(ev, onUserInteract, { once: true, passive: true });
  }

  return tl;
}

/* ── statement: the sentence lights up under the scroll ───────────────── */
export function initStatement() {
  const p = document.querySelector('.statement__p');
  if (!p || reduced.matches) return;

  const split = SplitText.create(p, { type: 'words', wordsClass: 'word' });

  gsap.fromTo(split.words,
    { opacity: 0.38 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.6,
      scrollTrigger: {
        trigger: p,
        start: 'top 82%',
        end: 'bottom 58%',
        scrub: 0.4,
      },
    });
}

/* ── work: the stack builds, each card settling onto the one before ───── */
export function initStack() {
  const bento = document.querySelector('.bento');
  if (!bento || reduced.matches) return;
  if (!window.matchMedia('(min-width: 68em)').matches) return;

  const tiles = [...bento.children];

  tiles.forEach((tile, i) => {
    const shot = tile.querySelector('.tile__shot');
    if (shot) {
      gsap.fromTo(shot,
        { clipPath: 'inset(14% 8% 14% 8% round 0.75rem)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0.75rem)',
          ease: 'none',
          scrollTrigger: { trigger: tile, start: 'top 92%', end: 'top 46%', scrub: 0.5 },
        });
    }

    if (i < tiles.length - 1) {
      const trigger = { trigger: tiles[i + 1], start: 'top 78%', end: 'top 34%', scrub: 0.5 };
      const inner = tile.querySelector('a');
      // Deepened the overlap effect inside the stack for more continuous motion
      if (inner) gsap.to(inner, { y: -24, ease: 'none', scrollTrigger: trigger });
      if (shot) gsap.to(shot, { opacity: 0.25, ease: 'none', scrollTrigger: trigger });
    }
  });
}

/* ── VELOCITY SKEW: NOW APPLIED TO TILES FOR JUICY MOBILE BOUNCE ──────── */
export function initVelocitySkew(lenis) {
  if (reduced.matches || !lenis) return;

  // Added .tile to the velocity targets so the grid physically flexes as you scroll!
  const targets = [...document.querySelectorAll('.statement, .bay, .tile')]
    .filter((el) => el.id !== 'method' && el.id !== 'clients');
  if (!targets.length) return;

  const setSkew = targets.map((el) => gsap.quickTo(el, 'skewY', { duration: 0.55, ease: 'entrance' }));

  lenis.on('scroll', ({ velocity }) => {
    const v = gsap.utils.clamp(-60, 60, velocity);
    // Multiplier bumped from 0.02 to 0.035 to make it very noticeable and bouncy
    const skew = v * 0.035;
    setSkew.forEach((set) => set(skew));
  });
}

/* ── MOBILE SCROLL-HOVERS & DESKTOP CURSOR SPOTLIGHT ──────────────────── */
export function initSpotlight() {
  if (reduced.matches) return;

  // 1. MOBILE SCROLL HOVERS
  // If it's a touch device (no mouse), simulate hover when things enter the center of the screen
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tile a, .row button, .card__lines a, .pill').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 65%',     // Triggers when top of element hits 65% down the screen
        end: 'bottom 35%',    // Stays active until bottom of element leaves 35% mark
        toggleClass: 'is-focused',
      });
    });
    return; // Exit here on mobile, we don't need the desktop mouse tracker below
  }

  // 2. DESKTOP MOUSE SPOTLIGHT (Unchanged)
  document.querySelectorAll('.tile a').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
  });
}

/* ── a cursor that knows what it is over ──────────────────────────────── */
export function initCursor() {
  if (reduced.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = `
    <span class="cursor__body">
      <span class="cursor__peek"></span>
      <span class="cursor__label"></span>
    </span>`;
  document.body.append(cur);
  document.documentElement.classList.add('has-cursor');

  const body = cur.querySelector('.cursor__body');
  const peek = cur.querySelector('.cursor__peek');
  const label = cur.querySelector('.cursor__label');

  const toX = gsap.quickTo(cur, 'x', { duration: 0.14, ease: 'entrance' });
  const toY = gsap.quickTo(cur, 'y', { duration: 0.14, ease: 'entrance' });
  const toRot = gsap.quickTo(body, 'rotate', { duration: 0.3, ease: 'entrance' });
  const toSX = gsap.quickTo(body, 'scaleX', { duration: 0.3, ease: 'entrance' });
  const toSY = gsap.quickTo(body, 'scaleY', { duration: 0.3, ease: 'entrance' });

  let px = innerWidth / 2, py = innerHeight / 2, vx = 0, vy = 0;

  window.addEventListener('pointermove', (e) => {
    vx = e.clientX - px; vy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    toX(px); toY(py);

    if (cur.classList.contains('is-peek') || cur.classList.contains('is-wide')) {
      toRot(0); toSX(1); toSY(1);
      return;
    }
    const speed = Math.min(Math.hypot(vx, vy), 90);
    const s = speed / 90;
    toRot((Math.atan2(vy, vx) * 180) / Math.PI);
    toSX(1 + s * 0.55);
    toSY(1 - s * 0.32);
  }, { passive: true });

  window.addEventListener('pointerdown', () => cur.classList.add('is-down'));
  window.addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => cur.classList.add('is-gone'));
  document.addEventListener('pointerenter', () => cur.classList.remove('is-gone'));

  const rules = [
    { sel: '.tile a', mode: 'peek', text: 'View' },
    { sel: '.row button', mode: 'wide', text: 'Open' },
    { sel: 'a[href^="http"]', mode: 'wide', text: 'Visit' },
    { sel: 'button[type="submit"]', mode: 'wide', text: 'Send' },
    { sel: 'a, button, input, textarea, label', mode: 'grow', text: '' },
  ];

  const clear = () => {
    cur.classList.remove('is-grow', 'is-wide', 'is-peek');
    label.textContent = '';
    peek.style.backgroundImage = '';
  };

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const hit = rules.find((r) => t.closest(r.sel));
    if (!hit) { clear(); return; }

    clear();
    if (hit.mode === 'peek') {
      const img = t.closest('.tile')?.querySelector('img');
      const src = img?.currentSrc || img?.src;
      if (src) { peek.style.backgroundImage = `url("${src}")`; cur.classList.add('is-peek'); }
      else cur.classList.add('is-wide');
      label.textContent = hit.text;
    } else if (hit.mode === 'wide') {
      cur.classList.add('is-wide');
      label.textContent = hit.text;
    } else {
      cur.classList.add('is-grow');
    }
  });
}

/* ── keep measurements honest when the layout settles ─────────────────── */
export function refreshOnSettle() {
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export { ScrollTrigger, gsap, reduced };