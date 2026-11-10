// The page works without any of this. Each block adds one thing and fails quietly.
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  // The page opens dark. The switch in the bar turns the lights on, and the choice is kept on this device.
  // The key is namespaced because the apps live on the same origin and keep their own.
  var KEY = 'portfolio:theme';
  var themeBtn = document.querySelector('[data-theme-switch]');
  var metaScheme = document.querySelector('meta[name="color-scheme"]');
  var metaColor = document.querySelector('meta[name="theme-color"]');
  var setTheme = function (theme) {
    root.setAttribute('data-theme', theme);
    if (metaScheme) metaScheme.content = theme;
    if (metaColor) metaColor.content = getComputedStyle(root).getPropertyValue('--bg').trim() || metaColor.content;
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

  // Sections renamed with their projects: old links land on the new ones.
  var moved = { '#ledger': '#ballast', '#cockpit': '#vesper', '#work': '#interface', '#infra': '#infrastructure' };
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

  // Terminal tabs.
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    var show = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var pane = document.getElementById(t.getAttribute('aria-controls'));
        if (pane) pane.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        show(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-rise]').forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  // Things rise into place once.
  var rise = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      rise.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  document.querySelectorAll('[data-rise]').forEach(function (el) { rise.observe(el); });

  // The Vesper clip plays only while it is on screen.
  // It can always be paused, and it never starts by itself for a reader who asked for less motion.
  document.querySelectorAll('video').forEach(function (v) {
    var btn = v.parentNode.querySelector('[data-vid]');
    // On a phone the window stands half out of view behind the phone capture, so it stays a still.
    var held = calm || matchMedia('(max-width: 640px)').matches;
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var mark = function () {
      if (!btn) return;
      var on = !v.paused;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-label', on ? 'Pause the clip' : 'Play the clip');
      btn.lastElementChild.textContent = on ? 'Pause' : 'Play';
    };
    v.addEventListener('play', mark); v.addEventListener('pause', mark);
    if (btn) btn.addEventListener('click', function () { if (v.paused) { held = false; play(); } else { held = true; v.pause(); } });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!held) play(); }
        else v.pause();
      });
    }, { threshold: 0.35 }).observe(v);
  });

  // The bar says which layer you are in.
  var links = {};
  document.querySelectorAll('[data-spy]').forEach(function (a) { links[a.dataset.spy] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = links[en.target.id];
      if (a) a.classList.toggle('is-on', en.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('[data-layer][id]').forEach(function (s) { spy.observe(s); });

  // The stack: it turns a little toward the pointer, and opens up as the page leaves it.
  var stack = document.getElementById('stack');
  var hero = stack && stack.closest('.hero');
  if (!stack || !hero || calm) return;
  var seen = true, tx = 0, ty = 0, x = 0, y = 0, s = 0, raf = 0;
  new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) kick(); }).observe(hero);
  function frame() {
    raf = 0;
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;
    stack.style.setProperty('--rx', (x * 5).toFixed(3) + 'deg');
    stack.style.setProperty('--ry', (-y * 3.4).toFixed(3) + 'deg');
    stack.style.setProperty('--s', s.toFixed(4));
    if (seen && (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001)) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      kick();
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
  }
  addEventListener('scroll', function () {
    if (!seen) return;
    s = Math.max(0, Math.min(1, scrollY / (hero.offsetHeight * 0.9)));
    kick();
  }, { passive: true });
})();
