// app.js — Main application entry point

import { initSearch } from './search.js';
import { renderExploreView } from './explore-view.js';
import { renderSingleView } from './single-view.js';
import { renderCompareView } from './compare-view.js';

const drugDataCache = {};

document.addEventListener('DOMContentLoaded', () => {
  const searchContainer = document.getElementById('search-bar');
  const mainContent = document.getElementById('main-content');

  let searchAPI;

  function handleSelectionChange(selectedDrugs) {
    if (selectedDrugs.length === 0) {
      renderExploreView(mainContent, (drug) => {
        searchAPI.addDrug(drug);
      });
    } else if (selectedDrugs.length === 1) {
      renderSingleView(mainContent, selectedDrugs[0]);
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
