/* ============================================================
   Disclaimer gate
   ============================================================ */
function initDisclaimer() {
  const ack = localStorage.getItem("science_disclaimer_ack") === "true";
  state.disclaimerAck = ack;
  if (!ack) $("#disclaimerModal").classList.remove("hidden");
  $("#disclaimerCheck").addEventListener("change", (e) => {
    $("#disclaimerContinue").disabled = !e.target.checked;
  });
  $("#disclaimerContinue").addEventListener("click", () => {
    localStorage.setItem("science_disclaimer_ack", "true");
    state.disclaimerAck = true;
    $("#disclaimerModal").classList.add("hidden");
  });
}
