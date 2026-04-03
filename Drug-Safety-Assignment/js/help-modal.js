// help-modal.js — Contextual help buttons and educational modal popups

import { el } from './utils.js';

const HELP_CONTENT = {
  'adverse-events': {
    title: 'How to Interpret Adverse Event Data',
    body: `
      <p>The FDA Adverse Event Reporting System (FAERS) collects <strong>voluntary reports</strong> of adverse events from patients, healthcare providers, and manufacturers. Here's what you need to know:</p>
      <h4>Correlation ≠ Causation</h4>
      <p>A report means someone experienced a health problem while taking a drug — it does <em>not</em> prove the drug caused the problem. The person may have had an underlying condition, taken other medications, or experienced an unrelated event.</p>
      <h4>More Reports ≠ More Dangerous</h4>
      <p>A drug taken by 50 million people will naturally have far more reports than one taken by 50,000 — even if the second drug is objectively more dangerous. Popular drugs like ibuprofen have enormous report counts simply because so many people take them.</p>
      <h4>Reporting is Voluntary and Uneven</h4>
      <p>Serious events (hospitalizations, deaths) are more likely to be reported than mild ones. Newer drugs tend to get more scrutiny. Media attention can spike reporting for specific drugs. None of this reflects actual risk changes.</p>
      <h4>What the Numbers ARE Good For</h4>
      <p>FAERS data is excellent for <em>signal detection</em> — spotting patterns that warrant further investigation. If a specific reaction appears unusually often for a drug, the FDA investigates. Think of this data as a radar system, not a verdict.</p>
    `,
  },
  'recall-classifications': {
    title: 'Understanding Recall Classifications',
    body: `
      <p>When the FDA identifies a problem with a drug product, it issues a recall classified by the severity of the health risk:</p>
      <h4>Class I — Most Serious</h4>
      <p>Products that could cause <strong>serious health problems or death</strong>. These are rare and urgent. Examples: a drug contaminated with a dangerous substance, a life-saving medication with no active ingredient, or a product with incorrect dosing instructions that could lead to overdose.</p>
      <h4>Class II — Moderate Risk</h4>
      <p>Products that might cause <strong>temporary or reversible health problems</strong>, or where the probability of serious harm is remote. This is the most common class. Examples: a drug with mislabeled strength, antibiotics that may not maintain potency, or a product with an undeclared allergen.</p>
      <h4>Class III — Least Serious</h4>
      <p>Products unlikely to cause any health problems but that <strong>violate FDA rules</strong>. Examples: a product with a label that's missing required information, or packaging that doesn't meet regulatory standards but poses no safety concern.</p>
      <h4>Important Context</h4>
      <p>A recall doesn't necessarily mean a drug was pulled from pharmacy shelves. Many recalls are voluntary actions by manufacturers and may involve specific batches, not the drug as a whole.</p>
    `,
  },
  'drug-interactions': {
    title: 'Drug Pairs with Known Dangerous Interactions',
    body: `
      <p>Some drug combinations are well-established as dangerous. Understanding these classic examples helps illustrate why interaction data matters:</p>
      <h4>Warfarin + NSAIDs → Bleeding Risk</h4>
      <p>Warfarin is a blood thinner. NSAIDs (like ibuprofen, naproxen, aspirin) also affect blood clotting and can irritate the stomach lining. Together, they significantly increase the risk of serious — potentially fatal — bleeding events.</p>
      <h4>MAO Inhibitors + Serotonergic Drugs → Serotonin Syndrome</h4>
      <p>MAO inhibitors (older antidepressants like phenelzine) combined with SSRIs, SNRIs, or even some pain medications (tramadol, meperidine) can cause serotonin syndrome — a potentially life-threatening condition with symptoms including agitation, rapid heart rate, high blood pressure, and seizures.</p>
      <h4>Methotrexate + NSAIDs → Methotrexate Toxicity</h4>
      <p>NSAIDs reduce kidney function, which can cause methotrexate (used for cancer and autoimmune diseases) to build up to toxic levels. This can lead to severe bone marrow suppression, liver damage, and kidney failure.</p>
      <h4>Why This Matters Here</h4>
      <p>The interaction data shown in drug labels reflects what was known at the time of labeling. New interactions are discovered regularly. Always consult a pharmacist or doctor about potential interactions with your specific medications.</p>
    `,
  },
  'drug-labels': {
    title: 'What Drug Labels Actually Tell You',
    body: `
      <p>The "label" isn't the sticker on the bottle — it's the <strong>FDA-approved prescribing information</strong>, a comprehensive document that is the most authoritative public source of drug safety data.</p>
      <h4>How Labels Are Created</h4>
      <p>Before a drug is approved, the manufacturer submits clinical trial data to the FDA. The label is written based on this data and must be approved by the FDA. After approval, the label is updated as new safety information emerges from post-marketing surveillance.</p>
      <h4>Key Sections</h4>
      <p><strong>Boxed Warning:</strong> The most severe warning. Reserved for serious or life-threatening risks. Not all drugs have one.<br>
      <strong>Warnings & Precautions:</strong> Important safety concerns that may affect prescribing decisions.<br>
      <strong>Adverse Reactions:</strong> Side effects observed in clinical trials and post-marketing reports.<br>
      <strong>Contraindications:</strong> Situations where the drug must NOT be used.<br>
      <strong>Drug Interactions:</strong> Known interactions with other substances.</p>
      <h4>What Labels Don't Tell You</h4>
      <p>Labels don't cover off-label uses, every possible side effect, or how a drug compares to alternatives. They reflect the manufacturer's data as reviewed by the FDA — thorough but not exhaustive.</p>
    `,
  },
  'reporting-bias': {
    title: 'Why Some Drugs Have More Reports Than Others',
    body: `
      <p>If Drug A has 500,000 adverse event reports and Drug B has 5,000, your instinct might be that Drug A is 100× more dangerous. In reality, it might just be 100× more popular.</p>
      <h4>Prescription Volume</h4>
      <p>The single biggest factor in report counts is how many people take the drug. Atorvastatin (Lipitor) and lisinopril are among the most prescribed drugs in the world — they'll naturally have massive report counts regardless of their actual safety profile.</p>
      <h4>Time on Market</h4>
      <p>A drug approved in 1990 has had 35+ years to accumulate reports. A drug approved last year has had one. Comparing raw counts between them is meaningless.</p>
      <h4>Media and Legal Attention</h4>
      <p>When a drug makes headlines or becomes the subject of lawsuits, reporting spikes dramatically. This doesn't mean the drug suddenly became more dangerous — it means more people started filing reports.</p>
      <h4>Seriousness Bias</h4>
      <p>Severe outcomes (death, hospitalization) are far more likely to be reported than mild ones (headache, nausea). This means FAERS data skews toward severe events and underrepresents common mild side effects.</p>
      <h4>The Bottom Line</h4>
      <p>Use report counts to understand <em>what types</em> of events are reported for a drug, not to judge how dangerous it is. For actual risk assessment, look at clinical trial data and talk to your healthcare provider.</p>
    `,
  },
  'about-tool': {
    title: 'About This Tool',
    body: `
      <p><strong>DrugLens</strong> is an educational exploration tool that makes FDA drug safety data accessible and comparable. Here's what you need to know:</p>
      <h4>Where the Data Comes From</h4>
      <p>All data is pulled in real-time from <strong>OpenFDA</strong>, the FDA's public API. This includes drug labels (prescribing information), adverse event reports (FAERS), and recall/enforcement data. No data is stored on our servers — everything is fetched directly from the FDA.</p>
      <h4>What This Tool CAN Do</h4>
      <p>• Show you the FDA-approved labeling for a drug<br>
      • Display reported adverse events and their relative frequency<br>
      • Compare safety profiles across multiple drugs<br>
      • Show recall history and classifications<br>
      • Help you explore drug classes and categories</p>
      <h4>What This Tool CANNOT Do</h4>
      <p>• Tell you whether a drug is safe for <em>you</em> specifically<br>
      • Replace medical advice from a qualified healthcare provider<br>
      • Prove that a drug caused a specific adverse event<br>
      • Provide dosing recommendations<br>
      • Account for your personal medical history, other medications, or conditions</p>
      <h4>When to Consult a Professional</h4>
      <p><strong>Always.</strong> Use this tool to educate yourself and prepare informed questions — then bring those questions to your doctor, pharmacist, or other healthcare provider. They can interpret this data in the context of your individual health situation.</p>
    `,
  },
  'severity-breakdown': {
    title: 'Understanding Severity Categories',
    body: `
      <p>When an adverse event is reported to the FDA, the reporter indicates the seriousness of the outcome. Here's what each category means:</p>
      <h4>Death</h4>
      <p>The patient died. This does <strong>not</strong> mean the drug caused the death — only that the patient was taking the drug when they died. Many patients on medication are seriously ill, and deaths may be related to their underlying condition rather than the drug itself.</p>
      <h4>Hospitalization</h4>
      <p>The adverse event led to or extended a hospital stay. This is the most common "serious" outcome and covers everything from an allergic reaction requiring observation to a serious organ injury.</p>
      <h4>Life-Threatening</h4>
      <p>The reporter judged the event as putting the patient at immediate risk of death. This is subjective and depends on the reporter's assessment at the time.</p>
      <h4>Disabling</h4>
      <p>The event resulted in significant, persistent, or permanent impairment of a body function or damage to body structure.</p>
      <h4>Why Percentages Matter More Than Counts</h4>
      <p>When comparing drugs, look at what <em>percentage</em> of reports fall into each severity category rather than raw counts. A drug with 1,000 reports and 5% death outcomes tells a different story than one with 100,000 reports and 0.5% death outcomes.</p>
    `,
  },
  'demographics': {
    title: 'Understanding Demographic Data',
    body: `
      <p>FAERS reports include basic demographic information about the patient. Here's how to interpret it:</p>
      <h4>Sex Distribution</h4>
      <p>Differences in report counts between males and females may reflect actual differences in drug response, differences in who takes the medication, or differences in who reports adverse events. Women tend to report adverse events more frequently than men across most drug categories.</p>
      <h4>What Demographics Don't Tell You</h4>
      <p>FAERS doesn't capture race, socioeconomic status, or detailed medical history in a way that's useful for analysis. The demographic data is limited and should be interpreted cautiously.</p>
      <h4>Reporting Bias in Demographics</h4>
      <p>Certain populations are overrepresented in FAERS data. For example, older adults are more likely to have reports filed (often by healthcare providers) because they tend to take more medications and have more medical encounters.</p>
    `,
  },
  'network-graph': {
    title: 'Reading the Reaction Network',
    body: `
      <p>The reaction network graph shows connections between drugs and their most commonly reported adverse events.</p>
      <h4>How to Read It</h4>
      <p>• The <strong>center node</strong> represents the drug<br>
      • <strong>Connected nodes</strong> represent reported adverse reactions<br>
      • <strong>Node size</strong> reflects how frequently the reaction was reported<br>
      • <strong>Line thickness</strong> also indicates report frequency</p>
      <h4>What Patterns to Look For</h4>
      <p>• <strong>Large nodes</strong> indicate very commonly reported reactions — but remember, common doesn't mean severe<br>
      • <strong>Clusters</strong> of related reactions (e.g., "nausea," "vomiting," "diarrhea") suggest a common mechanism<br>
      • When comparing drugs, shared reactions appear as common patterns across their networks</p>
      <h4>Limitations</h4>
      <p>This visualization shows report frequency, not incidence rate or severity. A reaction appearing large in the network means it was frequently <em>reported</em>, which is influenced by all the reporting biases discussed elsewhere in this tool.</p>
    `,
  },
  'drug-class': {
    title: 'Understanding Drug Classes',
    body: `
      <p>A <strong>drug class</strong> is a group of medications that work in similar ways — they share a common mechanism of action or treat the same types of conditions.</p>
      <h4>Why Drug Classes Matter</h4>
      <p>Drugs within the same class often share similar side effect profiles, but there can be meaningful differences. For example, all statins lower cholesterol, but some may cause more muscle pain than others. Understanding the class helps you see the bigger picture.</p>
      <h4>What You Can Learn</h4>
      <p>• Which drugs in a class have more adverse event reports (adjusted for popularity)<br>
      • Whether certain side effects are class-wide or specific to individual drugs<br>
      • Which drugs in a class have recall histories<br>
      • How safety profiles compare within the same therapeutic category</p>
      <h4>Important Caveats</h4>
      <p>Drug classification can be complex — a single drug may belong to multiple classes. The classes shown here are based on the FDA's Established Pharmacologic Class (EPC), which categorizes drugs by their mechanism of action. This is just one of many possible classification systems.</p>
    `,
  },
};

let modalEl = null;

function getOrCreateModal() {
  if (modalEl) return modalEl;
  const overlay = el('div', { className: 'help-modal-overlay', hidden: true });
  const modal = el('div', { className: 'help-modal' });
  const closeBtn = el('button', { className: 'help-modal-close', 'aria-label': 'Close help', innerHTML: '&times;' });
  const title = el('h2', { className: 'help-modal-title' });
  const body = el('div', { className: 'help-modal-body' });

  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close handlers
  closeBtn.addEventListener('click', () => closeModal());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  modalEl = { overlay, modal, title, body };
  return modalEl;
}

function closeModal() {
  if (!modalEl) return;
  modalEl.overlay.classList.remove('open');
  setTimeout(() => { modalEl.overlay.hidden = true; }, 200);
}

export function openHelpModal(topicKey) {
  const content = HELP_CONTENT[topicKey];
  if (!content) return;
  const m = getOrCreateModal();
  m.title.textContent = content.title;
  m.body.innerHTML = content.body;
  m.overlay.hidden = false;
  // Trigger animation
  requestAnimationFrame(() => m.overlay.classList.add('open'));
}

/**
 * Create a small help button that opens a modal when clicked.
 */
export function helpButton(topicKey, label = '') {
  const btn = el('button', {
    className: 'help-btn',
    'aria-label': label || `Learn more about ${topicKey.replace(/-/g, ' ')}`,
    title: label || 'Learn more',
  }, '?');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openHelpModal(topicKey);
  });
  return btn;
}

/**
 * Create a header-level "How to Read This Data" button.
 */
export function headerHelpButton() {
  const btn = el('button', { className: 'header-help-btn' },
    el('span', { className: 'header-help-icon' }, '?'),
    el('span', {}, 'How to Read This Data'),
  );
  btn.addEventListener('click', () => openHelpModal('about-tool'));
  return btn;
}
