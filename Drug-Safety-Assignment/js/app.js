// app.js — Main application entry point

import { initSearch } from './search.js';
import { renderExploreView } from './explore-view.js';
import { renderSingleView } from './single-view.js';
import { renderCompareView } from './compare-view.js';
import { renderClassView } from './class-view.js';
import { headerHelpButton } from './help-modal.js';

const drugDataCache = {};

document.addEventListener('DOMContentLoaded', () => {
  const searchContainer = document.getElementById('search-bar');
  const mainContent = document.getElementById('main-content');

  // Add "How to Read This Data" button to header
  const headerTopRow = document.querySelector('.header-top-row');
  if (headerTopRow) {
    headerTopRow.appendChild(headerHelpButton());
  }

  let searchAPI;

  function handleExploreClass(pharmClass) {
    renderClassView(mainContent, pharmClass, (drug) => {
      searchAPI.addDrug(drug);
    });
  }

  function handleSelectionChange(selectedDrugs) {
    if (selectedDrugs.length === 0) {
      renderExploreView(mainContent, (drug) => {
        searchAPI.addDrug(drug);
      });
    } else if (selectedDrugs.length === 1) {
      renderSingleView(mainContent, selectedDrugs[0], handleExploreClass);
    } else {
      renderCompareView(mainContent, selectedDrugs, drugDataCache);
    }
  }

  searchAPI = initSearch(searchContainer, handleSelectionChange);

  // Initial load: explore view
  renderExploreView(mainContent, (drug) => {
    searchAPI.addDrug(drug);
  });
});
