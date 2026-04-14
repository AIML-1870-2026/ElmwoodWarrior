/* ============================================================
   Save / Load / Drawer
   ============================================================ */
const SAVED_KEY = "science_experiments";
const SAVED_CAP = 25;

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); }
  catch { return []; }
}
function writeSaved(list) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

function saveCurrent() {
  if (!state.current) return;
  const list = loadSaved();
  if (list.length >= SAVED_CAP) {
    if (!confirm("Your saved experiments are full. Oldest will be replaced — continue?")) return;
    list.shift();
  }
  const nickname = prompt("Nickname for this experiment?", state.current.title) || state.current.title;
  list.push({
    id: String(Date.now()),
    nickname,
    saved_at: Date.now(),
    exp: state.current
  });
  writeSaved(list);
  toast("Saved to notebook.");
  renderSavedList();
}

function initDrawer() {
  $("#openSavedBtn").addEventListener("click", () => {
    renderSavedList();
    $("#savedDrawer").classList.remove("hidden");
  });
  $("#closeSavedBtn").addEventListener("click", () => $("#savedDrawer").classList.add("hidden"));
  $("#savedSearch").addEventListener("input", renderSavedList);
  $("#savedFilter").addEventListener("change", renderSavedList);
  $("#exportAllBtn").addEventListener("click", exportAll);
}

function renderSavedList() {
  const list = loadSaved();
  const q = $("#savedSearch").value.trim().toLowerCase();
  const filt = $("#savedFilter").value;
  const container = $("#savedList");
  container.innerHTML = "";

  const filtered = list.filter(item => {
    if (q && !(item.nickname || item.exp.title).toLowerCase().includes(q)) return false;
    if (filt && !(item.exp.concept_tags || []).includes(filt)) return false;
    return true;
  }).reverse();

  if (filtered.length === 0) {
    container.innerHTML = `<p class="muted small" style="text-align:center">No entries yet.</p>`;
    return;
  }

  for (const item of filtered) {
    const div = document.createElement("div");
    div.className = "saved-item";
    const date = new Date(item.saved_at).toLocaleDateString();
    div.innerHTML = `
      <h4>${escapeHtml(item.nickname || item.exp.title)}</h4>
      <div class="saved-meta">
        <span class="tier-pill">${escapeHtml(item.exp.grade_tier)}</span>
        ${conceptTagsHtml(item.exp.concept_tags || [])}
        <span>${renderIcons(item.exp.difficulty, "⚗")}</span>
        <span>${escapeHtml(date)}</span>
      </div>
      <div class="saved-actions">
        <button class="btn btn-small" data-act="open">Open</button>
        <button class="btn btn-small" data-act="del">Delete</button>
      </div>
    `;
    div.querySelector('[data-act="open"]').addEventListener("click", () => {
      state.current = item.exp;
      renderExperiment(item.exp);
      $("#savedDrawer").classList.add("hidden");
    });
    div.querySelector('[data-act="del"]').addEventListener("click", () => {
      if (!confirm("Delete this saved experiment?")) return;
      const list2 = loadSaved().filter(x => x.id !== item.id);
      writeSaved(list2);
      renderSavedList();
    });
    container.appendChild(div);
  }
}

function exportAll() {
  const list = loadSaved();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `lab-notebook-experiments-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
