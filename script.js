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
const workCards = document.querySelectorAll('.work-card');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const filter = btn.dataset.filter;
    workCards.forEach(card => {
      const match = filter === 'all' || card.dataset.cat === filter;
      card.classList.toggle('is-hidden', !match);
    });
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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
