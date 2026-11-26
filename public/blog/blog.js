/* Shared script for /blog/ pages. The theme, reveal, lead-event and year
   blocks mirror the other pages: change them everywhere together. */

/* theme persistence + toggle */
(function(){
  const KEY = 'wyd_theme_v1';
  const order = ['paper','ink','terminal'];
  const names = { paper: 'Paper', ink: 'Ink', terminal: 'Terminal' };

  function defaultTheme(){
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper';
  }

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch(e){}
  const current = document.documentElement.getAttribute('data-theme');
  let theme = order.includes(stored) ? stored : (order.includes(current) ? current : defaultTheme());

  const btn = document.getElementById('themeToggle');
  function apply(t){
    document.documentElement.setAttribute('data-theme', t);
    if (btn) {
      const next = order[(order.indexOf(t) + 1) % order.length];
      const msg = `Theme: ${names[t]}. Switch to ${names[next]}`;
      btn.setAttribute('aria-label', msg);
      btn.setAttribute('title', msg);
    }
  }
  apply(theme);

  if (btn) btn.addEventListener('click', () => {
    theme = order[(order.indexOf(theme) + 1) % order.length];
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch(e){}
  });
})();

/* reveal-on-scroll */
(function(){
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const revIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('in'); revIO.unobserve(e.target); }
    });
  }, { rootMargin: '-5% 0px -5% 0px' });
  els.forEach(el => revIO.observe(el));
})();

/* status messages (WCAG 4.1.3): one polite live region per page, so a
   screen reader hears "Copied" or a mode change without moving focus */
const announce = (() => {
  // created at load: a region that appears together with its message is often not read
  const region = document.createElement('p');
  region.className = 'sr-only';
  region.setAttribute('role', 'status');
  document.body.appendChild(region);
  let t = null;
  return (msg) => {
    clearTimeout(t);
    region.textContent = '';
    t = setTimeout(() => { region.textContent = msg; }, 50);
  };
})();

/* reading modes: "full" or "brief" (see READING MODES in blog.css).
   Buttons with data-read-mode switch it; data-read-time="full|brief" show
   each mode's reading time, and <span data-reading-time> the current one.
   The choice is kept per browser; ?read=brief opens the brief. The <head>
   sets data-read before the page draws, so the brief never flashes the full post. */
(function(){
  const KEY = 'wyd_read_mode';
  const prose = document.querySelector('.prose');
  if (!prose) return;
  const root = document.documentElement;

  const BRIEF = 'h2, h3, figure, .facts, .lesson, .brief-only, [data-brief]';
  const words = (els) => els.reduce((n, el) => n + (el.textContent || '').trim().split(/\s+/).filter(Boolean).length, 0);
  const kids = [...prose.children].filter(el => !el.matches('.figure-defs, .mode-note'));
  const fullEls = kids.filter(el => !el.matches('.brief-only'));
  const briefEls = kids.filter(el => el.matches(BRIEF));
  const figures = (els) => els.filter(el => el.matches('figure')).length;
  // 230 words a minute, plus a little time for each figure
  const minutes = (els, perFigure) => Math.max(1, Math.round(words(els.filter(el => !el.matches('figure'))) / 230 + figures(els) * perFigure));
  const times = { full: minutes(fullEls, 0.2), brief: minutes(briefEls, 0.2) };
  document.querySelectorAll('[data-read-time]').forEach(el => { el.textContent = times[el.dataset.readTime] + ' min'; });

  const heads = [...prose.querySelectorAll('h2[id], h3[id]')];
  const reading = () => {
    const passed = heads.filter(h => h.getBoundingClientRect().top < window.innerHeight * 0.35);
    return passed[passed.length - 1] || null;
  };

  function apply(mode, keepPlace){
    const anchor = keepPlace ? reading() : null;
    if (mode === 'brief') root.setAttribute('data-read', 'brief'); else root.removeAttribute('data-read');
    document.querySelectorAll('[data-read-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.readMode === mode)));
    const label = document.querySelector('[data-reading-time]');
    if (label) label.textContent = times[mode] + ' min ' + (mode === 'brief' ? 'brief' : 'read');
    if (anchor) window.scrollTo(0, anchor.getBoundingClientRect().top + window.scrollY - 110);
    window.dispatchEvent(new Event('scroll'));
  }

  let mode = root.getAttribute('data-read') === 'brief' ? 'brief' : 'full';
  apply(mode, false);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-read-mode]');
    if (!btn || btn.dataset.readMode === mode) return;
    mode = btn.dataset.readMode;
    apply(mode, true);
    announce(mode === 'brief' ? 'Brief mode: showing the headings, figures and key points' : 'Full post: showing everything');
    try { localStorage.setItem(KEY, mode); } catch (err) {}
    try {
      const url = new URL(location.href);
      if (mode === 'brief') url.searchParams.set('read', 'brief'); else url.searchParams.delete('read');
      history.replaceState(null, '', url);
    } catch (err) {}
    if (typeof gtag === 'function') gtag('event', 'read_mode', { method: mode, item_id: location.pathname.replace(/^\/blog\//, '') });
  });
})();

/* contents: fills <ol data-toc> from the .prose h2/h3 that have an id,
   marks the section being read, and stays open in the wide layout */
(function(){
  const list = document.querySelector('[data-toc]');
  const prose = document.querySelector('.prose');
  if (!list || !prose) return;
  const heads = [...prose.querySelectorAll('h2[id], h3[id]')];
  const links = new Map();
  heads.forEach(h => {
    const label = h.cloneNode(true);
    label.querySelectorAll('.mono').forEach(n => n.remove());
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = label.textContent.trim();
    if (h.tagName === 'H3') a.className = 'sub';
    li.appendChild(a);
    list.appendChild(li);
    links.set(h, a);
  });

  const details = list.closest('details');
  const wide = window.matchMedia('(min-width: 1120px)');
  const sync = () => { if (details && wide.matches) details.open = true; };
  sync();
  wide.addEventListener('change', sync);
  list.addEventListener('click', (e) => {
    if (e.target.closest('a') && details && !wide.matches) details.open = false;
  });

  // the section being read is the last heading above the top third of the screen
  let current = null, queued = false;
  const update = () => {
    queued = false;
    const passed = heads.filter(h => h.getBoundingClientRect().top < window.innerHeight * 0.35);
    const h = passed[passed.length - 1] || null;
    if (h === current) return;
    if (current) { links.get(current).classList.remove('active'); links.get(current).removeAttribute('aria-current'); }
    current = h;
    if (!h) { list.scrollTop = 0; return; }
    const a = links.get(h);
    a.classList.add('active');
    a.setAttribute('aria-current', 'location');
    // keep the active entry in view when the contents list scrolls on its own
    if (list.scrollHeight > list.clientHeight) {
      const top = a.offsetTop;
      if (top < list.scrollTop || top + a.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = top - list.clientHeight / 3;
      }
    }
  };
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* copy buttons: <button data-copy="#id"> copies that element's text,
   <button data-copy-url="/path"> copies the file at that path */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy], [data-copy-url]');
  if (!btn) return;
  const label = btn.querySelector('[data-label]') || btn;
  const original = label.textContent;
  try {
    let text;
    if (btn.dataset.copyUrl) {
      const res = await fetch(btn.dataset.copyUrl);
      if (!res.ok) throw new Error(res.status);
      text = await res.text();
    } else {
      const source = document.querySelector(btn.dataset.copy);
      text = source ? source.innerText.trim() : '';
    }
    await navigator.clipboard.writeText(text);
    label.textContent = 'Copied';
    btn.setAttribute('data-copied', '');
    announce(btn.dataset.copyUrl ? 'Copied this post as Markdown' : 'Copied the prompt');
  } catch (err) {
    if (btn.dataset.copyUrl) { announce('Copy failed. The Markdown file opens in a new tab.'); window.open(btn.dataset.copyUrl, '_blank', 'noopener'); return; }
    label.textContent = 'Copy failed';
    announce('Copy failed');
  }
  setTimeout(() => { label.textContent = original; btn.removeAttribute('data-copied'); }, 1800);
});

/* keyboard access to boxes that scroll sideways (WCAG 2.1.1): a figure,
   code sample or table wider than its column takes focus, so arrow keys
   scroll it; it gives focus back up once it fits again */
(function(){
  const boxes = [...document.querySelectorAll('.diagram .canvas, .prose pre, .prose table')];
  if (!boxes.length) return;
  const sync = () => boxes.forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    } else if (el.getAttribute('tabindex') === '0') {
      el.removeAttribute('tabindex');
    }
  });
  sync();
  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(sync, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
})();

/* copy-prompt buttons all read "Copy": name them after their prompt
   (the name starts with the visible label, WCAG 2.5.3) */
document.querySelectorAll('.prompts .prompt-head').forEach(head => {
  const name = head.querySelector('.prompt-name');
  const btn = head.querySelector('button[data-copy]');
  if (name && btn) btn.setAttribute('aria-label', 'Copy prompt: ' + name.textContent.trim());
});

/* analytics: shares (X, LinkedIn), the X discussion link and the AI tools */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-share], [data-ai], [data-x]');
  if (!el || typeof gtag !== 'function') return;
  const item = location.pathname.replace(/^\/blog\//, '').replace(/\.html$/, '') || 'blog';
  if (el.dataset.share) gtag('event', 'share', { method: el.dataset.share, content_type: 'blog_post', item_id: item });
  if (el.dataset.ai) gtag('event', 'ai_read', { method: el.dataset.ai, item_id: item });
  if (el.dataset.x) gtag('event', 'x_discuss', { method: el.dataset.x, item_id: item });
});

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
