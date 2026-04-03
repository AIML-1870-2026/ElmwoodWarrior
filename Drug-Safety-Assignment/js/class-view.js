// class-view.js — Drug Class Exploration view

import { fetchAllDrugData } from './api.js';
import { renderSeverityComparison, renderComparisonReactions } from './charts.js';
import { el, formatNumber, getDrugColor } from './utils.js';
import { helpButton } from './help-modal.js';

/**
 * Search for drugs in a given pharmacologic class.
 */
async function searchByClass(pharmClass) {
  const q = encodeURIComponent(pharmClass);
  const url = `https://api.fda.gov/drug/label.json?search=openfda.pharm_class_epc.exact:"${q}"&limit=10`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.results) return [];
    const seen = new Set();
    const results = [];
    for (const r of data.results) {
      const ofd = r.openfda || {};
      const generic = (ofd.generic_name || [])[0];
      if (!generic) continue;
      const key = generic.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        genericName: key,
        brandNames: (ofd.brand_name || []).map(b => b.toUpperCase()),
        pharmClass: (ofd.pharm_class_epc || [])[0] || '',
        productType: (ofd.product_type || [])[0] || '',
        route: (ofd.route || [])[0] || '',
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function renderClassView(container, pharmClass, onDrugSelect) {
  container.innerHTML = '';

  // Header
  const header = el('div', { className: 'class-header' },
    el('h2', { className: 'class-title' }, pharmClass),
    el('p', { className: 'class-subtitle muted' }, 'Drug Class Exploration'),
  );
  const classHelp = helpButton('drug-class', 'Understanding drug classes');
  header.querySelector('.class-title').appendChild(classHelp);
  container.appendChild(header);

  // Loading
  const loadingSection = el('section', { className: 'card section' });
  loadingSection.innerHTML = `
    <p>Finding drugs in this class...</p>
    <div class="skeleton-section"><div class="skeleton-block"></div></div>
  `;
  container.appendChild(loadingSection);

  // Search for drugs in this class
  const drugs = await searchByClass(pharmClass);

  if (drugs.length === 0) {
    loadingSection.innerHTML = '<p class="no-data">No drugs found for this pharmacologic class.</p>';
    return;
  }

  // Remove loading
  loadingSection.remove();

  // Drug list
  const listSection = el('section', { className: 'card section' });
  const listTitle = el('h3', { className: 'section-title' }, `Drugs in This Class (${drugs.length})`);
  listSection.appendChild(listTitle);

  const drugGrid = el('div', { className: 'class-drug-grid' });
  for (const drug of drugs) {
    const brandStr = drug.brandNames.length > 0 ? drug.brandNames.slice(0, 2).join(', ') : '';
    const card = el('button', { className: 'class-drug-card' },
      el('span', { className: 'class-drug-name' }, drug.genericName),
      brandStr ? el('span', { className: 'class-drug-brand muted' }, brandStr) : null,
    );
    card.addEventListener('click', () => onDrugSelect(drug));
    drugGrid.appendChild(card);
  }
  listSection.appendChild(drugGrid);
  container.appendChild(listSection);

  // Now load safety data for all drugs and build comparative views
  const compareSection = el('section', { className: 'card section' });
  const compareTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Class Safety Comparison');
  compareTitle.appendChild(helpButton('adverse-events', 'How to interpret this data'));
  compareSection.appendChild(compareTitle);
  compareSection.innerHTML += '<p class="muted">Loading safety data for comparison...</p>';
  container.appendChild(compareSection);

  // Fetch data for up to 6 drugs (API rate limit friendly)
  const drugsToCompare = drugs.slice(0, 6);
  const drugsData = [];

  for (const drug of drugsToCompare) {
    try {
      const data = await fetchAllDrugData(drug.genericName);
      drugsData.push({ ...drug, ...data });
    } catch {
      // skip drugs that fail
    }
  }

  if (drugsData.length < 2) {
    compareSection.innerHTML = '';
    compareSection.appendChild(compareTitle);
    compareSection.appendChild(el('p', { className: 'no-data' }, 'Not enough data available to compare drugs within this class.'));
    return;
  }

  // Build comparison table
  compareSection.innerHTML = '';
  compareSection.appendChild(compareTitle);

  // Overview table
  const table = el('table', { className: 'glance-table' });
  const thead = el('thead');
  const headerRow = el('tr', {}, el('th', {}, ''));
  drugsData.forEach((d, i) => {
    headerRow.appendChild(el('th', { style: `color: ${getDrugColor(i)}` }, d.genericName));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  const rows = [
    { label: 'Total Reports', fn: d => formatNumber(d.totalReports) },
    { label: 'Boxed Warning', fn: d => d.label && d.label.boxed_warning ? 'YES' : 'No' },
    { label: 'Recalls', fn: d => d.recalls ? String(d.recalls.length) : '0' },
    { label: '% Serious', fn: d => {
      const total = d.totalReports || 1;
      const serious = d.seriousness ? d.seriousness.serious : 0;
      return ((serious / total) * 100).toFixed(1) + '%';
    }},
    { label: '% Death', fn: d => {
      const total = d.totalReports || 1;
      const deaths = d.breakdown ? (d.breakdown.seriousnessdeath || 0) : 0;
      return ((deaths / total) * 100).toFixed(2) + '%';
    }},
  ];

  for (const row of rows) {
    const tr = el('tr', {}, el('td', { className: 'row-label' }, row.label));
    for (const d of drugsData) {
      const val = row.fn(d);
      const td = el('td', {}, val);
      if (row.label === 'Boxed Warning' && val === 'YES') td.classList.add('text-severe');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  compareSection.appendChild(table);
  compareSection.appendChild(el('p', { className: 'caveat' }, 'Report counts reflect voluntary submissions to the FDA and vary with prescription volume. Higher counts do not mean a drug is more dangerous.'));

  // Severity comparison chart
  const sevSection = el('section', { className: 'card section' });
  const sevTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Severity Profile Within Class');
  sevTitle.appendChild(helpButton('severity-breakdown', 'Understanding severity'));
  sevSection.appendChild(sevTitle);
  const sevCanvas = el('canvas', { 'aria-label': `Severity comparison for ${pharmClass}` });
  const sevWrap = el('div', { className: 'chart-wrap chart-medium' });
  sevWrap.appendChild(sevCanvas);
  sevSection.appendChild(sevWrap);
  sevSection.appendChild(el('p', { className: 'caveat' }, 'Percentages are relative to each drug\'s total report count for fairer comparison within the class.'));
  container.appendChild(sevSection);

  requestAnimationFrame(() => {
    renderSeverityComparison(sevCanvas, drugsData);
  });

  // Top reactions comparison
  const reactSection = el('section', { className: 'card section' });
  const reactTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Common Reactions Across Class');
  reactTitle.appendChild(helpButton('reporting-bias', 'Why counts differ'));
  reactSection.appendChild(reactTitle);
  const reactCanvas = el('canvas', { 'aria-label': `Reaction comparison for ${pharmClass}` });
  const reactWrap = el('div', { className: 'chart-wrap chart-tall' });
  reactWrap.appendChild(reactCanvas);
  reactSection.appendChild(reactWrap);
  reactSection.appendChild(el('p', { className: 'caveat' }, 'Shared reactions across a drug class may indicate class-wide effects. Unique reactions to a specific drug may warrant further investigation.'));
  container.appendChild(reactSection);

  requestAnimationFrame(() => {
    renderComparisonReactions(reactCanvas, drugsData);
  });

  // Key insights
  const insightSection = el('section', { className: 'card section' });
  insightSection.appendChild(el('h3', { className: 'section-title' }, 'Key Insights'));

  const insights = generateClassInsights(drugsData, pharmClass);
  const insightList = el('ul', { className: 'insight-list' });
  for (const insight of insights) {
    insightList.appendChild(el('li', { className: 'insight-item' },
      el('span', { className: 'insight-icon' }, insight.icon),
      el('span', {}, insight.text),
    ));
  }
  insightSection.appendChild(insightList);
  insightSection.appendChild(el('p', { className: 'caveat' }, 'These insights are algorithmically generated from the data shown above. They highlight patterns but do not constitute medical analysis.'));
  container.appendChild(insightSection);
}

function generateClassInsights(drugsData, className) {
  const insights = [];

  // Most reported drug
  const mostReported = [...drugsData].sort((a, b) => b.totalReports - a.totalReports)[0];
  insights.push({
    icon: '\uD83D\uDCCA',
    text: `${mostReported.genericName} has the most FAERS reports in this class (${formatNumber(mostReported.totalReports)}), which likely reflects higher prescription volume rather than worse safety.`,
  });

  // Boxed warnings
  const withBoxed = drugsData.filter(d => d.label && d.label.boxed_warning);
  if (withBoxed.length === 0) {
    insights.push({ icon: '\u2705', text: `No drugs in this ${className} sample carry a boxed warning.` });
  } else {
    insights.push({
      icon: '\u26A0\uFE0F',
      text: `${withBoxed.map(d => d.genericName).join(', ')} ${withBoxed.length === 1 ? 'carries' : 'carry'} a boxed warning — the FDA's most serious safety label.`,
    });
  }

  // Highest death percentage
  const withDeathPct = drugsData.map(d => ({
    name: d.genericName,
    pct: d.totalReports > 0 ? ((d.breakdown?.seriousnessdeath || 0) / d.totalReports * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  if (withDeathPct[0].pct > 0) {
    insights.push({
      icon: '\uD83D\uDCC9',
      text: `Death-associated reports range from ${withDeathPct[withDeathPct.length - 1].pct.toFixed(2)}% (${withDeathPct[withDeathPct.length - 1].name}) to ${withDeathPct[0].pct.toFixed(2)}% (${withDeathPct[0].name}) of total reports. These are reported associations, not proven causes.`,
    });
  }

  // Recalls
  const withRecalls = drugsData.filter(d => d.recalls && d.recalls.length > 0);
  if (withRecalls.length > 0) {
    const totalRecalls = withRecalls.reduce((sum, d) => sum + d.recalls.length, 0);
    insights.push({
      icon: '\uD83D\uDD04',
      text: `${totalRecalls} recall${totalRecalls > 1 ? 's' : ''} found across ${withRecalls.length} drug${withRecalls.length > 1 ? 's' : ''} in this class (from 2004\u2013present).`,
    });
  } else {
    insights.push({ icon: '\u2705', text: 'No recalls found for any drug in this class sample (2004\u2013present).' });
  }

  // Common top reaction
  const reactionCounts = {};
  for (const d of drugsData) {
    if (d.reactions && d.reactions.length > 0) {
      const topReaction = d.reactions[0].term;
      reactionCounts[topReaction] = (reactionCounts[topReaction] || 0) + 1;
    }
  }
  const mostCommonTop = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommonTop && mostCommonTop[1] > 1) {
    insights.push({
      icon: '\uD83D\uDD17',
      text: `"${mostCommonTop[0]}" is the #1 reported reaction for ${mostCommonTop[1]} drugs in this class, suggesting it may be a class-wide effect.`,
    });
  }

  return insights;
}
