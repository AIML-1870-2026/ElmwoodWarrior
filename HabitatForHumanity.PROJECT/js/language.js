// Language state + DOM sync. Mirrors the LanguageContext behavior from spec §6:
// persisted to localStorage, defaults to 'en'.

const LANG_KEY = 'hfh.lang';

function getLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'es' ? 'es' : 'en';
}

function setLang(lang) {
  const next = lang === 'es' ? 'es' : 'en';
  localStorage.setItem(LANG_KEY, next);
  document.documentElement.lang = next;
  applyTranslations(next);
  document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang: next } }));
}

function t(key, lang) {
  const active = lang || getLang();
  const table = TRANSLATIONS[active] || TRANSLATIONS.en;
  return table[key] || TRANSLATIONS.en[key] || key;
}

function applyTranslations(lang) {
  const active = lang || getLang();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key, active);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    // format: "attr:key,attr:key"
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key, active));
    });
  });
}

function initLanguageToggle() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    setLang(getLang() === 'en' ? 'es' : 'en');
  });
}

function initMobileNav() {
  const btn = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  const close = () => {
    links.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  links.addEventListener('click', e => {
    if (e.target.closest('.nav-link')) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}
