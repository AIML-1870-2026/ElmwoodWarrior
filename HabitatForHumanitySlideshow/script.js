(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const currentEl = document.getElementById('current');
  const totalEl = document.getElementById('total');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const fsBtn = document.getElementById('fullscreen');
  const progressEl = document.getElementById('progress');

  let index = 0;

  totalEl.textContent = total;

  function render() {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    currentEl.textContent = index + 1;
    progressEl.style.width = ((index + 1) / total) * 100 + '%';
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    // reset scroll on the active slide
    slides[index].scrollTop = 0;
  }

  function go(n) {
    index = Math.max(0, Math.min(total - 1, n));
    render();
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));
  fsBtn.addEventListener('click', toggleFullscreen);

  function syncFsState() {
    const isFs = !!document.fullscreenElement;
    fsBtn.classList.toggle('is-fs', isFs);
    fsBtn.setAttribute('aria-label', isFs ? 'Exit fullscreen' : 'Enter fullscreen');
    fsBtn.setAttribute('title', isFs ? 'Exit fullscreen (F or Esc)' : 'Fullscreen (F)');
  }
  document.addEventListener('fullscreenchange', syncFsState);

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        go(index + 1);
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        go(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        go(0);
        break;
      case 'End':
        e.preventDefault();
        go(total - 1);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // swipe support for touch devices
  let touchStartX = null;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchStartX = null;
  });

  render();
})();
