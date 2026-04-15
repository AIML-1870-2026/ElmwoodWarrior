/* ============================================================
   Supplies UI
   ============================================================ */
function renderSupplyCategories() {
  const root = $("#supplyCategories");
  root.innerHTML = "";
  for (const [cat, items] of Object.entries(SUPPLIES)) {
    const det = document.createElement("details");
    det.className = "supply-cat";
    if (cat === "Kitchen") det.open = true;
    const sum = document.createElement("summary");
    sum.textContent = cat;
    det.appendChild(sum);
    const tray = document.createElement("div");
    tray.className = "chip-tray";
    items.forEach(name => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip supply-chip";
      chip.dataset.supply = name;
      chip.innerHTML = `<span>${name}</span>`;
      const help = document.createElement("button");
      help.type = "button";
      help.className = "chip-help";
      help.textContent = "?";
      help.title = SUPPLY_HINTS[name] || `Common household supply.`;
      help.addEventListener("click", (e) => { e.stopPropagation(); toast(help.title); });
      chip.appendChild(help);

      const preview = document.createElement("div");
      preview.className = "chip-preview";
      preview.setAttribute("role", "tooltip");
      preview.innerHTML = `
        ${materialIcon(name)}
        <div class="chip-preview-label">${name}</div>
      `;
      chip.appendChild(preview);

      chip.addEventListener("click", () => toggleSupply(name, chip));
      tray.appendChild(chip);
    });
    det.appendChild(tray);
    root.appendChild(det);
  }
}

function toggleSupply(name, chipEl) {
  if (state.supplies.has(name)) {
    state.supplies.delete(name);
    if (chipEl) chipEl.classList.remove("selected");
  } else {
    state.supplies.add(name);
    if (chipEl) chipEl.classList.add("selected");
  }
  renderSelectedSupplies();
  refreshGenerateButton();
}

function renderSelectedSupplies() {
  const box = $("#selectedSupplies");
  box.innerHTML = "";
  for (const s of state.supplies) {
    const chip = document.createElement("span");
    chip.className = "chip selected";
    chip.innerHTML = `<span>${s}</span>`;
    const rm = document.createElement("button");
    rm.className = "chip-remove";
    rm.textContent = "✕";
    rm.title = "Remove";
    rm.addEventListener("click", () => {
      state.supplies.delete(s);
      // Unhighlight matching predefined chip if present
      const pred = document.querySelector(`.supply-chip[data-supply="${CSS.escape(s)}"]`);
      if (pred) pred.classList.remove("selected");
      renderSelectedSupplies();
      refreshGenerateButton();
    });
    chip.appendChild(rm);
    box.appendChild(chip);
  }
}

function initCustomSupply() {
  const input = $("#customSupplyInput");
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    if (!state.supplies.has(v)) {
      state.supplies.add(v);
      renderSelectedSupplies();
      refreshGenerateButton();
    }
    input.value = "";
  };
  $("#addCustomSupplyBtn").addEventListener("click", add);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
}

/* ============================================================
   Tier selection
   ============================================================ */
function initTiers() {
  $$("#tierRow .tier-stamp").forEach(btn => {
    btn.addEventListener("click", () => {
      $$("#tierRow .tier-stamp").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.tier = btn.dataset.tier;
      refreshGenerateButton();
    });
  });
}
