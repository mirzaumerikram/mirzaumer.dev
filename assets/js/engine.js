/* Conversion engine: audience flows through an AI model, buyers rise in red.
   Hand written canvas, no libraries. */
(() => {
  const canvas = document.getElementById('engine');
  if (!canvas) return;
  if (window.__engine3d) {
    // 3D scene owns the canvas; keep the funnel counters ticking
    const st = { imp: 18420, clk: 1386, buy: 112, rev: 9480 };
    const q = id => document.getElementById(id), f = n => Math.round(n).toLocaleString('en-US');
    const tick = () => {
      st.imp += 20 + Math.random() * 40; if (Math.random() < .55) st.clk += 1 + Math.random() * 4;
      if (Math.random() < .35) { st.buy += 1; st.rev += 40 + Math.random() * 120; }
      q('hudImp') && (q('hudImp').textContent = f(st.imp)); q('hudClk') && (q('hudClk').textContent = f(st.clk));
      q('hudBuy') && (q('hudBuy').textContent = f(st.buy)); q('hudRoas') && (q('hudRoas').textContent = (st.rev / (st.imp * 0.11)).toFixed(2) + 'x');
    };
    tick(); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(tick, 700);
    return;
  }
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = '225,27,34';
  let W = 0, H = 0, DPR = 1, mobile = false;
  let layers = [], edges = [], particles = [], pops = [], pixels = [];
  let area, arrow, running = false, last = 0, spawnT = 0;
  const mouse = { x: -9999, y: -9999 };
  const stats = { imp: 18420, clk: 1386, buy: 112, rev: 9480 };
  const el = id => document.getElementById(id);
  const hud = { imp: el('hudImp'), clk: el('hudClk'), buy: el('hudBuy'), roas: el('hudRoas') };

  function layout() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; mobile = W < 760;
    DPR = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    area = mobile
      ? { x0: W * .08, x1: W * .74, y0: H * .12, y1: H * .27 }
      : { x0: W * .5, x1: W * .8, y0: H * .24, y1: H * .74 };
    const counts = mobile ? [4, 6, 6, 4] : [6, 9, 9, 6];
    layers = counts.map((n, li) => {
      const x = area.x0 + (area.x1 - area.x0) * (li / (counts.length - 1));
      return Array.from({ length: n }, (_, i) => ({
        x, y: area.y0 + (area.y1 - area.y0) * ((i + .5) / n) + (li % 2 ? 6 : -6), glow: 0, li
      }));
    });
    edges = [];
    for (let l = 0; l < layers.length - 1; l++)
      layers[l].forEach(a => layers[l + 1].forEach(b => edges.push({ a, b, heat: 0 })));
    // output arrow: rises from the last layer to the top right, like the logo
    const out = layers[layers.length - 1];
    const sx = out[0].x + 14, sy = (area.y0 + area.y1) / 2;
    arrow = mobile
      ? { p0: [sx, sy], p1: [W * .9, sy], p2: [W * .9, H * .16], p3: [W * .9, H * .09] }
      : { p0: [sx, sy], p1: [W * .9, sy + 40], p2: [W * .92, H * .5], p3: [W * .92, H * .25] };
    // pixel field, echoing the pixel squares in the logo
    const s = mobile ? 18 : 22; pixels = [];
    for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s)
      if (Math.random() < .045) pixels.push({ x, y, s: s - 4, a: Math.random() * .06, t: Math.random() * 6, red: Math.random() < .14 });
  }

  const bez = (t, a, b, c, d) => {
    const u = 1 - t;
    return [u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]];
  };

  function spawn() {
    const path = layers.map(L => L[(Math.random() * L.length) | 0]);
    const startY = mobile ? area.y0 + Math.random() * (area.y1 - area.y0) : H * (.15 + Math.random() * .7);
    particles.push({ x: mobile ? -10 : W * (.3 + Math.random() * .08), y: startY, path, seg: -1, t: 0,
      speed: .9 + Math.random() * .7, convert: Math.random() < .32, state: 'in', a: 0, arrowT: 0 });
    stats.imp += 3 + ((Math.random() * 5) | 0);
  }

  function step(dt) {
    spawnT += dt;
    const rate = mobile ? 0.11 : 0.06;
    while (spawnT > rate) { spawnT -= rate; if (particles.length < (mobile ? 70 : 150)) spawn(); }
    for (const e of edges) e.heat *= .955;
    layers.flat().forEach(n => {
      n.glow *= .93;
      const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (d < 140) n.glow = Math.max(n.glow, 1 - d / 140);
    });
    for (const p of particles) {
      p.a = Math.min(1, p.a + dt * 2);
      if (p.state === 'in') {
        const tgt = p.path[0];
        const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy);
        const v = 120 * p.speed * dt;
        if (d < v) { p.x = tgt.x; p.y = tgt.y; p.state = 'net'; p.seg = 0; p.t = 0; tgt.glow = 1; stats.clk += Math.random() < .3 ? 1 : 0; }
        else { p.x += dx / d * v; p.y += dy / d * v + Math.sin((p.x + p.y) * .02) * .3; }
      } else if (p.state === 'net') {
        const a = p.path[p.seg], b = p.path[p.seg + 1];
        p.t += dt * 1.6 * p.speed;
        p.x = a.x + (b.x - a.x) * p.t; p.y = a.y + (b.y - a.y) * p.t;
        const e = edges.find(e => e.a === a && e.b === b); if (e) e.heat = Math.min(1, e.heat + .08);
        if (p.t >= 1) {
          b.glow = 1; p.seg++; p.t = 0;
          if (p.seg >= p.path.length - 1) {
            if (p.convert) { p.state = 'up'; p.arrowT = 0; p.ox = p.x; p.oy = p.y; }
            else { p.state = 'out'; p.vx = 30 + Math.random() * 30; p.vy = (Math.random() - .5) * 40; }
          }
        }
      } else if (p.state === 'up') {
        p.arrowT += dt * .55 * p.speed;
        const [x, y] = bez(Math.min(1, p.arrowT), [p.ox, p.oy], arrow.p1, arrow.p2, arrow.p3);
        p.x = x; p.y = y;
        if (p.arrowT >= 1) {
          p.dead = true; stats.buy++;
          const v = 40 + Math.round(Math.random() * 120); stats.rev += v;
          pops.push({ x: arrow.p3[0] - 40 - Math.random() * 70, y: arrow.p3[1] + 20 + Math.random() * 60, txt: '+$' + v, life: 1 });
        }
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.a -= dt * .9;
        if (p.a <= 0) p.dead = true;
      }
    }
    particles = particles.filter(p => !p.dead);
    pops.forEach(o => { o.life -= dt * .7; o.y -= dt * 22; }); pops = pops.filter(o => o.life > 0);
    pixels.forEach(px => { px.t += dt; });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // pixel field
    for (const px of pixels) {
      const f = (Math.sin(px.t * 1.3) + 1) / 2;
      ctx.fillStyle = px.red ? `rgba(${RED},${.05 + f * .16})` : `rgba(255,255,255,${px.a * (0.4 + f)})`;
      ctx.fillRect(px.x, px.y, px.s, px.s);
    }
    // edges
    ctx.lineWidth = 1;
    for (const e of edges) {
      ctx.strokeStyle = e.heat > .05 ? `rgba(${RED},${.08 + e.heat * .55})` : 'rgba(255,255,255,0.055)';
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    // arrow track
    ctx.strokeStyle = `rgba(${RED},.9)`; ctx.lineWidth = mobile ? 4 : 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...arrow.p0); ctx.bezierCurveTo(...arrow.p1, ...arrow.p2, ...arrow.p3); ctx.stroke();
    const hx = arrow.p3[0], hy = arrow.p3[1], hs = mobile ? 14 : 22;
    ctx.fillStyle = `rgb(${RED})`;
    ctx.beginPath(); ctx.moveTo(hx, hy - hs); ctx.lineTo(hx - hs * .9, hy + hs * .5); ctx.lineTo(hx + hs * .9, hy + hs * .5); ctx.closePath(); ctx.fill();
    // nodes
    for (const n of layers.flat()) {
      const g = n.glow;
      if (g > .05) { ctx.fillStyle = `rgba(${RED},${g * .22})`; ctx.beginPath(); ctx.arc(n.x, n.y, 10 + g * 10, 0, 7); ctx.fill(); }
      ctx.fillStyle = g > .3 ? '#ffffff' : 'rgba(255,255,255,.55)';
      ctx.fillRect(n.x - 3.5, n.y - 3.5, 7, 7);
    }
    // particles
    for (const p of particles) {
      if (p.state === 'up') {
        ctx.fillStyle = `rgba(${RED},1)`; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(${RED},.25)`; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255,255,255,${.65 * Math.max(0, p.a)})`;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
    }
    // purchase pops
    ctx.font = '500 12px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    for (const o of pops) { ctx.fillStyle = `rgba(255,255,255,${o.life})`; ctx.fillText(o.txt, o.x, o.y); }
    // stage labels
    if (!mobile) {
      ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.textAlign = 'center';
      ctx.fillText('AUDIENCE SIGNALS', layers[0][0].x, area.y0 - 28);
      ctx.fillText('AI OPTIMISATION', (area.x0 + area.x1) / 2, area.y0 - 28);
      ctx.fillText('PURCHASES', arrow.p3[0], arrow.p3[1] - 34);
    }
  }

  let hudT = 0;
  function hudUpdate(dt) {
    hudT += dt; if (hudT < .25) return; hudT = 0;
    const f = n => Math.round(n).toLocaleString('en-US');
    hud.imp && (hud.imp.textContent = f(stats.imp));
    hud.clk && (hud.clk.textContent = f(stats.clk));
    hud.buy && (hud.buy.textContent = f(stats.buy));
    hud.roas && (hud.roas.textContent = (stats.rev / (stats.imp * 0.11)).toFixed(2) + 'x');
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    step(dt); draw(); hudUpdate(dt);
    requestAnimationFrame(loop);
  }

  layout();
  if (reduced) { for (let i = 0; i < 400; i++) step(.03); draw(); hudUpdate(1); return; }
  addEventListener('resize', () => { layout(); particles = []; });
  canvas.parentElement.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  for (let i = 0; i < 160; i++) step(.03); // warm start so the scene is already alive
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
    else if (!en.isIntersecting) running = false;
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } });
})();
