// Community Post Board — all board logic for community.html

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hfh.community.posts';
const SEED_KEY    = 'hfh.community.seeded';
const OWNED_KEY   = 'hfh.community.owned';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_POSTS = [
  {
    id: 'seed-1', title: 'Spring Neighborhood Cleanup Day',
    category: 'event', date: '2026-05-10',
    description: 'Join us at Elmwood Park to pick up litter, plant flowers, and meet your neighbors. Gloves and bags provided. All ages welcome.',
    contact: '', author: 'Maria G.',
    createdAt: '2026-04-16T10:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-2', title: 'Hiring: Part-Time Landscaper',
    category: 'job', date: '2026-05-01',
    description: 'Looking for a reliable person to mow, edge, and trim weekly. $18/hr, flexible hours. Experience preferred but will train.',
    contact: 'carlos.r@email.com', author: 'Carlos R.',
    createdAt: '2026-04-15T14:30:00.000Z', isSeed: true
  },
  {
    id: 'seed-3', title: 'Saturday Soccer — All Skill Levels',
    category: 'sport', date: '2026-05-03',
    description: 'Pickup soccer every Saturday at 9am at Jefferson Middle School field. Bring water and cleats. Families welcome to cheer.',
    contact: '', author: 'Andre T.',
    createdAt: '2026-04-14T09:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-4', title: 'Free Smoke Detector Installation',
    category: 'announcement', date: '2026-04-28',
    description: 'The Omaha Fire Department will install free smoke detectors for Habitat homeowners this Saturday. Call 402-555-0180 to schedule.',
    contact: '402-555-0180', author: 'Habitat Staff',
    createdAt: '2026-04-13T11:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-5', title: 'Community Garden Plot Lottery',
    category: 'event', date: '2026-05-17',
    description: 'Applications are open for a raised garden plot in the 42nd Street community garden. Drawing held May 17. Contact Rosa to apply.',
    contact: 'rosa.m@habitat-omaha.org', author: 'Rosa M.',
    createdAt: '2026-04-12T16:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-6', title: 'Help Needed: Fence Repair',
    category: 'job', date: '2026-04-30',
    description: 'I need help fixing three sections of my wooden fence — boards are loose and one post is cracked. Will pay $15/hr. Can start this week.',
    contact: '402-555-0247', author: 'James L.',
    createdAt: '2026-04-11T08:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-7', title: 'Kids Basketball — Open Registration',
    category: 'sport', date: '2026-05-06',
    description: 'Youth basketball league starting May 6. Ages 7–14. Free registration for Habitat families. Practice Tuesdays and Thursdays, 6pm.',
    contact: '', author: 'Coach Dee',
    createdAt: '2026-04-10T13:00:00.000Z', isSeed: true
  },
  {
    id: 'seed-8', title: 'Block Party Planning Meeting',
    category: 'event', date: '2026-05-12',
    description: 'Come help plan the July 4th block party! We need volunteers for food, games, and setup. Meeting at 32nd Ave Community Room.',
    contact: '', author: 'Linda K.',
    createdAt: '2026-04-09T10:00:00.000Z', isSeed: true
  }
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(isoDate, lang) {
  if (!isoDate) return '';
  // Parse as local date to avoid UTC offset shifting the displayed day
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Data layer ───────────────────────────────────────────────────────────────

function loadPosts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function addPost(post) {
  const posts = loadPosts();
  posts.unshift(post);
  savePosts(posts);
  addOwnedId(post.id);
}

function deletePost(id) {
  savePosts(loadPosts().filter(p => p.id !== id));
  removeOwnedId(id);
}

function loadOwnedIds() {
  try { return JSON.parse(localStorage.getItem(OWNED_KEY)) || []; }
  catch { return []; }
}

function addOwnedId(id) {
  const owned = loadOwnedIds();
  owned.push(id);
  localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
}

function removeOwnedId(id) {
  localStorage.setItem(OWNED_KEY, JSON.stringify(loadOwnedIds().filter(x => x !== id)));
}

function maybeSeedPosts() {
  if (localStorage.getItem(SEED_KEY)) return;
  savePosts(SEED_POSTS);
  localStorage.setItem(SEED_KEY, '1');
}

// ─── State ────────────────────────────────────────────────────────────────────

let activeFilter = 'all';

// ─── Category helpers ─────────────────────────────────────────────────────────

const CAT_COLORS = {
  event:        'var(--color-primary)',
  job:          'var(--color-moss)',
  sport:        'var(--color-sky)',
  announcement: 'var(--color-rose)'
};

function badgeKey(category) {
  return 'community.badge.' + category;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderPostCard(post, lang, ownedIds) {
  const isOwned = ownedIds.includes(post.id);
  const catColor = CAT_COLORS[post.category] || 'var(--color-primary)';
  const badgeLabel = t(badgeKey(post.category), lang);
  const dateLabel  = formatDate(post.date, lang);
  const byLabel    = t('community.post.by', lang);
  const onLabel    = t('community.post.on', lang);
  const contactLabel = t('community.post.contact', lang);
  const deleteLabel  = t('community.post.delete', lang);

  const contactHtml = post.contact
    ? `<span class="post-card-contact"><strong>${escapeHtml(contactLabel)}:</strong> ${escapeHtml(post.contact)}</span>`
    : '';

  const deleteBtn = isOwned
    ? `<button class="post-card-delete btn btn-ghost" type="button" data-delete-id="${escapeHtml(post.id)}">${escapeHtml(deleteLabel)}</button>`
    : '';

  return `
    <article class="post-card post-card--${escapeHtml(post.category)}" style="--cat-color:${catColor}">
      <div class="post-card-top">
        <span class="post-card-badge post-card-badge--${escapeHtml(post.category)}">${escapeHtml(badgeLabel)}</span>
      </div>
      <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
      <p class="post-card-meta">${escapeHtml(dateLabel)} &middot; ${escapeHtml(byLabel)} ${escapeHtml(post.author)}</p>
      <p class="post-card-body">${escapeHtml(post.description)}</p>
      <div class="post-card-footer">
        ${contactHtml}
        ${deleteBtn}
      </div>
    </article>`;
}

function renderPosts() {
  const lang     = getLang();
  const ownedIds = loadOwnedIds();
  const all      = loadPosts();
  const filtered = activeFilter === 'all' ? all : all.filter(p => p.category === activeFilter);
  // Sort newest createdAt first
  filtered.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const grid = document.getElementById('post-grid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="community-empty">${escapeHtml(t('community.post.empty', lang))}</p>`;
    return;
  }

  grid.innerHTML = filtered.map(p => renderPostCard(p, lang, ownedIds)).join('');
}

function renderFilterCounts() {
  const all = loadPosts();
  const counts = { all: all.length, event: 0, job: 0, sport: 0, announcement: 0 };
  all.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });

  document.querySelectorAll('.community-filter-btn').forEach(btn => {
    const filter = btn.dataset.filter;
    const span   = btn.querySelector('.community-filter-count');
    if (span && counts[filter] !== undefined) {
      span.textContent = counts[filter] > 0 ? counts[filter] : '';
    }
  });
}

// ─── Language toggle face ─────────────────────────────────────────────────────

function updateLangToggleFace() {
  const lang  = getLang();
  const pills = document.querySelectorAll('.lang-pill');
  pills.forEach(p => p.classList.toggle('is-active', p.dataset.lang === lang));
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openCreateModal() {
  const modal = document.getElementById('create-modal');
  if (!modal) return;
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  const first = modal.querySelector('input, select, textarea');
  if (first) setTimeout(() => first.focus(), 50);
}

function closeCreateModal() {
  const modal = document.getElementById('create-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  resetForm();
}

function resetForm() {
  const form = document.getElementById('create-post-form');
  if (form) form.reset();
  document.querySelectorAll('.form-error').forEach(el => { el.hidden = true; });
}

// ─── Form validation ──────────────────────────────────────────────────────────

function validateForm() {
  const required = [
    { id: 'field-title',       errId: 'err-title' },
    { id: 'field-category',    errId: 'err-category' },
    { id: 'field-date',        errId: 'err-date' },
    { id: 'field-description', errId: 'err-description' },
    { id: 'field-author',      errId: 'err-author' }
  ];

  let valid = true;
  required.forEach(({ id, errId }) => {
    const field = document.getElementById(id);
    const err   = document.getElementById(errId);
    const empty = !field || !field.value.trim();
    if (err) err.hidden = !empty;
    if (empty) valid = false;
  });
  return valid;
}

// ─── Form submit ──────────────────────────────────────────────────────────────

function handleSubmit() {
  if (!validateForm()) return;

  const post = {
    id:          generateId(),
    title:       document.getElementById('field-title').value.trim(),
    category:    document.getElementById('field-category').value,
    date:        document.getElementById('field-date').value,
    description: document.getElementById('field-description').value.trim(),
    contact:     document.getElementById('field-contact').value.trim(),
    author:      document.getElementById('field-author').value.trim(),
    createdAt:   new Date().toISOString(),
    isSeed:      false
  };

  addPost(post);
  renderPosts();
  renderFilterCounts();
  closeCreateModal();
}

// ─── Filter ───────────────────────────────────────────────────────────────────

function handleFilterClick(e) {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('.community-filter-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.filter === activeFilter);
  });
  renderPosts();
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function handleDeleteClick(e) {
  const btn = e.target.closest('[data-delete-id]');
  if (!btn) return;
  const id = btn.dataset.deleteId;
  const confirmMsg = t('community.confirm.delete', getLang());
  if (!confirm(confirmMsg)) return;
  deletePost(id);
  renderPosts();
  renderFilterCounts();
}

// ─── Reveal animation (mirrors app.js pattern) ───────────────────────────────

function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ─── Back to top ──────────────────────────────────────────────────────────────

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

function boot() {
  document.documentElement.lang = getLang();
  maybeSeedPosts();
  applyTranslations(getLang());
  updateLangToggleFace();
  initLanguageToggle();
  initMobileNav();
  initReveal();
  initBackToTop();
  renderPosts();
  renderFilterCounts();

  // Create post button
  const createBtn = document.getElementById('create-post-btn');
  if (createBtn) createBtn.addEventListener('click', openCreateModal);

  // Modal close
  const closeBtn  = document.getElementById('create-modal-close');
  const cancelBtn = document.getElementById('create-modal-cancel');
  const backdrop  = document.getElementById('create-modal-backdrop');
  if (closeBtn)  closeBtn.addEventListener('click', closeCreateModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);
  if (backdrop)  backdrop.addEventListener('click', closeCreateModal);

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCreateModal();
  });

  // Form submit
  const submitBtn = document.getElementById('create-post-submit');
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

  // Filter bar (event delegation)
  const filters = document.getElementById('community-filters');
  if (filters) filters.addEventListener('click', handleFilterClick);

  // Post grid delete (event delegation)
  const grid = document.getElementById('post-grid');
  if (grid) grid.addEventListener('click', handleDeleteClick);

  // Language change
  document.addEventListener('lang:change', () => {
    document.documentElement.lang = getLang();
    applyTranslations(getLang());
    updateLangToggleFace();
    renderPosts();
    renderFilterCounts();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
