/* ============================================================
   Remix
   ============================================================ */
async function remixCurrent() {
  if (!state.current) return;
  const keepConcept = confirm(
    "Remix this experiment with the same supplies.\n\nOK  = Keep the same concept, change approach\nCancel = Explore a totally different concept"
  );
  const note = keepConcept
    ? "Remix: Keep the same scientific concept, but use a meaningfully different approach or procedure."
    : "Remix: Generate a different experiment exploring a different scientific concept using the same materials.";
  await generateExperiment({ remixNote: note });
}

/* ============================================================
   Worksheet / Print
   ============================================================ */
function buildWorksheetHtml(exp, copyType) {
  const mats = exp.materials.map(m =>
    `<li>${escapeHtml(m.name)} — ${escapeHtml(m.quantity || "")}</li>`).join("");
  const procSteps = exp.procedure.map(p => `<li>${escapeHtml(p)}</li>`).join("");
  const teacher = copyType === "teacher";
  return `
    <div class="ws-section ws-title">
      <h2>${escapeHtml(exp.title)}</h2>
      <div class="ws-header-row">
        <div><small>Student:</small></div>
        <div><small>Date:</small></div>
        <div><small>Grade:</small> ${escapeHtml(exp.grade_tier)}</div>
      </div>
    </div>
    <div class="ws-section">
      <h3>1. Question</h3>
      <p>${escapeHtml(exp.question)}</p>
    </div>
    <div class="ws-section">
      <h3>2. Hypothesis</h3>
      <p><em>${escapeHtml(exp.hypothesis_prompt)}</em></p>
      <div class="ws-lines ws-tall"></div>
    </div>
    <div class="ws-section">
      <h3>3. Materials</h3>
      <ul>${mats}</ul>
    </div>
    <div class="ws-section">
      <h3>4. Procedure</h3>
      <ol class="ws-proc">${procSteps}</ol>
    </div>
    <div class="ws-section">
      <h3>5. Observations</h3>
      <div class="ws-grid">
        <div><small>Notes</small></div>
        <div><small>Sketch</small></div>
      </div>
    </div>
    <div class="ws-section">
      <h3>6. Results / Data</h3>
      <table class="ws-table">
        <tr><th>Trial</th><th>What I did</th><th>What I observed</th></tr>
        <tr><td>1</td><td></td><td></td></tr>
        <tr><td>2</td><td></td><td></td></tr>
        <tr><td>3</td><td></td><td></td></tr>
      </table>
    </div>
    <div class="ws-section">
      <h3>7. Conclusion</h3>
      <div class="ws-lines ws-tall"></div>
    </div>
    ${teacher ? `
    <div class="ws-section">
      <h3>8. Why this works <small>(Teacher/Parent Copy)</small></h3>
      <p>${escapeHtml(exp.why_it_works)}</p>
      <h3>Safety Notes</h3>
      <ul>${exp.safety_notes.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </div>` : ""}
  `;
}

function printWorksheet(copyType) {
  if (!state.current) return;
  const teacher = confirm(
    "Print the Teacher Copy (includes 'Why this works' + safety)?\n\nOK = Teacher Copy\nCancel = Student Copy"
  );
  const which = teacher ? "teacher" : "student";
  const ws = $("#worksheet");
  ws.innerHTML = buildWorksheetHtml(state.current, which);
  window.print();
}
