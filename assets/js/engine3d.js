/* 3D brand core: glass sphere with the MU mark, AI circuitry flowing into the M,
   a ROAS growth curve rising out of the U. Hand written with three.js r128. */
(() => {
  const canvas = document.getElementById('engine');
  if (!canvas || typeof THREE === 'undefined') return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  window.__engine3d = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = 0xe11b22, CHAR = 0x2a2a2e;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x141416, 0.045);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.4, 11);

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-5, 6, 6); scene.add(key);
  const rim = new THREE.PointLight(RED, 3.2, 14); rim.position.set(4, -2, 3); scene.add(rim);
  const back = new THREE.PointLight(RED, 2.2, 14); back.position.set(-2, 4, -4); scene.add(back);

  const world = new THREE.Group(); scene.add(world);
  const core = new THREE.Group(); world.add(core);

  /* ---------- glass sphere with fresnel crimson rim ---------- */
  const R = 2.25;
  const fresnel = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(RED) }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uTime; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6); float pulse = 0.85 + 0.15 * sin(uTime * 1.4);
        gl_FragColor = vec4(uColor * (f * 1.6 * pulse) + vec3(1.0) * pow(f, 6.0) * 0.35, f * 0.95 + 0.04); }`
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 72, 72), fresnel);
  core.add(sphere);
  // faint glass body
  core.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 48, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.1, metalness: 0, depthWrite: false })));

  // red speckles on the shell, like the logo ring
  const dotGeo = new THREE.BufferGeometry(); const N = 520; const pos = new Float32Array(N * 3); const sizes = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    const r = R * (1.0 + Math.random() * 0.03);
    pos[i * 3] = r * s * Math.cos(t); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(t);
    sizes[i] = Math.random() < 0.08 ? 7 + Math.random() * 6 : 1.5 + Math.random() * 3;
  }
  dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dotGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(RED) }, uScale: { value: 1 } },
    vertexShader: `attribute float size; uniform float uScale; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normalize(position)); vA = 0.25 + 0.75 * pow(1.0 - abs(n.z), 1.5);
        gl_PointSize = size * uScale * (9.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard; gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.2, d)); }`
  });
  const shellDots = new THREE.Points(dotGeo, dotMat); core.add(shellDots);

  /* ---------- MU emblem ---------- */
  const emblem = new THREE.Group(); core.add(emblem);
  const extrude = { depth: 0.32, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 3, curveSegments: 28 };
  // M (left leg, diagonal down to centre, right leg)
  const M = new THREE.Shape();
  M.moveTo(-1.55, -0.85); M.lineTo(-1.55, 0.85); M.lineTo(-1.15, 0.85); M.lineTo(-0.62, 0.05);
  M.lineTo(-0.1, 0.85); M.lineTo(0.3, 0.85); M.lineTo(0.3, -0.85); M.lineTo(-0.08, -0.85);
  M.lineTo(-0.08, 0.2); M.lineTo(-0.62, -0.55); M.lineTo(-1.16, 0.2); M.lineTo(-1.16, -0.85); M.lineTo(-1.55, -0.85);
  const charMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, metalness: 0.55, roughness: 0.4 });
  const mMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(M, extrude), charMat);
  emblem.add(mMesh);
  // pixel cubes at the top left of the M (the AI / data element)
  const cubeMat = new THREE.MeshStandardMaterial({ color: CHAR, metalness: 0.6, roughness: 0.35 });
  const cubeSpots = [[-1.05, 1.2], [-0.72, 1.2], [-0.72, 1.53], [-1.38, 1.2], [-1.05, 0.87]];
  const cubes = cubeSpots.map(([x, y], i) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), cubeMat);
    c.position.set(x, y + 0.05, 0.16); c.userData = { base: y + 0.05, ph: i * 1.3 }; emblem.add(c); return c;
  });
  // U turning into an up arrow
  const U = new THREE.Shape();
  const ux = 0.55, uw = 1.35, th = 0.36, by = -0.85, r0 = uw / 2;
  U.moveTo(ux, 0.85); U.lineTo(ux, by + r0);
  U.absarc(ux + r0, by + r0, r0, Math.PI, Math.PI * 2, false); // outer bottom curve
  U.lineTo(ux + uw, 1.05);                          // right stem up
  U.lineTo(ux + uw + 0.32, 1.05); U.lineTo(ux + uw - th / 2, 1.7); U.lineTo(ux + uw - th - 0.32, 1.05); // arrow head
  U.lineTo(ux + uw - th, 1.05); U.lineTo(ux + uw - th, by + r0);
  U.absarc(ux + r0, by + r0, r0 - th, Math.PI * 2, Math.PI, true); // inner curve back
  U.lineTo(ux + th, 0.85); U.lineTo(ux, 0.85);
  const redMat = new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3 });
  const uMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(U, extrude), redMat);
  emblem.add(uMesh);
  emblem.position.set(-0.22, -0.2, -0.16); emblem.scale.setScalar(0.92);
  const coreLight = new THREE.PointLight(RED, 1.6, 4); coreLight.position.set(0.6, 0, 1.4); core.add(coreLight);

  /* ---------- orbiting energy nodes ---------- */
  const orbits = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.rotation.set(Math.random() * 1.2 - .6, 0, Math.random() * 1.2 - .6); core.add(g);
    for (let k = 0; k < 3; k++) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 12, 12), new THREE.MeshBasicMaterial({ color: k ? RED : 0xffffff }));
      n.userData = { r: R + 0.25 + i * 0.18, a: Math.random() * 6.28, s: 0.25 + Math.random() * 0.35 }; g.add(n);
    }
    orbits.push(g);
  }

  /* ---------- AI circuitry flowing into the M (left, upper) ---------- */
  const traces = new THREE.Group(); world.add(traces);
  const lineMat = new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.38 });
  const paths = [];
  const target = new THREE.Vector3(-1.1, 0.3, 0);
  for (let i = 0; i < 7; i++) {
    const y0 = 2.4 - i * 0.55, x0 = -7.5 - Math.random() * 2;
    const pts = [new THREE.Vector3(x0, y0, -0.6), new THREE.Vector3(-4.6 + Math.random(), y0, -0.4)];
    const midY = y0 * 0.45 + target.y * 0.55;
    pts.push(new THREE.Vector3(pts[1].x + 0.9, midY, -0.2), new THREE.Vector3(-2.6, midY, 0), new THREE.Vector3(target.x - 0.6, target.y + (i - 3) * 0.12, 0));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
    traces.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)), lineMat));
    paths.push(curve);
    // via nodes
    const via = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: RED }));
    via.position.copy(pts[1]); traces.add(via);
  }
  const packets = Array.from({ length: 16 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    m.userData = { p: paths[i % paths.length], t: Math.random(), s: 0.12 + Math.random() * 0.12 }; traces.add(m); return m;
  });

  /* ---------- ROAS growth curve out of the U (right, rising) ---------- */
  const growth = new THREE.Group(); world.add(growth);
  const gPts = [new THREE.Vector3(1.4, -1.2, 0.3), new THREE.Vector3(2.6, -1.55, 0.2), new THREE.Vector3(3.6, -1.1, 0),
    new THREE.Vector3(4.4, 0.0, -0.2), new THREE.Vector3(5.2, 1.4, -0.5), new THREE.Vector3(6.2, 2.9, -0.9)];
  const gCurve = new THREE.CatmullRomCurve3(gPts);
  growth.add(new THREE.Mesh(new THREE.TubeGeometry(gCurve, 120, 0.035, 8, false), new THREE.MeshBasicMaterial({ color: RED })));
  for (let k = 1; k <= 4; k++) {
    const off = gPts.map(p => new THREE.Vector3(p.x, p.y - k * 0.16, p.z - k * 0.05));
    growth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(off).getPoints(100)),
      new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.22 / k })));
  }
  const milestones = [0.28, 0.5, 0.7, 0.9].map((t, i) => {
    const g = new THREE.Group(); g.position.copy(gCurve.getPoint(t));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: RED })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.17, 32), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    g.add(ring); g.userData = { ring, ph: i * 0.8 }; growth.add(g); return g;
  });
  const runners = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    m.userData = { t: i / 5 }; growth.add(m); return m;
  });

  /* ---------- floor grid and red dot matrices ---------- */
  const grid = new THREE.GridHelper(40, 40, 0x3a2024, 0x232326);
  grid.position.y = -3.2; grid.material.transparent = true; grid.material.opacity = 0.55; world.add(grid);
  function matrix(x, y, z, cols, rows) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.55 });
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), m); d.position.set(x + i * 0.22, y - j * 0.22, z); g.add(d);
    }
    world.add(g); return g;
  }
  matrix(3.4, 3.1, -1.5, 6, 4); matrix(4.6, -2.3, -1, 5, 3);

  /* ---------- layout, interaction, loop ---------- */
  let W = 0, H = 0, mobile = false;
  function size() {
    const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; mobile = W < 760;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    dotMat.uniforms.uScale.value = Math.min(devicePixelRatio || 1, 1.75) * (H / 900);
    if (mobile) { world.position.set(-0.15, 2.05, 0); world.scale.setScalar(0.38); }
    else { const wide = W / H; world.position.set(Math.min(3.1, 1.2 + wide * 1.05), 0.15, 0); world.scale.setScalar(1); }
  }
  size(); addEventListener('resize', size);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; });
  let scrollP = 0;
  addEventListener('scroll', () => { scrollP = Math.min(1, scrollY / (H || 1)); }, { passive: true });

  const clock = new THREE.Clock();
  let running = false, intro = 0;
  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    intro = Math.min(1, intro + dt * 0.6);
    const ease = 1 - Math.pow(1 - intro, 3);
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;

    fresnel.uniforms.uTime.value = t;
    core.rotation.y = Math.sin(t * 0.35) * 0.32 + pointer.x * 0.35;
    core.rotation.x = Math.sin(t * 0.27) * 0.08 + pointer.y * 0.18;
    core.position.y = Math.sin(t * 0.8) * 0.08;
    core.scale.setScalar(0.6 + 0.4 * ease);
    shellDots.rotation.y = t * 0.06;
    cubes.forEach(c => { c.position.y = c.userData.base + Math.sin(t * 1.6 + c.userData.ph) * 0.06; c.rotation.x = c.rotation.y = Math.sin(t + c.userData.ph) * 0.25; });
    redMat.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.12;
    orbits.forEach((g, i) => g.children.forEach(n => { const u = n.userData; u.a += dt * u.s; n.position.set(Math.cos(u.a) * u.r, 0, Math.sin(u.a) * u.r); }));
    packets.forEach(m => { const u = m.userData; u.t = (u.t + dt * u.s) % 1; m.position.copy(u.p.getPoint(u.t)); m.material.opacity = 1; });
    runners.forEach(m => { const u = m.userData; u.t = (u.t + dt * 0.11) % 1; m.position.copy(gCurve.getPoint(u.t)); });
    milestones.forEach(g => { const s = 1 + ((t * 0.8 + g.userData.ph) % 1) * 1.6; g.userData.ring.scale.setScalar(s); g.userData.ring.material.opacity = 0.7 * (1 - (s - 1) / 1.6); g.lookAt(camera.position); });
    traces.position.x = -1.5 * (1 - ease); growth.position.x = 1.5 * (1 - ease);
    world.rotation.y = pointer.x * 0.06; world.rotation.x = pointer.y * 0.04;
    camera.position.z = 11 + scrollP * 3; camera.position.y = 0.4 - scrollP * 1.2;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; clock.getDelta(); requestAnimationFrame(frame); }
  if (reduced) { intro = 1; running = true; frame(); running = false; return; }
  new IntersectionObserver(([e]) => { e.isIntersecting ? start() : (running = false); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { document.hidden ? (running = false) : start(); });
})();
