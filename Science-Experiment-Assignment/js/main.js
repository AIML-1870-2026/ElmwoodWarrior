/* ============================================================
   The Lab Notebook — Science Experiment Generator
   Boot
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initDisclaimer();
  initKeyUI();
  initTiers();
  renderSupplyCategories();
  renderSelectedSupplies();
  initCustomSupply();
  initGenerate();
  initDrawer();
  refreshKeyStatus();
  refreshGenerateButton();
});
