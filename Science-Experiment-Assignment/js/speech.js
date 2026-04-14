/* ============================================================
   Speech Synthesis
   ============================================================ */
function speak(text) {
  if (!("speechSynthesis" in window)) { toast("Your browser can't read aloud."); return; }
  stopReading();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
function readAll(steps) {
  if (!("speechSynthesis" in window)) { toast("Your browser can't read aloud."); return; }
  stopReading();
  const stopBtn = $("#stopReadBtn");
  if (stopBtn) stopBtn.style.display = "inline-block";
  steps.forEach((step, i) => {
    const u = new SpeechSynthesisUtterance(`Step ${i+1}. ${step}`);
    u.rate = 0.95;
    if (i === steps.length - 1) u.onend = () => { if (stopBtn) stopBtn.style.display = "none"; };
    window.speechSynthesis.speak(u);
  });
}
function stopReading() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  const stopBtn = $("#stopReadBtn");
  if (stopBtn) stopBtn.style.display = "none";
}
