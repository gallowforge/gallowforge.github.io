// Gentle reveal on scroll. Content is visible without JS, and with reduced motion.
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });
  items.forEach(function (el) { io.observe(el); });
})();

// Sections renamed with their projects: old links (#ledger, #cockpit) land on the new ones.
(function () {
  var moved = { '#ledger': '#ballast', '#cockpit': '#vesper' };
  var to = moved[location.hash];
  if (!to) return;
  history.replaceState(null, '', to);
  var el = document.querySelector(to);
  if (el) el.scrollIntoView();
})();

// Copy the email address; if the clipboard is refused, open the mail app instead.
(function () {
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.classList.add('ok'); b.textContent = 'Copied'; setTimeout(function () { b.classList.remove('ok'); b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.dataset.copy).then(done, function () { location.href = 'mailto:' + b.dataset.copy; });
      else location.href = 'mailto:' + b.dataset.copy;
    });
  });
})();
