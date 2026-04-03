// single-view.js — Single Drug Deep Dive view

import { fetchAllDrugData } from './api.js';
import { renderDonutChart, renderSeriousnessBar, renderReactionsBar, renderTrendLine, renderDemographicsChart, renderReactionNetwork } from './charts.js';
import { el, formatNumber, getLabelText, hasContent, stripHTML, truncate, mapSex } from './utils.js';
import { helpButton } from './help-modal.js';

const LABEL_TABS = [
  { key: 'warnings', alt: 'warnings_and_cautions', label: 'Warnings' },
  { key: 'adverse_reactions', label: 'Adverse Reactions' },
  { key: 'drug_interactions', label: 'Interactions' },
  { key: 'contraindications', label: 'Contraindications' },
  { key: 'indications_and_usage', label: 'Indications' },
  { key: 'dosage_and_administration', label: 'Dosage' },
  { key: 'pregnancy', alt: 'pregnancy_or_breast_feeding', label: 'Pregnancy' },
  { key: 'geriatric_use', label: 'Geriatric Use' },
  { key: 'pediatric_use', label: 'Pediatric Use' },
  { key: 'overdosage', label: 'Overdosage' },
];

function recallClassBadge(classification) {
  const cls = classification || '';
  if (cls.includes('I') && !cls.includes('II') && !cls.includes('III')) return { text: 'Class I', className: 'badge-severe' };
  if (cls.includes('II') && !cls.includes('III')) return { text: 'Class II', className: 'badge-warning' };
  return { text: 'Class III', className: 'badge-info' };
}

function renderSkeletons(container) {
  container.innerHTML = `
    <div class="skeleton-section"><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></div>
    <div class="skeleton-section"><div class="skeleton-block"></div></div>
    <div class="skeleton-section"><div class="skeleton-block"></div></div>
  `;
}

export async function renderSingleView(container, drug, onExploreClass) {
  container.innerHTML = '';
  renderSkeletons(container);

  let data;
  try {
    data = await fetchAllDrugData(drug.genericName);
  } catch (e) {
    if (e.message === 'RATE_LIMIT') {
      container.innerHTML = '<div class="card error-card"><h3>Rate Limit Reached</h3><p>We\'ve reached the request limit for the FDA database. Please wait 30 seconds and try again.</p></div>';
    } else {
      container.innerHTML = '<div class="card error-card"><h3>Error Loading Data</h3><p>Unable to connect to the FDA database. Please check your internet connection.</p></div>';
    }
    return;
  }

  container.innerHTML = '';
  const label = data.label || {};
  const ofd = label.openfda || {};

  // Drug Header
  const brandNames = (ofd.brand_name || drug.brandNames || []).join(', ');
  const pharmClass = (ofd.pharm_class_epc || [])[0] || drug.pharmClass || '';
  const route = (ofd.route || [])[0] || drug.route || '';
  const productType = (ofd.product_type || [])[0] || drug.productType || '';

  const header = el('div', { className: 'drug-header' },
    el('h2', { className: 'drug-name' }, drug.genericName),
    el('p', { className: 'drug-meta' },
      [pharmClass, route, productType].filter(Boolean).join(' · ')
    ),
    brandNames ? el('p', { className: 'drug-brands muted' }, `Brand names: ${brandNames}`) : null,
  );
  // Explore this drug class button
  if (pharmClass && onExploreClass) {
    const classBtn = el('button', { className: 'explore-class-btn' },
      el('span', {}, `Explore ${pharmClass}`),
      el('span', { className: 'explore-class-arrow' }, '\u2192'),
    );
    classBtn.addEventListener('click', () => onExploreClass(pharmClass));
    header.appendChild(classBtn);
  }
  container.appendChild(header);

  // Boxed Warning
  const boxedText = getLabelText(label.boxed_warning);
  if (boxedText) {
    const boxed = el('div', { className: 'card boxed-warning' },
      el('h3', { className: 'boxed-warning-title' }, 'BOXED WARNING'),
      el('p', {}, boxedText),
    );
    container.appendChild(boxed);
  }

  // Safety Snapshot
  const snapshot = el('section', { className: 'card section' });
  const snapshotTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Safety Snapshot');
  snapshotTitle.appendChild(helpButton('adverse-events', 'How to interpret adverse event data'));
  snapshot.appendChild(snapshotTitle);
  const snapshotBody = el('div', { className: 'snapshot-grid' });

  const totalEl = el('div', { className: 'stat-block' },
    el('div', { className: 'stat-value' }, formatNumber(data.totalReports)),
    el('div', { className: 'stat-label' }, 'Total FAERS Reports'),
  );
  snapshotBody.appendChild(totalEl);

  const donutWrap = el('div', { className: 'chart-wrap chart-small' });
  const donutCanvas = el('canvas', { 'aria-label': `Serious vs non-serious reports for ${drug.genericName}` });
  donutWrap.appendChild(donutCanvas);
  snapshotBody.appendChild(donutWrap);

  const barWrap = el('div', { className: 'chart-wrap chart-medium' });
  const barCanvas = el('canvas', { 'aria-label': `Seriousness breakdown for ${drug.genericName}` });
  barWrap.appendChild(barCanvas);
  snapshotBody.appendChild(barWrap);

  snapshot.appendChild(snapshotBody);
  snapshot.appendChild(el('p', { className: 'caveat' }, 'Report counts \u2260 incidence rates. These numbers reflect reports submitted to the FDA, not confirmed cases. A higher count does not mean a drug is more dangerous.'));
  container.appendChild(snapshot);

  // Severity help button
  const sevHelpBtn = helpButton('severity-breakdown', 'Understanding severity categories');
  snapshotBody.appendChild(sevHelpBtn);

  // Render charts after DOM insertion
  requestAnimationFrame(() => {
    renderDonutChart(donutCanvas, data.seriousness);
    renderSeriousnessBar(barCanvas, data.breakdown, data.totalReports);
  });

  // Top Reported Reactions
  if (data.reactions.length > 0) {
    const reactSection = el('section', { className: 'card section' });
    const reactTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Top Reported Reactions');
    reactTitle.appendChild(helpButton('reporting-bias', 'Why some drugs have more reports'));
    reactSection.appendChild(reactTitle);
    const reactCanvas = el('canvas', { 'aria-label': `Top 15 reported reactions for ${drug.genericName}` });
    const reactWrap = el('div', { className: 'chart-wrap chart-tall' });
    reactWrap.appendChild(reactCanvas);
    reactSection.appendChild(reactWrap);
    reactSection.appendChild(el('p', { className: 'caveat' }, 'Adverse event reports are voluntarily submitted. A report does not prove the drug caused the event.'));
    container.appendChild(reactSection);

    requestAnimationFrame(() => {
      renderReactionsBar(reactCanvas, data.reactions, data.totalReports);
    });
  }

  // Reaction Network Graph (Visual Storytelling)
  if (data.reactions.length > 0) {
    const networkSection = el('section', { className: 'card section' });
    const networkTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Reaction Network');
    networkTitle.appendChild(helpButton('network-graph', 'Reading the reaction network'));
    networkSection.appendChild(networkTitle);
    const networkCanvas = el('canvas', {
      className: 'network-canvas',
      'aria-label': `Reaction network graph for ${drug.genericName}`,
      width: '800',
      height: '500',
    });
    const networkWrap = el('div', { className: 'chart-wrap network-wrap' });
    networkWrap.appendChild(networkCanvas);
    networkSection.appendChild(networkWrap);
    networkSection.appendChild(el('p', { className: 'caveat' }, 'Node size reflects report frequency. Connections show which reactions are most commonly reported for this drug.'));
    container.appendChild(networkSection);

    requestAnimationFrame(() => {
      renderReactionNetwork(networkCanvas, drug.genericName, data.reactions);
    });
  }

  // Demographics (Visual Storytelling)
  if (data.demographics.length > 0) {
    const demoSection = el('section', { className: 'card section' });
    const demoTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Reporter Demographics');
    demoTitle.appendChild(helpButton('demographics', 'Understanding demographic data'));
    demoSection.appendChild(demoTitle);
    const demoCanvas = el('canvas', { 'aria-label': `Demographics breakdown for ${drug.genericName}` });
    const demoWrap = el('div', { className: 'chart-wrap chart-small' });
    demoWrap.appendChild(demoCanvas);
    demoSection.appendChild(demoWrap);
    demoSection.appendChild(el('p', { className: 'caveat' }, 'Demographics reflect who was reported as taking the drug, not the broader patient population. Reporting rates differ by sex and age group.'));
    container.appendChild(demoSection);

    requestAnimationFrame(() => {
      renderDemographicsChart(demoCanvas, data.demographics);
    });
  }

  // From the Label (Tabbed)
  const labelSection = el('section', { className: 'card section' });
  const labelTitle = el('h3', { className: 'section-title section-title-with-help' }, 'From the Label');
  labelTitle.appendChild(helpButton('drug-labels', 'What drug labels actually tell you'));
  labelSection.appendChild(labelTitle);
  const tabBar = el('div', { className: 'tab-bar', role: 'tablist' });
  const tabContent = el('div', { className: 'tab-content' });

  LABEL_TABS.forEach((tab, i) => {
    const text = getLabelText(label[tab.key]) || (tab.alt ? getLabelText(label[tab.alt]) : '');
    const btn = el('button', {
      className: `tab-btn ${i === 0 ? 'active' : ''}`,
      role: 'tab',
      'aria-selected': i === 0 ? 'true' : 'false',
    }, tab.label);

    const panel = el('div', {
      className: `tab-panel ${i === 0 ? 'active' : ''}`,
      role: 'tabpanel',
    });
    if (text) {
      panel.appendChild(el('div', { className: 'label-text', innerHTML: text.replace(/\n/g, '<br>') }));
    } else {
      panel.appendChild(el('p', { className: 'no-data' }, 'This section is not available for this drug product.'));
    }

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
  labelSection.appendChild(el('p', { className: 'caveat' }, 'Label information reflects what manufacturers have submitted to the FDA. It may not match the labeling on currently distributed products.'));
  container.appendChild(labelSection);

  // Recall History
  const recallSection = el('section', { className: 'card section' });
  const recallTitle = el('h3', { className: 'section-title section-title-with-help' }, 'Recall History');
  recallTitle.appendChild(helpButton('recall-classifications', 'Understanding recall classifications'));
  recallSection.appendChild(recallTitle);
  if (data.recalls.length === 0) {
    recallSection.appendChild(el('p', { className: 'no-data' }, 'No recall records found in the FDA database (records available from 2004\u2013present).'));
  } else {
    const timeline = el('div', { className: 'recall-timeline' });
    for (const r of data.recalls) {
      const badge = recallClassBadge(r.classification);
      const date = r.recall_initiation_date ? `${r.recall_initiation_date.slice(0, 4)}-${r.recall_initiation_date.slice(4, 6)}-${r.recall_initiation_date.slice(6, 8)}` : '';
      const item = el('div', { className: 'recall-timeline-item' },
        el('div', { className: 'recall-timeline-header' },
          el('span', { className: `badge ${badge.className}` }, badge.text),
          el('span', { className: 'recall-date mono' }, date),
          el('span', { className: 'recall-status badge badge-outline' }, r.status || ''),
        ),
        el('p', { className: 'recall-reason' }, r.reason_for_recall || 'No reason provided'),
      );
      timeline.appendChild(item);
    }
    recallSection.appendChild(timeline);
  }
  recallSection.appendChild(el('p', { className: 'caveat' }, 'FDA recall records in this database cover 2004\u2013present. Absence of recalls does not guarantee a drug has never been recalled.'));
  container.appendChild(recallSection);

  // Reporting Trends
  if (data.trends.length > 0) {
    const trendSection = el('section', { className: 'card section' });
    trendSection.innerHTML = `<h3 class="section-title">Reporting Trends</h3>`;
    const trendCanvas = el('canvas', { 'aria-label': `Reporting trends over time for ${drug.genericName}` });
    const trendWrap = el('div', { className: 'chart-wrap chart-medium' });
    trendWrap.appendChild(trendCanvas);
    trendSection.appendChild(trendWrap);
    trendSection.appendChild(el('p', { className: 'caveat' }, 'Increases in report volume often reflect improved reporting practices rather than increased adverse events.'));
    container.appendChild(trendSection);

    requestAnimationFrame(() => {
      renderTrendLine(trendCanvas, data.trends);
    });
  }

  // Drug Identity
  const idSection = el('section', { className: 'card section' });
  idSection.innerHTML = `<h3 class="section-title">Drug Identity</h3>`;
  const idGrid = el('div', { className: 'identity-grid' });
  const fields = [
    ['Generic Name', drug.genericName],
    ['Brand Names', brandNames || '—'],
    ['Manufacturer', (ofd.manufacturer_name || []).join(', ') || '—'],
    ['Product Type', productType || '—'],
    ['Route', route || '—'],
    ['Pharmacologic Class', pharmClass || '—'],
    ['Substance', (ofd.substance_name || []).join(', ') || '—'],
  ];
  for (const [lbl, val] of fields) {
    idGrid.appendChild(el('div', { className: 'identity-field' },
      el('dt', {}, lbl),
      el('dd', {}, val),
    ));
  }
  idSection.appendChild(idGrid);
  container.appendChild(idSection);

  // Understanding This Data
  const eduSection = el('section', { className: 'card section collapsible' });
  eduSection.innerHTML = `
    <h3 class="section-title collapsible-toggle" tabindex="0" role="button" aria-expanded="false">Understanding This Data <span class="toggle-icon">+</span></h3>
    <div class="collapsible-content" hidden>
      <h4>What is FAERS?</h4>
      <p>The FDA Adverse Event Reporting System (FAERS) is a database of voluntary reports of adverse events, medication errors, and product quality complaints submitted to the FDA. Anyone — patients, healthcare providers, manufacturers — can submit a report.</p>
      <h4>Why report counts are NOT incidence rates</h4>
      <p>A drug with 100,000 reports is not necessarily more dangerous than one with 1,000. More commonly prescribed drugs naturally accumulate more reports. Newer drugs may have fewer reports simply because they've been on the market for less time. Reporting is voluntary and varies significantly by drug, condition, and reporter.</p>
      <h4>What a Boxed Warning means</h4>
      <p>A boxed warning (or "black box warning") is the most severe warning the FDA requires. It indicates significant risks of serious or life-threatening adverse effects. The presence of a boxed warning does not mean a drug should never be used — it means the risks must be carefully weighed against the benefits.</p>
      <h4>Recall Classifications</h4>
      <p><strong>Class I:</strong> Dangerous or defective products that could cause serious health problems or death.<br>
      <strong>Class II:</strong> Products that might cause a temporary health problem, or pose a slight threat of a serious nature.<br>
      <strong>Class III:</strong> Products that are unlikely to cause any adverse health reaction, but violate FDA labeling or manufacturing laws.</p>
      <h4>How to use this data</h4>
      <p>This tool is for educational exploration only. Use it to familiarize yourself with a drug's safety profile, understand what the FDA knows, and prepare informed questions for your healthcare provider. Never use this data to make medication decisions on your own.</p>
    </div>
  `;
  const toggle = eduSection.querySelector('.collapsible-toggle');
  const content = eduSection.querySelector('.collapsible-content');
  const icon = eduSection.querySelector('.toggle-icon');
  toggle.addEventListener('click', () => {
    const expanded = content.hidden;
    content.hidden = !expanded;
    toggle.setAttribute('aria-expanded', expanded);
    icon.textContent = expanded ? '−' : '+';
  });
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
  });
  container.appendChild(eduSection);
}
