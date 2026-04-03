// explore-view.js — Landing/Explore view

import { fetchRecentRecalls, searchDrugs } from './api.js';
import { el, truncate } from './utils.js';

const CATEGORIES = [
  { name: 'Pain & Inflammation', query: 'Nonsteroidal Anti-inflammatory Drug', icon: '🩹' },
  { name: 'Blood Pressure', query: 'Angiotensin-Converting Enzyme Inhibitor', icon: '❤️' },
  { name: 'Diabetes', query: 'Insulin', icon: '💉' },
  { name: 'Cholesterol', query: 'HMG-CoA Reductase Inhibitor', icon: '🫀' },
  { name: 'Mental Health', query: 'Selective Serotonin Reuptake Inhibitor', icon: '🧠' },
  { name: 'Antibiotics', query: 'Penicillin', icon: '💊' },
];

function recallClassBadge(classification) {
  const cls = classification || '';
  if (cls.includes('I') && !cls.includes('II') && !cls.includes('III')) return { text: 'Class I', className: 'badge-severe' };
  if (cls.includes('II') && !cls.includes('III')) return { text: 'Class II', className: 'badge-warning' };
  return { text: 'Class III', className: 'badge-info' };
}

function showCategoryResults(container, categoryName, results, onDrugSelect) {
  // Remove any previous results panel
  const existing = container.querySelector('.category-results');
  if (existing) existing.remove();

  const selected = new Set();
  const MAX = 4;

  const panel = el('section', { className: 'card section category-results' });
  const header = el('div', { className: 'category-results-header' },
    el('h2', { className: 'section-title' }, `${categoryName} — Select Drugs to Compare`),
  );
  const closeBtn = el('button', { className: 'category-results-close', 'aria-label': 'Close results', innerHTML: '&times;' });
  closeBtn.addEventListener('click', () => panel.remove());
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const hint = el('p', { className: 'category-results-hint muted' }, 'Pick up to 4 drugs, then hit Go.');
  panel.appendChild(hint);

  const list = el('div', { className: 'category-results-list' });
  const items = [];

  for (const drug of results) {
    const brandStr = drug.brandNames.length > 0 ? drug.brandNames.slice(0, 3).join(', ') : '';
    const item = el('button', { className: 'category-result-item' },
      el('span', { className: 'category-result-name' }, drug.genericName),
      brandStr ? el('span', { className: 'category-result-brand' }, brandStr) : null,
      drug.pharmClass ? el('span', { className: 'category-result-class' }, drug.pharmClass) : null,
    );
    item.addEventListener('click', () => {
      const key = drug.genericName;
      if (selected.has(key)) {
        selected.delete(key);
        item.classList.remove('selected');
      } else {
        if (selected.size >= MAX) return;
        selected.add(key);
        item.classList.add('selected');
      }
      updateGoButton();
    });
    items.push({ item, drug });
    list.appendChild(item);
  }
  panel.appendChild(list);

  // Go button
  const goBtn = el('button', { className: 'category-results-go', disabled: true }, 'Go');
  goBtn.addEventListener('click', () => {
    const drugsToAdd = items
      .filter(({ drug }) => selected.has(drug.genericName))
      .map(({ drug }) => drug);
    panel.remove();
    for (const drug of drugsToAdd) {
      onDrugSelect(drug);
    }
  });
  panel.appendChild(goBtn);

  function updateGoButton() {
    goBtn.disabled = selected.size === 0;
    goBtn.textContent = selected.size === 0
      ? 'Go'
      : selected.size === 1
        ? 'View Drug'
        : `Compare ${selected.size} Drugs`;
  }

  container.appendChild(panel);
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export async function renderExploreView(container, onDrugSelect) {
  container.innerHTML = '';

  // Hero section
  const hero = el('div', { className: 'explore-hero' },
    el('h1', { className: 'hero-title' }, 'DrugLens'),
    el('p', { className: 'hero-tagline' }, 'See the safety picture. Compare with clarity.'),
    el('p', { className: 'hero-sub' }, 'Explore FDA drug safety data. Compare medications side by side.'),
  );
  container.appendChild(hero);

  // Recent Recalls
  const recallSection = el('section', { className: 'card section' });
  recallSection.innerHTML = `<h2 class="section-title">Recently Recalled</h2><div class="recall-cards loading-placeholder"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>`;
  container.appendChild(recallSection);

  // Categories
  const catSection = el('section', { className: 'card section' });
  catSection.innerHTML = `<h2 class="section-title">Browse by Category</h2>`;
  const catGrid = el('div', { className: 'category-grid' });
  for (const cat of CATEGORIES) {
    const catCard = el('button', { className: 'category-card', 'aria-label': `Browse ${cat.name}` },
      el('span', { className: 'category-icon' }, cat.icon),
      el('span', { className: 'category-name' }, cat.name),
    );
    catCard.addEventListener('click', async () => {
      // Show loading state on the card
      catCard.classList.add('loading');
      catCard.disabled = true;
      try {
        const results = await searchDrugs(cat.query);
        if (results.length === 0) {
          catCard.classList.remove('loading');
          catCard.disabled = false;
          return;
        }
        // Show a results panel below the categories
        showCategoryResults(container, cat.name, results, onDrugSelect);
      } catch {
        // silently fail
      } finally {
        catCard.classList.remove('loading');
        catCard.disabled = false;
      }
    });
    catGrid.appendChild(catCard);
  }
  catSection.appendChild(catGrid);
  container.appendChild(catSection);

  // Load recalls asynchronously
  try {
    const recalls = await fetchRecentRecalls();
    const recallContainer = recallSection.querySelector('.recall-cards');
    recallContainer.classList.remove('loading-placeholder');
    recallContainer.innerHTML = '';
    if (recalls.length === 0) {
      recallContainer.innerHTML = '<p class="muted">No recent recalls found.</p>';
    } else {
      for (const r of recalls) {
        const badge = recallClassBadge(r.classification);
        const name = (r.openfda && r.openfda.brand_name && r.openfda.brand_name[0]) || r.product_description || 'Unknown Product';
        const date = r.recall_initiation_date ? `${r.recall_initiation_date.slice(0, 4)}-${r.recall_initiation_date.slice(4, 6)}-${r.recall_initiation_date.slice(6, 8)}` : '';
        const card = el('div', { className: 'recall-card' },
          el('div', { className: 'recall-card-header' },
            el('span', { className: `badge ${badge.className}` }, badge.text),
            el('span', { className: 'recall-date mono' }, date),
          ),
          el('h3', { className: 'recall-card-title' }, truncate(name, 60)),
          el('p', { className: 'recall-card-reason' }, truncate(r.reason_for_recall || 'No reason provided', 120)),
        );
        recallContainer.appendChild(card);
      }
    }
  } catch {
    const recallContainer = recallSection.querySelector('.recall-cards');
    recallContainer.innerHTML = '<p class="muted">Could not load recent recalls.</p>';
  }
}
