// Seasonal checklist widget. Reads the current month and renders the matching
// items from SEASONAL. State is in-memory only per spec §6.

function currentMonthIndex() {
  return new Date().getMonth() + 1;
}

function renderSeasonal() {
  const lang = getLang();
  const month = currentMonthIndex();
  const data = SEASONAL[lang];
  const items = data.months[month] || [];
  const monthName = data.monthNames[month - 1];

  const heading = document.getElementById('seasonal-month');
  if (heading) heading.textContent = monthName;

  const list = document.getElementById('seasonal-list');
  if (!list) return;

  list.innerHTML = '';
  items.forEach((label, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'seasonal-row';
    row.setAttribute('data-index', String(i));
    row.innerHTML = `
      <span class="seasonal-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="5 12 10 17 19 8"/>
        </svg>
      </span>
      <span class="seasonal-label">${escapeHtml(label)}</span>
    `;
    row.addEventListener('click', () => {
      row.classList.toggle('is-checked');
    });
    list.appendChild(row);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
