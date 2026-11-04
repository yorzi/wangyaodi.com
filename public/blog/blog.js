/* Shared script for /blog/ pages. The theme, reveal, lead-event and year
   blocks mirror the other pages: change them everywhere together. */

/* theme persistence + toggle */
(function(){
  const KEY = 'wyd_theme_v1';
  const order = ['paper','ink','terminal'];

  function dailyTheme(){
    const days = Math.floor(Date.now() / 86400000);
    return order[days % order.length];
  }

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch(e){}
  let theme = stored || dailyTheme();

  function apply(t){
    document.documentElement.setAttribute('data-theme', t);
  }
  apply(theme);

  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', () => {
    theme = order[(order.indexOf(theme) + 1) % order.length];
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch(e){}
  });
})();

/* reveal-on-scroll */
(function(){
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('in'); revIO.unobserve(e.target); }
    });
  }, { rootMargin: '-5% 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revIO.observe(el));
})();

/* reading time: fills <span data-reading-time> from the words in .prose */
(function(){
  const out = document.querySelector('[data-reading-time]');
  const prose = document.querySelector('.prose');
  if (!out || !prose) return;
  const words = (prose.innerText || '').trim().split(/\s+/).filter(Boolean).length;
  out.textContent = Math.max(1, Math.round(words / 230)) + ' min read';
})();

/* analytics: email clicks count as leads (outbound links are GA4 enhanced measurement) */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="mailto:"]');
  if (!a || typeof gtag !== 'function') return;
  // lead_topic is the mailto subject, so leads can be split by page
  let topic = 'general';
  try { topic = new URL(a.href).searchParams.get('subject') || 'general'; } catch (err) {}
  gtag('event', 'generate_lead', { lead_source: 'email', lead_topic: topic.slice(0, 100), link_text: (a.textContent.trim() || a.getAttribute('aria-label') || '').slice(0, 100) });
});

/* year */
(function(){
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = '2005–' + new Date().getFullYear();
})();
