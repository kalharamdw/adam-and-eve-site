/* ============================================================================
   Adam & Eve — Main Application Entry Point
   Imports fonts, styling, sheet, gestures, and motion orchestration.
   ========================================================================= */

import '@fontsource-variable/geist';
import './styles.css';

import { animate } from 'motion';
import {
  T,
  reduced,
  initIntro,
  initSmoothScroll,
  initReveals,
  initHero,
  initStatement,
  initStack,
  initMethod,
  initParallax,
  initMarquee,
  initSpotlight,
  initCursor,
  initVelocitySkew,
  refreshOnSettle,
} from './motion.js';
import { initSheet } from './sheet.js';

// 1. Initialize mobile menu sheet
initSheet({
  sheet: document.getElementById('sheet'),
  scrim: document.getElementById('scrim'),
  trigger: document.getElementById('menu-open'),
});

// 2. Prepare Hero entrance timeline (starts paused, will trigger as intro curtain dissolves)
const playHero = initHero({ playImmediately: false });

// 3. Launch intro loading screen with snake video
initIntro({
  onStartTransition: () => {
    // Play hero line-reveal precisely as the curtain begins fading/blurring out
    if (playHero) playHero();
  },
  onComplete: () => {
    // Quick visibility refresh to guarantee all on-screen content is displayed
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('is-in');
        }
      });
    }, 80);
  },
});

// 4. Lenis smooth scroll synced to GSAP ScrollTrigger
const lenis = initSmoothScroll();

// 5. Scroll reveals and section motion controllers
initReveals();
initStatement();
initStack();
initMethod();
initParallax();

const pushMarquee = initMarquee();
if (lenis && pushMarquee) {
  lenis.on('scroll', ({ velocity }) => pushMarquee(velocity));
}

initSpotlight();
initCursor();
initVelocitySkew(lenis);
refreshOnSettle();

// 6. Service Accordions [data-list]
const list = document.querySelector('[data-list]');
const buttons = list ? [...list.querySelectorAll('button[aria-controls]')] : [];

const closeAccordion = (btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  btn.setAttribute('aria-expanded', 'false');
  if (reduced.matches) {
    panel.hidden = true;
    panel.style.height = '';
    return;
  }
  animate(panel.offsetHeight, 0, {
    type: 'spring',
    bounce: 0,
    duration: T.standard * 0.7,
    onUpdate: (h) => {
      panel.style.height = `${h}px`;
    },
    onComplete: () => {
      panel.hidden = true;
      panel.style.height = '';
    },
  });
};

const openAccordion = (btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  btn.setAttribute('aria-expanded', 'true');
  panel.hidden = false;
  if (reduced.matches) return;
  const targetH = panel.scrollHeight;
  panel.style.height = '0px';
  animate(0, targetH, {
    type: 'spring',
    bounce: 0,
    duration: T.standard * 0.9,
    onUpdate: (h) => {
      panel.style.height = `${h}px`;
    },
    onComplete: () => {
      panel.style.height = '';
    },
  });
};

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    buttons
      .filter((b) => b !== btn && b.getAttribute('aria-expanded') === 'true')
      .forEach(closeAccordion);
    if (isOpen) closeAccordion(btn);
    else openAccordion(btn);
  });
});

// 7. Chrome header appearance & hide on scroll
const chrome = document.getElementById('chrome');
if (chrome) {
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const sheetOpen = document.getElementById('sheet')?.hidden === false;
    chrome.classList.toggle('is-hidden', y > lastY && y > 420 && !sheetOpen);
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  const hero = document.querySelector('.hero');
  if (hero) {
    new IntersectionObserver(([entry]) => {
      chrome.classList.toggle('is-past-hero', !entry.isIntersecting);
    }, { rootMargin: '-20% 0px 0px 0px' }).observe(hero);
  }

  const contact = document.getElementById('contact');
  if (contact) {
    new IntersectionObserver(([entry]) => {
      chrome.classList.toggle('is-at-contact', entry.isIntersecting);
    }, { rootMargin: '-15% 0px -35% 0px' }).observe(contact);
  }
}

// 8. Active navigation scrollspy
const navLinks = [...document.querySelectorAll('.chrome__nav a')];
const navSections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

if (navSections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const match = navLinks.find((a) => a.getAttribute('href') === `#${entry.target.id}`);
      if (match) {
        navLinks.forEach((a) => a.classList.remove('is-here'));
        match.classList.add('is-here');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });

  navSections.forEach((s) => navObserver.observe(s));
}

// 9. Interactive button slide springs on hover & focus
if (!reduced.matches) {
  document.querySelectorAll('.row button').forEach((btn) => {
    const slide = (x) => animate(btn, { x }, { type: 'spring', bounce: 0, duration: T.standard * 0.8 });
    btn.addEventListener('pointerenter', () => slide(12));
    btn.addEventListener('pointerleave', () => slide(0));
    btn.addEventListener('blur', () => slide(0));
  });
}

// 10. Magnetic buttons [data-magnet]
if (!reduced.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    let active = false;
    const reset = () => animate(el, { x: 0, y: 0 }, { type: 'spring', bounce: 0.3, duration: T.standard });
    window.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      if (!(Math.abs(dx) < rect.width / 2 + 110 && Math.abs(dy) < rect.height / 2 + 110)) {
        if (active) {
          active = false;
          reset();
        }
        return;
      }
      active = true;
      animate(el, { x: dx * 0.28, y: dy * 0.28 }, { type: 'spring', bounce: 0, duration: T.micro * 1.6 });
    }, { passive: true });
    el.addEventListener('pointerleave', reset);
  });
}

// 11. Spring scale press feedback [data-press]
document.querySelectorAll('[data-press]').forEach((el) => {
  const scale = (s, bounce) => animate(el, { scale: s }, { type: 'spring', bounce, duration: T.micro * 1.3 });
  el.addEventListener('pointerdown', () => scale(0.97, 0));
  el.addEventListener('pointerup', () => scale(1, 0.3));
  el.addEventListener('pointerleave', () => scale(1, 0));
  el.addEventListener('pointercancel', () => scale(1, 0));
});

// 12. Hero video playback on visibility
const heroVideo = document.getElementById('hero-video');
if (heroVideo) {
  const playVideo = () => heroVideo.play().catch(() => {});
  if (reduced.matches) {
    heroVideo.pause();
  } else {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) playVideo();
      else heroVideo.pause();
    }, { threshold: 0.02 }).observe(heroVideo);
  }
}

// 13. Contact form validation and submission
const form = document.getElementById('form');
if (form) {
  const status = form.querySelector('[data-status]');

  const validateField = (field) => {
    const val = field.value.trim();
    let err = '';
    if (field.required && !val) {
      if (field.type === 'email') err = 'We need an email to reply to.';
      else if (field.tagName === 'TEXTAREA') err = 'Tell us what you are launching.';
      else err = 'Please add your name.';
    } else if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
      err = 'That email address looks incomplete.';
    }

    const container = field.closest('.field');
    if (container) {
      container.classList.toggle('is-bad', Boolean(err));
      const errEl = container.querySelector('[data-err]');
      if (errEl) errEl.textContent = err;
    }
    field.setAttribute('aria-invalid', err ? 'true' : 'false');
    return !err;
  };

  form.querySelectorAll('input, textarea').forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => {
      if (f.closest('.field')?.classList.contains('is-bad')) {
        validateField(f);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll('input, textarea')];
    const ok = fields.map(validateField).every(Boolean);

    if (status) status.classList.remove('is-bad');
    if (!ok) {
      if (status) {
        status.textContent = 'Two or three details are still missing.';
        status.classList.add('is-bad');
      }
      fields.find((f) => f.closest('.field')?.classList.contains('is-bad'))?.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      const body = `Name: ${data.name}\nEmail: ${data.email}\nTelephone: ${data.telephone || '—'}\n\n${data.message}`;
      window.location.href = `mailto:hello@adamandeve.lk?subject=${encodeURIComponent('New brief — ' + data.name)}&body=${encodeURIComponent(body)}`;
      if (status) status.textContent = 'Opening your mail client with the brief filled in.';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = 'Sending…';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      if (status) status.textContent = 'Received. We will come back to you within two working days.';
    } catch {
      if (status) {
        status.textContent = 'That did not send. Email hello@adamandeve.lk and we will pick it up.';
        status.classList.add('is-bad');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// 14. Dynamic copyright year
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});