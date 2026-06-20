// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Portfolio filter
const filterBtns = document.querySelectorAll('.filter-btn');
const reels = document.querySelectorAll('.reel');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const filter = btn.dataset.filter;
    reels.forEach(reel => {
      const match = filter === 'all' || reel.dataset.cat === filter;
      reel.classList.toggle('is-hidden', !match);
    });
    // Recalculate immediately so hidden/shown reels don't leave stale scale values
    updateReelProgress();
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Scroll-driven effect: the frame opens up quickly (first slice of the
// reel's scroll track), then the remaining scroll reveals the screenshot
// scrolling vertically inside the now-open frame, like browsing the real site.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_FRACTION = 0.22; // portion of the reel's scroll track spent "opening"

function updateReelProgress() {
  const viewportHeight = window.innerHeight;
  reels.forEach((reel) => {
    if (reel.classList.contains('is-hidden')) return;
    const frame = reel.querySelector('.reel-frame');
    if (!frame) return;

    const rect = reel.getBoundingClientRect();
    const scrollable = rect.height - viewportHeight;
    let progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.max(0, Math.min(1, progress));

    const openProgress = Math.max(0, Math.min(1, progress / OPEN_FRACTION));
    const scrollProgress = Math.max(0, Math.min(1, (progress - OPEN_FRACTION) / (1 - OPEN_FRACTION)));

    frame.style.setProperty('--p', openProgress.toFixed(3));
    frame.style.setProperty('--sp', scrollProgress.toFixed(3));
  });
}

if (!prefersReducedMotion && reels.length) {
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateReelProgress();
        ticking = false;
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateReelProgress();
}


// Contact form submission via Cloudflare Pages Function
const form = document.getElementById('contact-form');
const statusEl = form ? form.querySelector('.form-status') : null;

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check — if filled, silently drop (likely a bot)
    const honeypot = form.querySelector('.hp-field');
    if (honeypot && honeypot.value.trim() !== '') {
      statusEl.textContent = 'Message sent.';
      statusEl.classList.remove('is-error');
      form.reset();
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      project_type: form.project_type.value,
      message: form.message.value.trim(),
    };

    if (!data.name || !data.email || !data.message) {
      statusEl.textContent = 'Please fill out all fields.';
      statusEl.classList.add('is-error');
      return;
    }

    submitBtn.disabled = true;
    statusEl.classList.remove('is-error');
    statusEl.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        statusEl.textContent = "Message sent. I'll get back to you soon.";
        form.reset();
      } else {
        statusEl.textContent = result.error || 'Something went wrong. Try emailing directly.';
        statusEl.classList.add('is-error');
      }
    } catch (err) {
      statusEl.textContent = 'Network error. Try emailing directly.';
      statusEl.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
