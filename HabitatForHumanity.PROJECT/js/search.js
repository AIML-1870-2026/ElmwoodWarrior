// Lightweight fuzzy search. Spec calls for Fuse.js, but for a no-build static
// showcase we roll a small scoring function over title/tags/summary.

function searchModules(query, lang) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];

  const titleKey = 'title_' + lang;
  const summaryKey = 'summary_' + lang;
  const tagsKey = 'tags_' + lang;
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = MODULES.map(m => {
    const title = (m[titleKey] || '').toLowerCase();
    const summary = (m[summaryKey] || '').toLowerCase();
    const tags = (m[tagsKey] || []).join(' ').toLowerCase();
    const hay = `${title} ${summary} ${tags}`;

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 5;
      if (tags.includes(term)) score += 3;
      if (summary.includes(term)) score += 1;
      // mild fuzzy — match partial substrings of length >= 3
      if (term.length >= 3 && hay.includes(term.slice(0, 3))) score += 0.25;
    }
    return { module: m, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(r => r.module);
}

function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const countEl = document.getElementById('search-count');
  if (!input || !results) return;

  const render = () => {
    const lang = getLang();
    const q = input.value;
    const hits = searchModules(q, lang);

    if (!q.trim()) {
      results.innerHTML = '';
      results.classList.remove('is-active');
      if (countEl) countEl.textContent = '';
      return;
    }

    results.classList.add('is-active');

    if (hits.length === 0) {
      results.innerHTML = `<div class="search-empty" data-i18n="search.empty">${t('search.empty', lang)}</div>`;
      if (countEl) countEl.textContent = '';
      return;
    }

    if (countEl) {
      const word = hits.length === 1 ? t('search.count.one', lang) : t('search.count.many', lang);
      countEl.textContent = `${hits.length} ${word}`;
    }

    results.innerHTML = hits.map(m => {
      const cat = CATEGORIES.find(c => c.id === m.category);
      const title = m[`title_${lang}`];
      const summary = m[`summary_${lang}`];
      const catName = cat ? cat[`name_${lang}`] : '';
      return `
        <a href="#library-${m.category}" class="search-hit" data-module-id="${m.id}">
          <span class="search-hit-icon" aria-hidden="true">${cat ? cat.icon : '📘'}</span>
          <span class="search-hit-body">
            <span class="search-hit-cat">${escapeHtml(catName)}</span>
            <span class="search-hit-title">${escapeHtml(title)}</span>
            <span class="search-hit-summary">${escapeHtml(summary)}</span>
          </span>
          <span class="search-hit-arrow" aria-hidden="true">→</span>
        </a>
      `;
    }).join('');
  };

  input.addEventListener('input', render);
  document.addEventListener('lang:change', render);
}
