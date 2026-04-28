// Bootstrap. Ties together language, seasonal, search, and renderers.

function renderAll() {
  applyTranslations();
  renderSeasonal();
  renderCategoryGrid();
  updateLangToggleFace();
}

function updateLangToggleFace() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  const active = getLang();
  const labels = toggle.querySelectorAll('.lang-pill');
  labels.forEach(el => {
    el.classList.toggle('is-active', el.dataset.lang === active);
  });
}

function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (target.classList.contains('category-card')) {
      openCategoryCard(target);
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // close the search panel after a jump
    const results = document.getElementById('search-results');
    if (results) results.classList.remove('is-active');
  });
}

function openCategoryCard(card) {
  if (!card || card.classList.contains('is-open')) return;
  const btn = card.querySelector('[data-category-toggle]');
  card.classList.add('is-open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function initCategoryToggles() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-category-toggle]');
    if (!btn) return;
    const card = btn.closest('.category-card');
    if (!card) return;
    const isOpen = card.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  const expandAll = document.getElementById('library-expand-all');
  const collapseAll = document.getElementById('library-collapse-all');
  if (expandAll) {
    expandAll.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(card => {
        openCategoryCard(card);
      });
    });
  }
  if (collapseAll) {
    collapseAll.addEventListener('click', () => {
      document.querySelectorAll('.category-card.is-open').forEach(card => {
        const btn = card.querySelector('[data-category-toggle]');
        card.classList.remove('is-open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  const toggle = () => {
    if (window.scrollY > 600) btn.classList.add('is-visible');
    else btn.classList.remove('is-visible');
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach(el => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

function initStatBadges() {
  const count = MODULES.length;
  const cats = CATEGORIES.length;
  const modEl = document.getElementById('stat-modules');
  const catEl = document.getElementById('stat-categories');
  if (modEl) modEl.textContent = String(count);
  if (catEl) catEl.textContent = String(cats);
}

function openModuleModal(moduleId) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return;
  const lang = getLang();
  const modal = document.getElementById('video-modal');

  const cat = CATEGORIES.find(c => c.id === mod.category);
  document.getElementById('modal-eyebrow').textContent = cat ? cat[`name_${lang}`] : '';
  document.getElementById('modal-title').textContent = mod[`title_${lang}`];
  document.getElementById('modal-summary').textContent = mod[`summary_${lang}`];

  let embedSrc = `https://www.youtube.com/embed/${mod.youtube_id}?rel=0&modestbranding=1`;
  if (mod.youtube_start) embedSrc += `&start=${mod.youtube_start}`;
  document.getElementById('modal-iframe').src = embedSrc;

  const ytLink = document.getElementById('modal-yt-link');
  ytLink.href = mod.youtube_url;
  document.getElementById('modal-yt-label').textContent = t('module.youtube.label', lang);

  const stepsEl = document.getElementById('modal-steps');
  const stepData = MODULE_STEPS[moduleId];
  if (stepData && stepData[lang]) {
    const sd = stepData[lang];
    const items = sd.steps.map((step, i) => {
      const tipHtml = step.tip
        ? `<div class="modal-step-tip"><span class="modal-step-tip-label">${t('sample.tip', lang)}</span> ${escapeHtml(step.tip)}</div>`
        : '';
      return `
        <li class="modal-step">
          <div class="modal-step-num">${i + 1}</div>
          <div class="modal-step-text">
            <div class="modal-step-illustration" aria-hidden="true">${step.illustration}</div>
            <h4 class="modal-step-headline">${escapeHtml(step.headline)}</h4>
            <p class="modal-step-body">${escapeHtml(step.body)}</p>
            ${tipHtml}
          </div>
        </li>`;
    }).join('');
    stepsEl.innerHTML = `
      <h3 class="modal-steps-heading">${t('module.steps.title', lang)}</h3>
      <ol class="modal-steps-list">${items}</ol>`;
  } else {
    stepsEl.innerHTML = '';
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close').focus();
}

function closeModuleModal() {
  const modal = document.getElementById('video-modal');
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  document.getElementById('modal-iframe').src = '';
}

function initModuleModal() {
  document.getElementById('modal-close').addEventListener('click', closeModuleModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModuleModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('video-modal').classList.contains('is-open')) {
      closeModuleModal();
    }
  });

  document.addEventListener('click', e => {
    const card = e.target.closest('[data-module-id]');
    if (!card) return;
    const moduleId = card.dataset.moduleId;
    if (!moduleId) return;
    e.preventDefault();
    openModuleModal(moduleId);
  });
}

function boot() {
  document.documentElement.lang = getLang();
  initLanguageToggle();
  initMobileNav();
  initSearch();
  initSmoothScroll();
  initStatBadges();
  renderAll();
  initReveal();
  initModuleModal();
  initCategoryToggles();
  initBackToTop();

  document.addEventListener('lang:change', () => {
    renderSeasonal();
    renderCategoryGrid();
    updateLangToggleFace();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
