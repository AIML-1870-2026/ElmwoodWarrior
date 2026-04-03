// search.js — Search bar with autocomplete and drug chip management

import { searchDrugs } from './api.js';
import { debounce, el, getDrugColor } from './utils.js';

const MAX_DRUGS = 4;

export function initSearch(searchContainer, onSelectionChange) {
  const selectedDrugs = [];
  let dropdownVisible = false;

  // Build DOM
  const chipTray = el('div', { className: 'chip-tray' });
  const input = el('input', {
    type: 'text',
    className: 'search-input',
    placeholder: 'Search by drug name (brand or generic)...',
    'aria-label': 'Search for a drug by name',
    autocomplete: 'off',
  });
  const dropdown = el('div', { className: 'search-dropdown', role: 'listbox', hidden: true });
  const inputWrap = el('div', { className: 'search-input-wrap' });
  inputWrap.appendChild(chipTray);
  inputWrap.appendChild(input);
  searchContainer.appendChild(inputWrap);
  searchContainer.appendChild(dropdown);

  function renderChips() {
    chipTray.innerHTML = '';
    selectedDrugs.forEach((drug, i) => {
      const chip = el('span', { className: 'drug-chip', style: `background: ${getDrugColor(i)}` },
        el('span', {}, drug.genericName),
      );
      const removeBtn = el('button', {
        className: 'chip-remove',
        'aria-label': `Remove ${drug.genericName}`,
        innerHTML: '&times;',
      });
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedDrugs.splice(i, 1);
        renderChips();
        onSelectionChange([...selectedDrugs]);
      });
      chip.appendChild(removeBtn);
      chipTray.appendChild(chip);
    });
    input.placeholder = selectedDrugs.length === 0
      ? 'Search by drug name (brand or generic)...'
      : selectedDrugs.length >= MAX_DRUGS
        ? 'Maximum 4 drugs selected'
        : 'Add another drug to compare...';
    input.disabled = selectedDrugs.length >= MAX_DRUGS;
  }

  function hideDropdown() {
    dropdown.hidden = true;
    dropdown.innerHTML = '';
    dropdownVisible = false;
  }

  function selectDrug(drug) {
    if (selectedDrugs.some(d => d.genericName === drug.genericName)) return;
    if (selectedDrugs.length >= MAX_DRUGS) return;
    selectedDrugs.push(drug);
    input.value = '';
    hideDropdown();
    renderChips();
    onSelectionChange([...selectedDrugs]);
  }

  const doSearch = debounce(async (query) => {
    if (query.length < 2) { hideDropdown(); return; }
    try {
      const results = await searchDrugs(query);
      if (results.length === 0) {
        dropdown.innerHTML = '';
        dropdown.appendChild(el('div', { className: 'dropdown-item no-results' }, 'No results found. Try the generic name.'));
        dropdown.hidden = false;
        dropdownVisible = true;
        return;
      }
      dropdown.innerHTML = '';
      for (const r of results) {
        const brandStr = r.brandNames.length > 0 ? ` (${r.brandNames.slice(0, 3).join(', ')})` : '';
        const item = el('div', {
          className: 'dropdown-item',
          role: 'option',
          tabindex: '0',
        },
          el('span', { className: 'dropdown-generic' }, r.genericName),
          el('span', { className: 'dropdown-brand' }, brandStr),
          r.pharmClass ? el('span', { className: 'dropdown-class' }, r.pharmClass) : null,
        );
        item.addEventListener('click', () => selectDrug(r));
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') selectDrug(r);
        });
        dropdown.appendChild(item);
      }
      dropdown.hidden = false;
      dropdownVisible = true;
    } catch {
      hideDropdown();
    }
  }, 300);

  input.addEventListener('input', () => doSearch(input.value.trim()));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDropdown();
    if (e.key === 'ArrowDown' && dropdownVisible) {
      const first = dropdown.querySelector('.dropdown-item');
      if (first) first.focus();
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) hideDropdown();
  });

  renderChips();

  // Expose a way to programmatically add a drug
  return {
    addDrug: (drug) => selectDrug(drug),
    getSelected: () => [...selectedDrugs],
  };
}
