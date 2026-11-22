// The page works without any of this. Each block adds one thing and fails quietly.
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  // The page opens dark. The switch in the bar turns the lights on, and the choice is kept on this device.
  var KEY = 'portfolio:theme';
  var themeBtn = document.querySelector('[data-theme-switch]');
  var metaScheme = document.querySelector('meta[name="color-scheme"]');
  var metaColor = document.querySelector('meta[name="theme-color"]');
  var setTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    if (metaScheme) metaScheme.content = theme;
    if (metaColor) metaColor.content = theme === 'light' ? '#f6f7f9' : '#07090c';
    if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  };
  var kept = null;
  try { kept = localStorage.getItem(KEY); } catch (e) {}
  setTheme(kept === 'light' ? 'light' : 'dark');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.classList.add('theme-swap');
    setTheme(next);
    void root.offsetWidth;
    requestAnimationFrame(function () { root.classList.remove('theme-swap'); });
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });

  // Old anchors from the project-by-project page land on the nearest section.
  var moved = { '#interface': '#build', '#intelligence': '#build', '#infrastructure': '#build', '#tools': '#toolkit', '#work': '#build' };
  if (/^#(ballast|ethereal|holdfast|evalbench|seaward|vesper|homelab|ledger|cockpit)$/.test(location.hash)) moved[location.hash] = '#build';
  if (moved[location.hash]) {
    var to = moved[location.hash];
    try { history.replaceState(null, '', to); } catch (e) {}
    var target = document.querySelector(to);
    if (target) target.scrollIntoView();
  }

  // Copy the address. If the clipboard is refused, select it so it can be copied by hand.
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var done = function () {
        b.classList.add('ok'); b.textContent = 'Copied';
        setTimeout(function () { b.classList.remove('ok'); b.textContent = label; }, 1600);
      };
      var pick = function () {
        var a = b.parentNode.querySelector('a');
        if (!a) return;
        var r = document.createRange(); r.selectNodeContents(a);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.dataset.copy).then(done, pick);
      else pick();
    });
  });

  // The stack assembles once, then leans gently toward the pointer.
  var stack = document.getElementById('stack');
  if (stack) {
    if (calm) stack.classList.add('is-in');
    else requestAnimationFrame(function () { setTimeout(function () { stack.classList.add('is-in'); }, 120); });
    var scene = stack.closest('.scene');
    if (!calm && scene && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      scene.addEventListener('pointermove', function (e) {
        var r = scene.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stack.style.setProperty('--tx', (-y * 6).toFixed(2) + 'deg');
        stack.style.setProperty('--ty', (x * 6).toFixed(2) + 'deg');
      });
      scene.addEventListener('pointerleave', function () { stack.style.removeProperty('--tx'); stack.style.removeProperty('--ty'); });
    }
  }

  // Rows rise into place as they arrive.
  var rise = document.querySelectorAll('[data-rise]');
  if (calm || !('IntersectionObserver' in window)) rise.forEach(function (el) { el.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { io.observe(el); });
  }

  // The bar marks the section on screen.
  var links = [].slice.call(document.querySelectorAll('[data-spy]'));
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.dataset.spy === en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.getElementById(a.dataset.spy); if (s) spy.observe(s); });
  }
})();
