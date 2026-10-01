/* mirzaumer.dev interactions */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  window.__siteReady = true;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault(); closeMenu(); scrollTo(id);
    history.replaceState(null, '', id);
  }));

  /* ---------- mobile menu ---------- */
  const burger = $('.burger');
  function closeMenu() {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open'); burger && burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  burger && burger.addEventListener('click', () => {
    const open = root.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    open ? lenis && lenis.stop() : lenis && lenis.start();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- nav behaviour ---------- */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (!root.classList.contains('menu-open')) nav.classList.toggle('hide', y > 500 && y > lastY + 4);
    if (y < lastY - 4 || y < 500) nav.classList.remove('hide');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const navMap = new Map();
  $$('.nav-links a[href^="#"]').forEach(a => { const s = $(a.getAttribute('href')); if (s) navMap.set(s, a); });
  if (navMap.size) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      const a = navMap.get(en.target); if (!a) return;
      if (en.isIntersecting) { $$('.nav-links a').forEach(x => x.classList.remove('active')); a.classList.add('active'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    navMap.forEach((_, s) => io.observe(s));
  }

  /* ---------- line splitting ---------- */
  function split(el) {
    const walk = (node, out) => {
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => { if (w.trim()) out.push({ w, cls: null, wrap: null }); else if (w) out.push({ space: true }); });
        else if (n.nodeType === 1 && n.tagName === 'BR') out.push({ br: true });
        else if (n.nodeType === 1) { const sub = []; walk(n, sub); sub.forEach(s => { if (!s.space && !s.br) s.wrap = s.wrap || n.cloneNode(false); }); out.push(...sub); }
      });
    };
    const tokens = []; walk(el, tokens);
    el.innerHTML = '';
    const spans = [];
    tokens.forEach(t => {
      if (t.space) { el.appendChild(document.createTextNode(' ')); return; }
      if (t.br) { const b = document.createElement('br'); el.appendChild(b); return; }
      const s = document.createElement('span'); s.style.display = 'inline-block';
      if (t.wrap) { const w = t.wrap.cloneNode(false); w.textContent = t.w; s.appendChild(w); } else s.textContent = t.w;
      el.appendChild(s); spans.push(s);
    });
    const lines = []; let top = null;
    spans.forEach(s => { const y = s.offsetTop; if (top === null || Math.abs(y - top) > 4) { lines.push([]); top = y; } lines[lines.length - 1].push(s); });
    el.innerHTML = '';
    const inners = [];
    lines.forEach(line => {
      const m = document.createElement('span'); m.className = 'line-mask';
      const inner = document.createElement('span');
      line.forEach((s, i) => { inner.appendChild(s); if (i < line.length - 1) inner.appendChild(document.createTextNode(' ')); });
      m.appendChild(inner); el.appendChild(m); inners.push(inner);
    });
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    return inners;
  }

  /* ---------- counters ---------- */
  function countUp(el, dur = 1.6) {
    const target = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf;
    if (reduced || !hasGsap) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: dur, ease: 'power3.out', onUpdate: () => el.textContent = fmt(o.v) });
  }

  /* ---------- intro + reveals ---------- */
  function intro() {
    if (!hasGsap || reduced) {
      $$('[data-count]').forEach(el => countUp(el));
      $$('.rv').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      drawChart(true);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const heroLines = $$('[data-split]').map(el => ({ el, lines: split(el) }));
    heroLines.forEach(({ el, lines }) => {
      gsap.set(lines, { yPercent: 115 });
      const inHero = el.closest('.hero, .page-hero');
      if (inHero) gsap.to(lines, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: .085, delay: .1 });
      else ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .08 }) });
    });
    ScrollTrigger.batch('.rv', {
      start: 'top 90%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, overwrite: true })
    });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) }));

    // hero panel parallax + float tags
    const panel = $('.panel-wrap');
    if (panel) {
      gsap.from(panel, { y: 60, opacity: 0, rotateX: 8, transformPerspective: 1200, duration: 1.6, ease: 'expo.out', delay: .45, onStart: () => drawChart() });
      gsap.from('.float-tag', { scale: .6, opacity: 0, duration: 1, ease: 'back.out(1.8)', stagger: .2, delay: 1.2 });
      gsap.to('.ft-1', { y: -14, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.ft-2', { y: 12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.hero-glow', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // case visuals parallax
    $$('.case-vis svg').forEach(s => gsap.fromTo(s, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: s.closest('.case'), start: 'top bottom', end: 'bottom top', scrub: true } }));

    // big footer word
    const fw = $('.foot-word');
    if (fw) gsap.from(fw, { yPercent: 40, opacity: .2, ease: 'none', scrollTrigger: { trigger: fw, start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // contact headline scale
    const ch = $('.contact-h');
    if (ch) gsap.from(ch, { scale: .92, transformOrigin: 'left bottom', ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'top 40%', scrub: true } });

    // process horizontal pin on desktop
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('.steps'); if (!track) return;
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 } });
    });

    // review bars
    const bars = $('.bars');
    if (bars) { $$('.bar i', bars).forEach(i => i.style.setProperty('--s', 0)); ScrollTrigger.create({ trigger: bars, start: 'top 85%', once: true, onEnter: () => $$('.bar i', bars).forEach(i => i.style.setProperty('--s', 1)) }); }

    addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------- ads panel ---------- */
  function drawChart(instant) {
    const line = $('#chartLine'), area = $('#chartArea');
    if (!line) return;
    const len = line.getTotalLength();
    if (instant || !hasGsap) { line.style.strokeDasharray = 'none'; area && (area.style.opacity = 1); return; }
    gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', delay: .3 });
    area && gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 1.4, delay: 1.4 });
    gsap.fromTo('#chartDot', { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: .6, delay: 2.4, ease: 'back.out(3)' });
  }
  const live = $$('[data-live]');
  if (live.length && !reduced) {
    setInterval(() => {
      live.forEach(el => {
        const base = parseFloat(el.dataset.live), dec = +(el.dataset.dec || 0), jitter = parseFloat(el.dataset.j || '0.02');
        const v = base * (1 + (Math.random() - .45) * jitter);
        el.dataset.live = v;
        el.textContent = (el.dataset.pre || '') + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (el.dataset.suf || '');
      });
    }, 2600);
  }

  /* ---------- preloader ---------- */
  const loader = $('.loader');
  function runIntro() { intro(); }
  let seen = false;
  try { seen = sessionStorage.getItem('mu_seen') === '1'; sessionStorage.setItem('mu_seen', '1'); } catch (e) {}
  if (loader && hasGsap && !reduced && !seen) {
    const c = $('.loader-count', loader), bar = $('.loader-bar', loader), o = { v: 0 };
    lenis && lenis.stop();
    gsap.timeline()
      .to(o, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { c.textContent = String(Math.round(o.v)).padStart(3, '0'); bar.style.width = o.v + '%'; } })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut', onStart: runIntro, onComplete: () => { loader.classList.add('done'); lenis && lenis.start(); } }, '+=.1');
  } else {
    loader && loader.classList.add('done');
    runIntro();
  }

  /* ---------- cursor + magnetic ---------- */
  if (fine && !reduced) {
    root.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-ring span');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    const loop = () => { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a,button,summary,select,input,textarea');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!link);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    document.addEventListener('mouseleave', () => cur.style.opacity = 0);
    document.addEventListener('mouseenter', () => cur.style.opacity = 1);
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .25}px,${y * .35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 600); });
    });
  }

  /* ---------- services accordion ---------- */
  $$('.svc-row').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.svc-item'), open = !item.classList.contains('open');
    $$('.svc-item.open').forEach(i => { if (i !== item) { i.classList.remove('open'); $('.svc-row', i).setAttribute('aria-expanded', 'false'); } });
    item.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
    setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 650);
  }));

  /* ---------- case drawer ---------- */
  const dlg = $('#caseDrawer');
  if (dlg) {
    const body = $('.drawer-content', dlg);
    const open = card => {
      const tpl = $('.case-detail', card); if (!tpl) return;
      body.innerHTML = tpl.innerHTML;
      dlg.showModal(); lenis && lenis.stop();
      dlg.scrollTop = 0;
    };
    $$('.case').forEach(card => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } });
    });
    const close = () => { dlg.close(); };
    dlg.addEventListener('close', () => lenis && lenis.start());
    $('.drawer-close', dlg).addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a) { close(); } });
  }

  /* ---------- reviews ---------- */
  const revs = $$('.rev');
  if (revs.length) {
    const LIMIT = 10; let expanded = false, filter = 'all';
    const more = $('.rev-more');
    const apply = () => {
      let shown = 0, total = 0;
      revs.forEach(r => {
        const match = filter === 'all' || (r.dataset.tags || '').split(' ').includes(filter);
        if (match) total++;
        const vis = match && (expanded || shown < LIMIT);
        if (vis) shown++;
        r.classList.toggle('hidden', !vis);
      });
      if (more) { more.style.display = total > LIMIT ? '' : 'none'; $('span', more).textContent = expanded ? 'Show fewer reviews' : `Show all ${total} reviews`; }
      window.ScrollTrigger && ScrollTrigger.refresh();
    };
    $$('.rev-filters button').forEach(b => b.addEventListener('click', () => {
      filter = b.dataset.f; $$('.rev-filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); apply();
    }));
    more && more.addEventListener('click', () => { expanded = !expanded; apply(); if (!expanded) scrollTo('#reviews'); });
    apply();
  }

  /* ---------- ticker ---------- */
  $$('.ticker-track').forEach(t => { t.innerHTML += t.innerHTML; t.lastElementChild && [...t.children].slice(t.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true')); });

  /* ---------- clock ---------- */
  const clocks = $$('.clock');
  if (clocks.length) {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tick = () => clocks.forEach(c => c.textContent = f.format(new Date()) + ' PKT');
    tick(); setInterval(tick, 1000);
  }

  /* ---------- contact form (mailto, no backend) ---------- */
  const form = $('#leadForm');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const subject = `Project inquiry: ${d.get('service')} | ${d.get('name')}`;
    const bodyTxt = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\nStore or website: ${d.get('site') || 'n/a'}\nService: ${d.get('service')}\nMonthly ad budget: ${d.get('budget')}\n\n${d.get('msg')}`;
    location.href = `mailto:mirzaumerikram114@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTxt)}`;
    const note = $('.form-note', form); if (note) note.textContent = 'Opening your email app. If nothing happens, email mirzaumerikram114@gmail.com directly.';
  });

  /* year */
  $$('[data-year]').forEach(y => y.textContent = new Date().getFullYear());
})();
