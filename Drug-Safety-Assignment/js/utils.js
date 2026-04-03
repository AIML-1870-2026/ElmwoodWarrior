// utils.js — Utility functions for DrugLens

/**
 * Debounce a function by `delay` ms.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Strip HTML tags from a string.
 */
export function stripHTML(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Format a number with commas (e.g. 182431 -> "182,431").
 */
export function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

/**
 * Check if a label field has meaningful content.
 */
export function hasContent(field) {
  if (!field) return false;
  if (Array.isArray(field)) {
    return field.some(f => f && f.trim().length > 0);
  }
  return typeof field === 'string' && field.trim().length > 0;
}

/**
 * Get text from a label field (could be string or array).
 */
export function getLabelText(field) {
  if (!field) return '';
  if (Array.isArray(field)) return field.map(f => stripHTML(f)).join('\n\n');
  return stripHTML(field);
}

/**
 * Assign consistent colors to drugs in comparison.
 */
const DRUG_COLORS = ['#0D7377', '#4338CA', '#BE185D', '#B45309'];
const DRUG_COLORS_LIGHT = ['rgba(13,115,119,0.15)', 'rgba(67,56,202,0.15)', 'rgba(190,24,93,0.15)', 'rgba(179,83,9,0.15)'];

export function getDrugColor(index) {
  return DRUG_COLORS[index % DRUG_COLORS.length];
}

export function getDrugColorLight(index) {
  return DRUG_COLORS_LIGHT[index % DRUG_COLORS_LIGHT.length];
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text, maxLen = 150) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen).trimEnd() + '...';
}

/**
 * Create a DOM element with attributes and children.
 */
export function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') elem.className = val;
    else if (key === 'innerHTML') elem.innerHTML = val;
    else if (key.startsWith('on')) elem.addEventListener(key.slice(2).toLowerCase(), val);
    else elem.setAttribute(key, val);
  }
  for (const child of children) {
    if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
    else if (child) elem.appendChild(child);
  }
  return elem;
}

/**
 * Group receivedate counts by year.
 */
export function groupByYear(dateCounts) {
  if (!dateCounts) return [];
  const yearMap = {};
  for (const item of dateCounts) {
    const year = String(item.time).slice(0, 4);
    const yr = parseInt(year, 10);
    if (yr < 2004 || yr > new Date().getFullYear()) continue;
    yearMap[year] = (yearMap[year] || 0) + item.count;
  }
  return Object.entries(yearMap)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
    .slice(-15);
}

/**
 * Map patientsex codes to labels.
 */
export function mapSex(code) {
  const map = { 0: 'Unknown', 1: 'Male', 2: 'Female' };
  return map[code] || 'Unknown';
}
