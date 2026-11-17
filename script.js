(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = Array.from(document.querySelectorAll('main > section'));
  const bar = document.querySelector('.progress span');
  const dotsWrap = document.querySelector('.dots');
  const heroImg = document.querySelector('.hero-photo img');

  // ---- side dots (one per section) ----
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
    return b;
  });

  // index of the section whose top edge is closest to the top of the viewport
  function currentIndex() {
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.getBoundingClientRect().top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  // ---- one section per key press ----
  let busy = false;
  let unlockTimer = null;

  function unlock() {
    busy = false;
    clearTimeout(unlockTimer);
  }

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    busy = true;
    slides[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    clearTimeout(unlockTimer);
    // unlock when the scroll ends, with a fallback timer for browsers without 'scrollend'
    unlockTimer = setTimeout(unlock, reduce ? 50 : 1000);
  }
  window.addEventListener('scrollend', unlock);

  const NEXT_KEYS = ['ArrowDown', 'ArrowRight', 'PageDown'];
  const PREV_KEYS = ['ArrowUp', 'ArrowLeft', 'PageUp'];

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    let dir = 0;
    if (NEXT_KEYS.includes(e.key)) dir = 1;
    else if (PREV_KEYS.includes(e.key)) dir = -1;
    else if (e.key === ' ' || e.code === 'Space') dir = e.shiftKey ? -1 : 1;
    if (!dir) return;

    e.preventDefault();      // stop native scrolling so steps stay exactly one section
    if (busy) return;        // ignore key auto-repeat while a step is in flight
    go(currentIndex() + dir);
  });

  // ---- progress, dots, hero parallax ----
  function onScroll() {
    const max = root.scrollHeight - root.clientHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    const cur = currentIndex();
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));

    if (heroImg && !reduce) {
      // very weak parallax: image drifts 5% of scroll distance (inside its 5% overscan)
      const y = Math.min(window.scrollY, window.innerHeight) * 0.05;
      heroImg.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---- fade-in on scroll ----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  }
})();
