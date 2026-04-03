// compare-view.js — Side-by-Side Comparison view (2–4 drugs)

import { fetchAllDrugData } from './api.js';
import { renderComparisonReactions, renderSeverityComparison, renderComparisonTrends } from './charts.js';
import { el, formatNumber, getLabelText, getDrugColor, getDrugColorLight } from './utils.js';
import { helpButton } from './help-modal.js';

const LABEL_TABS = [
  { key: 'warnings', alt: 'warnings_and_cautions', label: 'Warnings' },
  { key: 'adverse_reactions', label: 'Adverse Reactions' },
  { key: 'drug_interactions', label: 'Interactions' },
  { key: 'contraindications', label: 'Contraindications' },
  { key: 'indications_and_usage', label: 'Indications' },
  { key: 'dosage_and_administration', label: 'Dosage' },
];

function recallClassBadge(classification) {
  const cls = classification || '';
  if (cls.includes('I') && !cls.includes('II') && !cls.includes('III')) return { text: 'Class I', className: 'badge-severe' };
  if (cls.includes('II') && !cls.includes('III')) return { text: 'Class II', className: 'badge-warning' };
  return { text: 'Class III', className: 'badge-info' };
}

export async function renderCompareView(container, drugs, cachedData = {}) {
  container.innerHTML = '';
  container.appendChild(el('div', { className: 'skeleton-section' },
    el('div', { className: 'skeleton-line w80' }),
    el('div', { className: 'skeleton-block' }),
  ));

  // Fetch data for any drugs not already cached
  const drugsData = [];
  const promises = drugs.map(async (drug) => {
    if (cachedData[drug.genericName]) {
      return { ...drug, ...cachedData[drug.genericName] };
    }
    const data = await fetchAllDrugData(drug.genericName);
    cachedData[drug.genericName] = data;
    return { ...drug, ...data };
  });

  try {
    const results = await Promise.all(promises);
    drugsData.push(...results);
  } catch (e) {
    container.innerHTML = '<div class="card error-card"><h3>Error Loading Data</h3><p>Could not load comparison data. Please try again.</p></div>';
    return;
  }

  container.innerHTML = '';

  // At a Glance table
  const glanceSection = el('section', { className: 'card section' });
  const glanceTitle = el('h3', { className: 'section-title section-title-with-help' }, 'At a Glance');
  glanceTitle.appendChild(helpButton('adverse-events', 'How to interpret this data'));
  glanceSection.appendChild(glanceTitle);
  const table = el('table', { className: 'glance-table' });
  const thead = el('thead');
  const headerRow = el('tr', {}, el('th', {}, ''));
  drugsData.forEach((d, i) => {
    const th = el('th', { style: `color: ${getDrugColor(i)}` }, d.genericName);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  const rows = [
    { label: 'Type', fn: d => { const ofd = (d.label || {}).openfda || {}; return (ofd.pharm_class_epc || [])[0] || d.pharmClass || '—'; } },
    { label: 'OTC', fn: d => { const ofd = (d.label || {}).openfda || {}; const pt = (ofd.product_type || [])[0] || d.productType || ''; return pt.toLowerCase().includes('otc') ? 'Yes' : pt.toLowerCase().includes('prescription') ? 'Rx' : '—'; } },
    { label: 'Route', fn: d => { const ofd = (d.label || {}).openfda || {}; return (ofd.route || [])[0] || d.route || '—'; } },
    { label: 'Boxed Warning', fn: d => d.label && d.label.boxed_warning ? 'YES \u26A0' : 'No' },
    { label: 'Total Reports', fn: d => formatNumber(d.totalReports) },
  ];
  for (const row of rows) {
    const tr = el('tr', {}, el('td', { className: 'row-label' }, row.label));
    for (const d of drugsData) {
      const val = row.fn(d);
      const td = el('td', {}, val);
      if (row.label === 'Boxed Warning' && val.includes('YES')) td.classList.add('text-severe');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  glanceSection.appendChild(table);
  container.appendChild(glanceSection);

  // Boxed Warnings Comparison
  const hasAnyBoxed = drugsData.some(d => d.label && d.label.boxed_warning);
  if (hasAnyBoxed) {
    const boxedSection = el('section', { className: 'card section' });
    const boxedTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Boxed Warnings Comparison');
    boxedTitle.appendChild(helpButton('drug-labels', 'What boxed warnings mean'));
    boxedSection.appendChild(boxedTitle);
    const grid = el('div', { className: 'compare-grid' });
    drugsData.forEach((d, i) => {
      const text = d.label ? getLabelText(d.label.boxed_warning) : '';
      const col = el('div', { className: 'compare-col', style: `border-top: 3px solid ${getDrugColor(i)}` },
        el('h4', { style: `color: ${getDrugColor(i)}` }, d.genericName),
        text ? el('p', { className: 'boxed-text' }, text) : el('p', { className: 'no-data' }, 'None'),
      );
      grid.appendChild(col);
    });
    boxedSection.appendChild(grid);
    container.appendChild(boxedSection);
  }

  // Top Reactions Comparison
  const reactSection = el('section', { className: 'card section' });
  const reactTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Top Reactions \u2014 Side by Side');
  reactTitle.appendChild(helpButton('reporting-bias', 'Why report counts vary'));
  reactSection.appendChild(reactTitle);
  const reactCanvas = el('canvas', { 'aria-label': 'Comparison of top reported reactions across selected drugs' });
  const reactWrap = el('div', { className: 'chart-wrap chart-tall' });
  reactWrap.appendChild(reactCanvas);
  reactSection.appendChild(reactWrap);
  reactSection.appendChild(el('p', { className: 'caveat' }, 'Comparing report counts across drugs is unreliable because drugs differ in how widely they are prescribed and how actively their adverse events are reported.'));
  container.appendChild(reactSection);

  requestAnimationFrame(() => {
    renderComparisonReactions(reactCanvas, drugsData);
  });

  // Severity Comparison
  const sevSection = el('section', { className: 'card section' });
  const sevTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Severity Comparison (% of Reports)');
  sevTitle.appendChild(helpButton('severity-breakdown', 'Understanding severity categories'));
  sevSection.appendChild(sevTitle);
  const sevCanvas = el('canvas', { 'aria-label': 'Severity comparison across selected drugs as percentages' });
  const sevWrap = el('div', { className: 'chart-wrap chart-medium' });
  sevWrap.appendChild(sevCanvas);
  sevSection.appendChild(sevWrap);
  sevSection.appendChild(el('p', { className: 'caveat' }, 'Percentages shown are relative to each drug\'s total report count for a fairer comparison.'));
  container.appendChild(sevSection);

  requestAnimationFrame(() => {
    renderSeverityComparison(sevCanvas, drugsData);
  });

  // Label Sections Comparison (Tabbed)
  const labelSection = el('section', { className: 'card section' });
  const labelCompTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Label Sections Comparison');
  labelCompTitle.appendChild(helpButton('drug-labels', 'What labels tell you'));
  labelSection.appendChild(labelCompTitle);
  const tabBar = el('div', { className: 'tab-bar', role: 'tablist' });
  const tabContent = el('div', { className: 'tab-content' });

  LABEL_TABS.forEach((tab, i) => {
    const btn = el('button', {
      className: `tab-btn ${i === 0 ? 'active' : ''}`,
      role: 'tab',
      'aria-selected': i === 0 ? 'true' : 'false',
    }, tab.label);

    const panel = el('div', {
      className: `tab-panel ${i === 0 ? 'active' : ''}`,
      role: 'tabpanel',
    });
    const grid = el('div', { className: 'compare-grid' });
    drugsData.forEach((d, j) => {
      const label = d.label || {};
      const text = getLabelText(label[tab.key]) || (tab.alt ? getLabelText(label[tab.alt]) : '');
      const col = el('div', { className: 'compare-col', style: `border-top: 3px solid ${getDrugColor(j)}` },
        el('h4', { style: `color: ${getDrugColor(j)}` }, d.genericName),
        text ? el('div', { className: 'label-text', innerHTML: text.replace(/\n/g, '<br>') }) : el('p', { className: 'no-data' }, 'Not available for this product.'),
      );
      grid.appendChild(col);
    });
    panel.appendChild(grid);

    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      labelSection.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      panel.classList.add('active');
    });

    tabBar.appendChild(btn);
    tabContent.appendChild(panel);
  });

  labelSection.appendChild(tabBar);
  labelSection.appendChild(tabContent);
  container.appendChild(labelSection);

  // Recall History Comparison (merged timeline)
  const recallSection = el('section', { className: 'card section' });
  const recallCompTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Recall History Comparison');
  recallCompTitle.appendChild(helpButton('recall-classifications', 'Understanding recall classifications'));
  recallSection.appendChild(recallCompTitle);
  const allRecalls = [];
  drugsData.forEach((d, i) => {
    for (const r of (d.recalls || [])) {
      allRecalls.push({ ...r, drugName: d.genericName, drugIndex: i });
    }
  });
  allRecalls.sort((a, b) => (b.recall_initiation_date || '').localeCompare(a.recall_initiation_date || ''));

  if (allRecalls.length === 0) {
    recallSection.appendChild(el('p', { className: 'no-data' }, 'No recall records found for any selected drug (records available from 2004\u2013present).'));
  } else {
    const timeline = el('div', { className: 'recall-timeline' });
    for (const r of allRecalls) {
      const badge = recallClassBadge(r.classification);
      const date = r.recall_initiation_date ? `${r.recall_initiation_date.slice(0, 4)}-${r.recall_initiation_date.slice(4, 6)}-${r.recall_initiation_date.slice(6, 8)}` : '';
      const item = el('div', { className: 'recall-timeline-item', style: `border-left: 4px solid ${getDrugColor(r.drugIndex)}` },
        el('div', { className: 'recall-timeline-header' },
          el('span', { style: `color: ${getDrugColor(r.drugIndex)}; font-weight: 600` }, r.drugName),
          el('span', { className: `badge ${badge.className}` }, badge.text),
          el('span', { className: 'recall-date mono' }, date),
        ),
        el('p', { className: 'recall-reason' }, r.reason_for_recall || 'No reason provided'),
      );
      timeline.appendChild(item);
    }
    recallSection.appendChild(timeline);
  }
  container.appendChild(recallSection);

  // Reporting Trends Comparison
  const hasTrends = drugsData.some(d => d.trends && d.trends.length > 0);
  if (hasTrends) {
    const trendSection = el('section', { className: 'card section' });
    const trendTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Reporting Trends \u2014 Overlaid');
    trendTitle.appendChild(helpButton('reporting-bias', 'Why report counts vary'));
    trendSection.appendChild(trendTitle);
    const trendCanvas = el('canvas', { 'aria-label': 'Reporting trends comparison over time' });
    const trendWrap = el('div', { className: 'chart-wrap chart-medium' });
    trendWrap.appendChild(trendCanvas);
    trendSection.appendChild(trendWrap);
    trendSection.appendChild(el('p', { className: 'caveat' }, 'Increases in report volume often reflect improved reporting practices rather than increased adverse events.'));
    container.appendChild(trendSection);

    requestAnimationFrame(() => {
      renderComparisonTrends(trendCanvas, drugsData);
    });
  }
}
