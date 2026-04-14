/* ============================================================
   Key UI
   ============================================================ */
function initKeyUI() {
  $("#openKeyBtn").addEventListener("click", () => {
    $("#keyPanel").classList.toggle("hidden");
  });
  $("#setKeyBtn").addEventListener("click", () => {
    KeyVault.set($("#keyInput").value);
    refreshKeyStatus();
  });
  $("#envFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const parsed = await KeyVault.loadFromFile(file);
      if (parsed.openai) {
        KeyVault.set(parsed.openai);
        $("#keyInput").value = parsed.openai;
        toast("Key loaded from file.");
        refreshKeyStatus();
      } else {
        toast("No OPENAI_API_KEY found in file.");
      }
    } catch (err) {
      toast("Could not read that file.");
    }
    e.target.value = "";
  });
  $("#modelSelect").addEventListener("change", (e) => {
    state.model = e.target.value;
  });
}

function refreshKeyStatus() {
  const el = $("#keyStatus");
  if (KeyVault.has()) {
    el.textContent = `✅ Loaded (${KeyVault.mask(KeyVault.get())})`;
    el.classList.add("ok");
  } else {
    el.textContent = "❌ No key loaded";
    el.classList.remove("ok");
  }
  refreshGenerateButton();
}
