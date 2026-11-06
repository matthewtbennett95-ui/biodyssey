/* Signal Siege: drawing, input and screens. The rules live in engine.js. */
(function () {
  'use strict';
  const E = window.SiegeEngine, B = window.Biodyssey, W = B.world('signal-siege');
  const $ = id => document.getElementById(id);
  const esc = B.esc, icon = B.icon;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Saved state ================= */
  function cleanBase(b) {
    if (!b || typeof b !== 'object' || !Array.isArray(b.cells)) return null;
    const out = E.starterBase();
    out.level = [1, 2, 3].includes(b.level) ? b.level : 1;
    out.atp = Math.max(0, Math.min(1e6, +b.atp || 0));
    out.at = +b.at || Date.now();
    out.sites = {};
    Object.keys(b.sites || {}).forEach(k => { if (E.SITES.some(s => s.id === k)) out.sites[k] = Math.max(0, Math.min(3, b.sites[k] | 0)); });
    E.UNIT_ORDER.forEach(t => { out.army[t] = Math.max(0, Math.min(200, (b.army || {})[t] | 0)); });
    out.cells = [];
    b.cells.forEach(c => { if (Array.isArray(c) && E.BUILDINGS[c[0]] && E.fits(out, c[0], c[1] | 0, c[2] | 0)) out.cells.push([c[0], c[1] | 0, c[2] | 0]); });
    if (!out.cells.some(c => c[0] === 'node')) return null;
    out.seenHow = !!b.seenHow;
    return out;
  }
  let base = cleanBase(W.store.get('base', null)) || E.starterBase();
  let calc = E.computeBase(base);
  const storageOf = () => calc.storage;
  // ATP made while away (capped at 8 hours and by storage).
  (function offline() {
    const mins = Math.min(480, Math.max(0, (Date.now() - base.at) / 60000));
    const gained = Math.floor(Math.min(storageOf() - base.atp, mins * calc.production));
    if (gained > 0 && mins > 1) { base.atp += gained; setTimeout(() => B.toast(`Your cells made ${gained} ATP while you were away.`, { icon: 'check-circle', kind: 'good' }), 600); }
  })();
  function save() { base.at = Date.now(); W.store.set('base', base); }
  function recompute() { calc = E.computeBase(base); }
  function report() {
    const stars = E.SITES.reduce((s, x) => s + (base.sites[x.id] || 0), 0);
    const all1 = E.SITES.every(x => (base.sites[x.id] || 0) >= 1);
    W.report({ goal: all1, stretch: stars === E.SITES.length * 3, summary: `${stars} of ${E.SITES.length * 3} stars` });
  }
  const totalStars = () => E.SITES.reduce((s, x) => s + (base.sites[x.id] || 0), 0);
  const siteUnlocked = i => i === 0 || (base.sites[E.SITES[i - 1].id] || 0) >= 1;

  /* ================= Colors and art ================= */
  const ART = {
    node: { top: '#c7d2fe', side: '#6366f1', h: 18 }, marrow: { top: '#fecdd3', side: '#e11d48', h: 14 },
    respiring: { top: '#99f6e4', side: '#0d9488', h: 10 }, fibroblast: { top: '#fde68a', side: '#b45309', h: 10 },
    adipocyte: { top: '#fef3c7', side: '#d97706', h: 12 }, capillary: { top: '#fecaca', side: '#dc2626', h: 6 },
    macrophagePost: { top: '#bbf7d0', side: '#16a34a', h: 12 }, dendritic: { top: '#e9d5ff', side: '#9333ea', h: 9 },
    helperT: { top: '#fbcfe8', side: '#db2777', h: 11 }, bcell: { top: '#bfdbfe', side: '#2563eb', h: 11 },
    killerBarracks: { top: '#ddd6fe', side: '#7c3aed', h: 12 }, islet: { top: '#fed7aa', side: '#ea580c', h: 11 },
    treg: { top: '#bae6fd', side: '#0284c7', h: 9 },
    hub: { top: '#d9f99d', side: '#65a30d', h: 20 }, spitter: { top: '#fde047', side: '#a16207', h: 16 },
    burst: { top: '#fdba74', side: '#c2410c', h: 15 }, wall: { top: '#a3e635', side: '#4d7c0f', h: 7 },
    cache: { top: '#fef08a', side: '#ca8a04', h: 9 }, cluster: { top: '#bef264', side: '#4d7c0f', h: 6 },
    capsule: { top: '#e0f2fe', side: '#0e7490', h: 11 }, infected: { top: '#fbcfe8', side: '#be185d', h: 12 }
  };
  const UNIT_ART = { neutrophil: { fill: '#f8fafc', ring: '#64748b', r: 0.2 }, macrophage: { fill: '#86efac', ring: '#15803d', r: 0.32 }, killerT: { fill: '#c4b5fd', ring: '#6d28d9', r: 0.25 } };
  const SIGNAL_COLOR = { GF: '#d97706', ANTIGEN: '#9333ea', HELP: '#db2777', INSULIN: '#ea580c', AI: '#65a30d' };

  /* ================= Iso camera ================= */
  function makeView(canvas, n, onResize) {
    const ctx = canvas.getContext('2d');
    const V = { canvas, ctx, n, tw: 40, th: 20, ox: 0, oy: 0, w: 0, h: 0 };
    V.resize = () => {
      const r = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      if (!r.width) return;
      V.w = r.width; V.h = r.height;
      canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const pad = 18;
      V.tw = Math.min((V.w - pad * 2) / n, ((V.h - pad * 2 - 30) / n) * 2);
      V.th = V.tw / 2;
      V.ox = V.w / 2; V.oy = (V.h - n * V.th) / 2 + 12;
      if (onResize) onResize(V);
    };
    V.iso = (x, y) => ({ x: V.ox + (x - y) * V.tw / 2, y: V.oy + (x + y) * V.th / 2 });
    V.tile = (sx, sy) => {   // screen → tile coordinates (floats)
      const a = (sx - V.ox) / (V.tw / 2), b = (sy - V.oy) / (V.th / 2);
      return { x: (a + b) / 2, y: (b - a) / 2 };
    };
    if (window.ResizeObserver) new ResizeObserver(() => V.resize()).observe(canvas); else addEventListener('resize', V.resize);
    V.resize();
    return V;
  }
  function poly(ctx, pts, fill, stroke) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  }
  function drawGround(V, tint, edge) {
    const { ctx, n } = V;
    const c = [V.iso(0, 0), V.iso(n, 0), V.iso(n, n), V.iso(0, n)];
    // Thickness under the board.
    const d = Math.max(6, V.th * 0.6);
    poly(ctx, [c[3], c[2], { x: c[2].x, y: c[2].y + d }, { x: c[3].x, y: c[3].y + d }], shade(edge, -0.25));
    poly(ctx, [c[2], c[1], { x: c[1].x, y: c[1].y + d }, { x: c[2].x, y: c[2].y + d }], shade(edge, -0.1));
    poly(ctx, c, tint);
    ctx.globalAlpha = 0.07;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) poly(ctx, [V.iso(x, y), V.iso(x + 1, y), V.iso(x + 1, y + 1), V.iso(x, y + 1)], '#000');
    ctx.globalAlpha = 1;
  }
  function tileDiamond(V, x, y, s, fill, stroke, alpha) {
    V.ctx.globalAlpha = alpha == null ? 1 : alpha;
    poly(V.ctx, [V.iso(x, y), V.iso(x + s, y), V.iso(x + s, y + s), V.iso(x, y + s)], fill, stroke);
    V.ctx.globalAlpha = 1;
  }
  // A building or structure: a short block with a rounded "cell" on top.
  function drawBlock(V, x, y, s, art, opt) {
    opt = opt || {};
    const { ctx } = V, k = V.th / 20;
    const h = art.h * k * (opt.squash || 1);
    const inset = 0.08;
    const A = V.iso(x + inset, y + inset), Bp = V.iso(x + s - inset, y + inset), C = V.iso(x + s - inset, y + s - inset), D = V.iso(x + inset, y + s - inset);
    const up = p => ({ x: p.x, y: p.y - h });
    const side = opt.grey ? '#94a3b8' : art.side, top = opt.grey ? '#e2e8f0' : art.top;
    poly(ctx, [D, C, up(C), up(D)], shade(side, -0.15));
    poly(ctx, [C, Bp, up(Bp), up(C)], side);
    poly(ctx, [up(A), up(Bp), up(C), up(D)], top, 'rgba(0,0,0,.12)');
    // The cell body on top.
    const cx = (A.x + C.x) / 2, cy = (A.y + C.y) / 2 - h;
    const rx = V.tw * s * 0.28, ry = rx * 0.55, dome = rx * (opt.dome == null ? 0.55 : opt.dome);
    if (opt.flash) { ctx.fillStyle = 'rgba(255,255,255,.7)'; }
    ctx.beginPath(); ctx.ellipse(cx, cy - dome * 0.35, rx, ry + dome * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = opt.flash ? '#fff' : shade(top, 0.25); ctx.fill();
    ctx.strokeStyle = shade(side, -0.05); ctx.lineWidth = Math.max(1, k * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx - rx * 0.3, cy - dome * 0.55, rx * 0.35, ry * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    return { cx, cy: cy - dome * 0.35, rx, ry, top: cy - dome };
  }

  /* ================= Base screen ================= */
  const baseV = makeView($('baseCv'), E.BASE_SIZE);
  let sel = -1, placing = null, hover = null;

  function drawBase(t) {
    const V = baseV, ctx = V.ctx;
    if (!V.w || $('home').hidden) return;
    ctx.clearRect(0, 0, V.w, V.h);
    drawGround(V, '#fde4e1', '#f4a9a0');
    // Signal reach of the selected or placing building.
    const focus = placing ? { type: placing.type, x: placing.x, y: placing.y } : sel >= 0 ? { type: base.cells[sel][0], x: base.cells[sel][1], y: base.cells[sel][2] } : null;
    if (focus) {
      const D = E.BUILDINGS[focus.type];
      if (D.emits && D.mode === 'paracrine') { const r = D.range; for (let y = focus.y - r; y < focus.y + D.size + r; y++) for (let x = focus.x - r; x < focus.x + D.size + r; x++) if (x >= 0 && y >= 0 && x < V.n && y < V.n) tileDiamond(V, x, y, 1, SIGNAL_COLOR[D.emits], null, 0.16); }
      if (D.emits && D.mode === 'juxtacrine') for (let y = focus.y - 1; y < focus.y + D.size + 1; y++) for (let x = focus.x - 1; x < focus.x + D.size + 1; x++) if (x >= 0 && y >= 0 && x < V.n && y < V.n) tileDiamond(V, x, y, 1, SIGNAL_COLOR[D.emits], null, 0.14);
    }
    const order = base.cells.map((c, i) => i).sort((a, b) => (base.cells[a][1] + base.cells[a][2] + E.BUILDINGS[base.cells[a][0]].size) - (base.cells[b][1] + base.cells[b][2] + E.BUILDINGS[base.cells[b][0]].size));
    const tops = [];
    order.forEach(i => {
      if (placing && placing.moveIdx === i) return;
      const c = base.cells[i], D = E.BUILDINGS[c[0]];
      if (i === sel) tileDiamond(V, c[1], c[2], D.size, 'rgba(79,70,229,.25)', '#4f46e5');
      const r = drawBlock(V, c[1], c[2], D.size, ART[c[0]], { grey: !calc.on[i] });
      tops[i] = r;
    });
    // Signal links: animated dots from each sender to the cells it switches on.
    {
      base.cells.forEach((c, i) => {
        const g = calc.gets[i]; if (!g || !calc.on[i]) return;
        const need = E.BUILDINGS[c[0]].needs; if (!need || !g[need]) return;
        g[need].forEach(s => {
          if (E.BUILDINGS[base.cells[s][0]].mode === 'endocrine' && sel !== s) return;
          const a = tops[s], b = tops[i]; if (!a || !b) return;
          ctx.strokeStyle = SIGNAL_COLOR[need]; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(a.cx, a.top); ctx.quadraticCurveTo((a.cx + b.cx) / 2, Math.min(a.top, b.top) - 18, b.cx, b.top); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          const f = reduceMotion ? 0.5 : (t / 1400 + s * 0.17) % 1, qx = (a.cx + b.cx) / 2, qy = Math.min(a.top, b.top) - 18;
          const px = (1 - f) * (1 - f) * a.cx + 2 * (1 - f) * f * qx + f * f * b.cx, py = (1 - f) * (1 - f) * a.top + 2 * (1 - f) * f * qy + f * f * b.top;
          ctx.fillStyle = SIGNAL_COLOR[need]; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
        });
      });
    }
    // Inactive badges.
    base.cells.forEach((c, i) => {
      if (calc.on[i] || !tops[i]) return;
      const r = tops[i];
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(r.cx, r.top - 10, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', r.cx, r.top - 9.5);
    });
    if (placing) {
      const ok = E.fits(base, placing.type, placing.x, placing.y, placing.moveIdx);
      const D = E.BUILDINGS[placing.type];
      tileDiamond(V, placing.x, placing.y, D.size, ok ? 'rgba(5,150,105,.3)' : 'rgba(225,29,72,.3)', ok ? '#059669' : '#e11d48');
      V.ctx.globalAlpha = 0.85; drawBlock(V, placing.x, placing.y, D.size, ART[placing.type]); V.ctx.globalAlpha = 1;
    }
  }

  function baseTileAt(ev) {
    const r = baseV.canvas.getBoundingClientRect();
    return baseV.tile(ev.clientX - r.left, ev.clientY - r.top);
  }
  function cellAt(tx, ty) {
    for (let i = base.cells.length - 1; i >= 0; i--) { const c = base.cells[i], s = E.BUILDINGS[c[0]].size; if (tx >= c[1] && ty >= c[2] && tx < c[1] + s && ty < c[2] + s) return i; }
    return -1;
  }
  let dragging = false;
  $('baseCv').addEventListener('pointerdown', ev => {
    const p = baseTileAt(ev);
    if (placing) { const s = E.BUILDINGS[placing.type].size; placing.x = Math.max(0, Math.min(E.BASE_SIZE - s, Math.floor(p.x - s / 2 + 0.5))); placing.y = Math.max(0, Math.min(E.BASE_SIZE - s, Math.floor(p.y - s / 2 + 0.5))); dragging = true; renderPlaceBar(); return; }
    const i = cellAt(p.x, p.y);
    sel = i === sel ? -1 : i;
    renderInfo();
  });
  $('baseCv').addEventListener('pointermove', ev => {
    if (!placing || !dragging) return;
    const p = baseTileAt(ev), s = E.BUILDINGS[placing.type].size;
    placing.x = Math.max(0, Math.min(E.BASE_SIZE - s, Math.floor(p.x - s / 2 + 0.5))); placing.y = Math.max(0, Math.min(E.BASE_SIZE - s, Math.floor(p.y - s / 2 + 0.5)));
    renderPlaceBar();
  });
  addEventListener('pointerup', () => { dragging = false; });

  function limitOf(type) { return (E.LIMITS[base.level] || {})[type] || 0; }
  function countOf(type) { return base.cells.filter(c => c[0] === type).length; }
  // Suggest a spot where the new cell will actually receive the signal it needs (closest to the middle).
  function firstFreeSpot(type) {
    const s = E.BUILDINGS[type].size, mid = (E.BASE_SIZE - s) / 2;
    let best = null, bestScore = 1e9;
    for (let y = 0; y <= E.BASE_SIZE - s; y++) for (let x = 0; x <= E.BASE_SIZE - s; x++) {
      if (!E.fits(base, type, x, y)) continue;
      let score = Math.hypot(x - mid, y - mid);
      if (E.BUILDINGS[type].needs) {
        const trial = { cells: base.cells.concat([[type, x, y]]) };
        if (!E.computeBase(trial).on[trial.cells.length - 1]) score += 100;
      }
      if (score < bestScore) { bestScore = score; best = { x, y }; }
    }
    return best;
  }
  function startPlacing(type, moveIdx) {
    let spot;
    if (moveIdx != null) spot = { x: base.cells[moveIdx][1], y: base.cells[moveIdx][2] };
    else { spot = firstFreeSpot(type); if (!spot) { B.toast('No room left. Move or remove a cell first.', { kind: 'warn', icon: 'alert' }); return; } }
    placing = { type, x: spot.x, y: spot.y, moveIdx };
    sel = -1; closeDialogs(); renderInfo(); renderPlaceBar();
  }
  function renderPlaceBar() {
    const bar = $('placeBar');
    if (!placing) { bar.hidden = true; $('dock').hidden = false; return; }
    const D = E.BUILDINGS[placing.type], ok = E.fits(base, placing.type, placing.x, placing.y, placing.moveIdx);
    bar.hidden = false; $('dock').hidden = true;
    $('placeText').innerHTML = `<b>${esc(D.name)}</b><span>${ok ? 'Tap or drag on the board to choose a spot.' : 'That spot overlaps another cell.'}</span>`;
    $('placeOk').disabled = !ok;
  }
  $('placeOk').onclick = () => {
    if (!placing || !E.fits(base, placing.type, placing.x, placing.y, placing.moveIdx)) return;
    if (placing.moveIdx != null) { base.cells[placing.moveIdx][1] = placing.x; base.cells[placing.moveIdx][2] = placing.y; sel = placing.moveIdx; }
    else {
      const cost = E.BUILDINGS[placing.type].cost;
      if (base.atp < cost) { B.toast('Not enough ATP.', { kind: 'warn', icon: 'alert' }); return; }
      base.atp -= cost; base.cells.push([placing.type, placing.x, placing.y]); sel = base.cells.length - 1;
    }
    placing = null; recompute(); save(); renderAll();
    const i = sel;
    if (i >= 0 && !calc.on[i]) B.toast(`${E.BUILDINGS[base.cells[i][0]].name} placed, but it isn't working yet. ${calc.why[i]}`, { kind: 'warn', icon: 'alert', ms: 6000 });
  };
  $('placeCancel').onclick = () => { placing = null; renderAll(); };

  function renderInfo() {
    const box = $('info');
    if (sel < 0 || placing) { box.hidden = true; return; }
    const c = base.cells[sel], D = E.BUILDINGS[c[0]], on = calc.on[sel];
    let status = '';
    if (D.needs) status = on ? `<span class="bd-chip good">${icon('check')}Receiving ${esc(E.SIGNALS[D.needs].name.toLowerCase())}</span>` : `<span class="bd-chip bad">${icon('alert')}Not working</span>`;
    else status = '<span class="bd-chip">Always on</span>';
    let extra = '';
    if (!on && calc.why[sel]) extra = `<p class="ss-why">${esc(calc.why[sel])}</p>`;
    if (D.produces && on) extra += `<p class="bd-small">Making ${Math.round(D.produces * (calc.insulin ? 1.5 : 1))} ATP per minute${calc.insulin ? ' (insulin boost)' : ''}.</p>`;
    const actions = [];
    if (c[0] === 'node') {
      const next = base.level + 1, cost = E.NODE_UPGRADE[next];
      if (cost) actions.push(`<button class="bd-btn" type="button" id="upgradeBtn" ${base.atp < cost ? 'disabled' : ''}>Upgrade to level ${next} · ${cost} ATP</button>`);
      extra += `<p class="bd-small">Level ${base.level}. ${cost ? `Level ${next} unlocks more cells${next === 2 ? ', including killer T cells, insulin and IL-10' : ''}. Your immune cells get stronger at every level.` : 'Fully upgraded.'}</p>`;
      if (cost && cost > storageOf()) extra += `<p class="ss-why">You can only store ${storageOf()} ATP. Build an adipocyte to hold more.</p>`;
    } else {
      actions.push(`<button class="bd-btn secondary" type="button" id="moveBtn">Move</button>`);
      if (c[0] !== 'marrow') actions.push(`<button class="bd-btn ghost" type="button" id="sellBtn">Remove (+${Math.floor(D.cost / 2)} ATP)</button>`);
    }
    box.innerHTML = `<div class="ss-info-head"><b>${esc(D.name)}</b>${status}<button class="bd-close" type="button" id="infoClose" aria-label="Close">${icon('x')}</button></div>
      <p>${esc(D.about)}</p>${extra}${actions.length ? `<div class="bd-actions">${actions.join('')}</div>` : ''}`;
    box.hidden = false;
    $('infoClose').onclick = () => { sel = -1; renderInfo(); };
    if ($('moveBtn')) $('moveBtn').onclick = () => startPlacing(c[0], sel);
    if ($('sellBtn')) $('sellBtn').onclick = () => { base.atp = Math.min(storageOf() + 1e6, base.atp + Math.floor(D.cost / 2)); base.cells.splice(sel, 1); sel = -1; recompute(); save(); renderAll(); };
    if ($('upgradeBtn')) $('upgradeBtn').onclick = () => {
      const cost = E.NODE_UPGRADE[base.level + 1];
      if (base.atp < cost) return;
      base.atp -= cost; base.level++; recompute(); save(); renderAll();
      B.toast(`Lymph node level ${base.level}! New cells unlocked, and your immune cells are stronger.`, { icon: 'star', kind: 'good' });
    };
  }

  /* ---------- HUD and dock ---------- */
  function renderHud() {
    $('hAtp').textContent = Math.floor(base.atp);
    $('hCap').textContent = storageOf();
    $('hRate').textContent = '+' + Math.round(calc.production) + '/min';
    $('hArmy').textContent = E.housingUsed(base.army) + '/' + calc.capacity;
    $('hStars').textContent = totalStars() + '/' + E.SITES.length * 3;
    $('atpFill').style.width = Math.min(100, base.atp / storageOf() * 100) + '%';
  }
  function renderAll() { recompute(); renderHud(); renderInfo(); renderPlaceBar(); }

  /* ---------- Build sheet ---------- */
  function openBuild() {
    const order = ['respiring', 'fibroblast', 'adipocyte', 'islet', 'capillary', 'macrophagePost', 'dendritic', 'helperT', 'bcell', 'killerBarracks', 'treg'];
    const groups = [['Energy', ['respiring', 'fibroblast', 'adipocyte', 'islet']], ['Army', ['capillary', 'killerBarracks']], ['Signals for raids', ['macrophagePost', 'dendritic', 'helperT', 'bcell', 'treg']]];
    let html = '';
    groups.forEach(([title, list]) => {
      html += `<div class="bd-label">${title}</div><div class="ss-cards">`;
      list.forEach(t => {
        const D = E.BUILDINGS[t], lim = limitOf(t), have = countOf(t), locked = lim === 0, full = have >= lim, poor = base.atp < D.cost;
        const needs = D.needs ? `Needs ${E.SIGNALS[D.needs].name.toLowerCase()}` : D.emits ? `Sends ${E.SIGNALS[D.emits].name.toLowerCase()} (${D.mode})` : D.il10 ? 'Sends IL-10' : D.spell ? `+1 ${E.SPELLS[D.spell].name} per raid` : '';
        html += `<button class="ss-card" type="button" data-build="${t}" id="build-${t}" ${locked || full || poor ? 'disabled' : ''}>
          <span class="ss-swatch" style="background:${ART[t].top};border-color:${ART[t].side}"></span>
          <span class="ss-card-body"><b>${esc(D.name)}</b><small>${esc(needs)}</small>
          <span class="ss-card-meta">${locked ? `${icon('lock', 'sm')}Lymph node level ${t === 'treg' || t === 'islet' || t === 'killerBarracks' ? 2 : 3}` : `<span class="mono">${D.cost} ATP</span><span>${have}/${lim}</span>`}</span></span></button>`;
      });
      html += '</div>';
    });
    openSheet('Build', 'Cells only work when they receive the signal they need.', html);
    document.querySelectorAll('[data-build]').forEach(b => b.onclick = () => startPlacing(b.dataset.build));
  }

  /* ---------- Army sheet ---------- */
  function openArmy() {
    const render = () => {
      const used = E.housingUsed(base.army);
      let html = `<div class="ss-cap"><div class="ss-cap-bar"><i style="width:${calc.capacity ? used / calc.capacity * 100 : 0}%"></i></div><span><b>${used}/${calc.capacity}</b> army space</span></div>`;
      E.UNIT_ORDER.forEach(t => {
        const U = E.UNITS[t], locked = t === 'killerT' && !calc.killerT;
        const canAdd = !locked && base.atp >= U.cost && used + U.housing <= calc.capacity;
        html += `<div class="ss-unit${locked ? ' locked' : ''}"><span class="ss-unit-art" data-u="${t}" aria-hidden="true"></span>
          <div class="ss-unit-body"><b>${esc(U.name)}</b><small>${esc(locked ? 'Locked: build a killer T barracks touching an active helper T cell.' : U.about)}</small>
          <span class="ss-card-meta"><span class="mono">${U.cost} ATP</span><span>Space ${U.housing}</span></span></div>
          <div class="ss-step"><button class="bd-btn secondary" type="button" data-sub="${t}" id="sub-${t}" aria-label="Remove one ${esc(U.name)}" ${base.army[t] ? '' : 'disabled'}>−</button>
          <span class="mono" aria-live="polite">${base.army[t]}</span>
          <button class="bd-btn secondary" type="button" data-add="${t}" id="add-${t}" aria-label="Train one ${esc(U.name)}" ${canAdd ? '' : 'disabled'}>+</button></div></div>`;
      });
      const sp = calc.spells;
      html += `<div class="bd-label" style="margin-top:8px">Signals for each raid</div><div class="ss-spells">
        <span class="bd-chip ${sp.chemokine ? 'good' : ''}">Chemokine × ${sp.chemokine}</span><span class="bd-chip ${sp.antibody ? 'good' : ''}">Antibodies × ${sp.antibody}</span>
        <span class="bd-chip ${calc.il10 ? 'good' : ''}">IL-10 × ${calc.il10}</span></div>
        <p class="bd-help">Signals come from working cells in your lymph node: macrophage posts (chemokine), B cells (antibodies) and regulatory T cells (IL-10).</p>`;
      $('sheetBody').innerHTML = html;
      $('sheetBody').querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const t = b.dataset.add, U = E.UNITS[t]; if (base.atp >= U.cost && E.housingUsed(base.army) + U.housing <= calc.capacity) { base.atp -= U.cost; base.army[t]++; save(); renderHud(); render(); } });
      $('sheetBody').querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { const t = b.dataset.sub; if (base.army[t] > 0) { base.army[t]--; base.atp += E.UNITS[t].cost; save(); renderHud(); render(); } });
    };
    openSheet('Army', 'Train immune cells for your next raid. Refunds are full until you raid.', '');
    render();
  }

  /* ---------- Dialog plumbing ---------- */
  function openSheet(title, sub, html) {
    $('sheetTitle').textContent = title; $('sheetSub').textContent = sub; $('sheetBody').innerHTML = html;
    const d = $('sheet'); if (!d.open) d.showModal();
  }
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
  document.querySelectorAll('[data-close-dialog]').forEach(b => b.onclick = () => b.closest('dialog').close());
  document.querySelectorAll('dialog.ss-dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  /* ---------- Raid select and scout ---------- */
  function openSites() {
    let html = '<div class="ss-sites">';
    E.SITES.forEach((s, i) => {
      const st = base.sites[s.id] || 0, open = siteUnlocked(i);
      html += `<button class="ss-site" type="button" data-site="${i}" id="site-${s.id}" ${open ? '' : 'disabled'}>
        <span class="ss-site-n">${i + 1}</span><span class="ss-site-body"><b>${esc(s.name)}</b><small>${esc(s.place)}</small></span>
        ${open ? `<span class="ss-stars" aria-label="${st} of 3 stars">${[0, 1, 2].map(k => `<i class="${k < st ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>` : `<span class="ss-lock">${icon('lock')}</span>`}</button>`;
    });
    html += '</div>';
    $('raidTitle').textContent = 'Choose an infection';
    $('raidBody').innerHTML = html;
    $('raidBack').hidden = true;
    $('raidBody').querySelectorAll('[data-site]').forEach(b => b.onclick = () => openScout(+b.dataset.site));
    if (!$('raidDlg').open) $('raidDlg').showModal();
  }
  function openScout(i) {
    const s = E.SITES[i], parsed = E.parseSite(s), counts = {};
    parsed.forEach(p => { counts[p[0]] = (counts[p[0]] || 0) + 1; });
    const kinds = ['hub', 'spitter', 'burst', 'capsule', 'infected', 'wall', 'cache', 'cluster'].filter(k => counts[k]);
    const used = E.housingUsed(base.army);
    const firstStarsLeft = 3 - (base.sites[s.id] || 0);
    $('raidTitle').textContent = s.name;
    $('raidBack').hidden = false;
    $('raidBody').innerHTML = `
      <canvas id="scoutCv" class="ss-scout" aria-label="Map of ${esc(s.name)}"></canvas>
      <div class="bd-callout">${icon('info')}<div class="grow">${esc(s.tip)}</div></div>
      <details class="bd-more"><summary>${icon('info')}What's here${icon('chevron-right')}</summary><div class="bd-more-body ss-legend">
        ${kinds.map(k => `<div><span class="ss-swatch" style="background:${ART[k].top};border-color:${ART[k].side}"></span><span><b>${esc(E.STRUCTS[k].name)} × ${counts[k]}</b><small>${esc(E.STRUCTS[k].about)}</small></span></div>`).join('')}
      </div></details>
      <div class="ss-scout-foot"><span class="bd-small">Army ${used}/${calc.capacity}${firstStarsLeft ? ` · up to ${firstStarsLeft * E.starBonus(i)} bonus ATP for new stars` : ''}</span>
        ${used ? `<button class="bd-btn lg" type="button" id="startRaid">${icon('play')}Start raid</button>` : `<button class="bd-btn lg" type="button" id="toArmy">Train an army first</button>`}</div>`;
    const cv = $('scoutCv'), preview = E.createRaid(i, {}); requestAnimationFrame(() => makeView(cv, E.N, V => drawRaidScene(V, preview, 0, true)));
    if ($('startRaid')) $('startRaid').onclick = () => { $('raidDlg').close(); startRaid(i); };
    if ($('toArmy')) $('toArmy').onclick = () => { $('raidDlg').close(); openArmy(); };
  }
  $('raidBack').onclick = openSites;

  /* ================= Battle ================= */
  const battleV = makeView($('battleCv'), E.N);
  let R = null, pick = 'neutrophil', fx = [], banners = [], lastT = 0, shake = 0, raidSite = 0, holding = null;

  function startRaid(i) {
    raidSite = i;
    R = E.createRaid(i, { level: base.level, army: Object.assign({}, base.army), spells: calc.spells, il10: calc.il10 });
    base.army = { neutrophil: 0, macrophage: 0, killerT: 0 };   // the army leaves for the raid
    save();
    fx = []; banners = []; shake = 0;
    pick = E.UNIT_ORDER.find(t => R.army[t] > 0) || 'neutrophil';
    $('home').hidden = true; $('battle').hidden = false;
    $('bSite').textContent = E.SITES[i].name;
    battleV.resize(); renderDeploy(); renderBattleHud();
    banner('Tap the board to send in your cells. You can\'t land right next to bacteria.', 4);
    window.scrollTo({ top: 0 });
  }
  function renderDeploy() {
    if (!R) return;
    const units = E.UNIT_ORDER.filter(t => R.army[t] > 0 || R.units.some(u => u.type === t)).map(t => `<button class="ss-dep${pick === t ? ' on' : ''}" type="button" data-pick="${t}" id="dep-${t}" ${R.army[t] ? '' : 'disabled'}>
      <span class="ss-unit-art" data-u="${t}" aria-hidden="true"></span><b>${esc(E.UNITS[t].short)}</b><span class="ss-count">${R.army[t]}</span></button>`);
    const spells = Object.keys(E.SPELLS).filter(k => R.spells[k] > 0 || R.zones.some(z => z.spell === k)).map(k => `<button class="ss-dep spell${pick === k ? ' on' : ''}" type="button" data-pick="${k}" id="dep-${k}" ${R.spells[k] ? '' : 'disabled'}>
      <span class="ss-spell-art" data-s="${k}" aria-hidden="true"></span><b>${esc(E.SPELLS[k].name)}</b><span class="ss-count">${R.spells[k]}</span></button>`);
    $('deploy').innerHTML = units.join('') + (spells.length ? '<span class="ss-dep-sep" aria-hidden="true"></span>' + spells.join('') : '');
    $('deploy').querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { pick = b.dataset.pick; renderDeploy(); });
    const cur = E.UNITS[pick] ? E.UNITS[pick].about : E.SPELLS[pick] ? E.SPELLS[pick].about : '';
    $('pickHint').textContent = cur;
  }
  function renderBattleHud() {
    if (!R) return;
    const r = E.result(R), m = Math.floor(R.left / 60), s = Math.floor(R.left % 60);
    $('bTime').textContent = m + ':' + String(s).padStart(2, '0');
    $('bPct').textContent = r.pct + '%';
    $('bStars').innerHTML = [0, 1, 2].map(k => `<i class="${k < r.stars ? 'on' : ''}">${icon('star')}</i>`).join('');
    $('bLoot').textContent = r.loot;
    const pct = Math.min(100, R.infl / R.stormAt * 100);
    $('inflFill').style.width = pct + '%';
    $('inflBar').classList.toggle('storm', R.storm);
    $('inflBar').classList.toggle('hot', pct > 70 && !R.storm);
    $('inflLabel').textContent = R.storm ? 'Cytokine storm! Your own cells are being damaged' : 'Inflammation';
  }
  function banner(text, secs) { banners = [{ text, t: secs || 3 }]; $('bBanner').textContent = text; $('bBanner').hidden = false; }

  function battleTile(ev) { const r = battleV.canvas.getBoundingClientRect(); return battleV.tile(ev.clientX - r.left, ev.clientY - r.top); }
  function act(p) {
    if (!R || R.over) return false;
    if (E.SPELLS[pick]) {
      if (p.x < -1 || p.y < -1 || p.x > E.N + 1 || p.y > E.N + 1) return false;
      if (E.cast(R, pick, p.x, p.y)) { renderDeploy(); if (!R.spells[pick]) pick = E.UNIT_ORDER.find(t => R.army[t] > 0) || pick; renderDeploy(); return true; }
      return false;
    }
    if (!(R.army[pick] > 0)) { const next = E.UNIT_ORDER.find(t => R.army[t] > 0); if (next) { pick = next; renderDeploy(); } else return false; }
    if (E.deploy(R, pick, p.x, p.y)) { renderDeploy(); return true; }
    fx.push({ k: 'nope', x: p.x, y: p.y, t: 0.6 });
    return false;
  }
  $('battleCv').addEventListener('pointerdown', ev => {
    ev.preventDefault();
    const p = battleTile(ev);
    act(p);
    if (E.UNITS[pick]) holding = { p, timer: setInterval(() => { if (holding) act({ x: holding.p.x + (Math.random() - 0.5) * 0.4, y: holding.p.y + (Math.random() - 0.5) * 0.4 }); }, 140) };
  });
  $('battleCv').addEventListener('pointermove', ev => { if (holding) holding.p = battleTile(ev); });
  const stopHold = () => { if (holding) { clearInterval(holding.timer); holding = null; } };
  addEventListener('pointerup', stopHold); addEventListener('pointercancel', stopHold);
  $('bEnd').onclick = () => { if (R && !R.over) E.end(R, 'quit'); };

  function handleEvents() {
    for (const e of R.events) {
      if (e.k === 'down') {
        const s = R.structs[e.id], c = E.center(s);
        for (let k = 0; k < 10; k++) fx.push({ k: 'bit', x: c.x, y: c.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, z: 0, vz: 3 + Math.random() * 3, t: 0.9, col: ART[s.type].side });
        if (s.type === 'hub') { shake = 0.4; banner('Quorum hub destroyed! Toxin colonies that depended on its signal fall silent.', 4); }
        if (s.type === 'cache') fx.push({ k: 'text', x: c.x, y: c.y, text: '+' + R.lootEach + ' ATP', t: 1.4, col: '#ca8a04' });
      }
      if (e.k === 'silent') { const s = R.structs[e.id]; const c = E.center(s); fx.push({ k: 'text', x: c.x, y: c.y, text: 'Silenced', t: 1.6, col: '#64748b' }); }
      if (e.k === 'storm') { banner('Cytokine storm! Too much inflammation is hurting your own cells. Slow down.', 4); shake = 0.25; }
      if (e.k === 'calm') banner('Inflammation is back under control.', 2.5);
      if (e.k === 'splash') fx.push({ k: 'ring', x: e.x, y: e.y, t: 0.5, r: 1.35 });
      if (e.k === 'cast') fx.push({ k: 'ring', x: e.x, y: e.y, t: 0.7, r: E.SPELLS[e.spell].radius, col: e.spell === 'chemokine' ? '#65a30d' : '#2563eb' });
      if (e.k === 'end') setTimeout(finishRaid, 900);
    }
    R.events = [];
  }

  function drawRaidScene(V, S, t, still) {
    const ctx = V.ctx;
    if (!V.w) return;
    ctx.save();
    if (shake > 0 && !reduceMotion && !still) ctx.translate((Math.random() - 0.5) * 6 * shake, (Math.random() - 0.5) * 6 * shake);
    ctx.clearRect(-10, -10, V.w + 20, V.h + 20);
    drawGround(V, '#f6e2d3', '#d6a77a');
    // No-landing zone around structures, shown faintly before the first cell lands (and always in the scout map).
    if (!S.firstDeploy || still) {
      for (let y = 0; y < E.N; y++) for (let x = 0; x < E.N; x++) if (!E.canDeploy(S, x + 0.5, y + 0.5)) tileDiamond(V, x, y, 1, '#e11d48', null, 0.08);
    }
    // Quorum signal reach.
    S.structs.forEach(s => {
      if (s.type !== 'hub' || !s.alive) return;
      const c = E.center(s), p = V.iso(c.x, c.y);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, s.signal * V.tw / Math.SQRT2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(101,163,13,.07)'; ctx.fill(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(101,163,13,.45)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore(); ctx.setLineDash([]);
    });
    // Spell zones.
    S.zones.forEach(z => {
      const p = V.iso(z.x, z.y);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5);
      ctx.beginPath(); ctx.arc(0, 0, z.r * V.tw / Math.SQRT2, 0, Math.PI * 2);
      ctx.globalAlpha = 0.18 + 0.12 * Math.min(1, z.t / 2);
      ctx.fillStyle = z.spell === 'chemokine' ? '#84cc16' : '#3b82f6'; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    });
    // Painter's order: structures and units together.
    const items = [];
    S.structs.forEach(s => { if (s.alive) items.push({ d: s.x + s.y + s.size * 2 - 0.5, s }); else items.push({ d: s.x + s.y, rubble: s }); });
    S.units.forEach(u => { if (u.alive) items.push({ d: u.x + u.y, u }); });
    items.sort((a, b) => a.d - b.d);
    const hubTops = {};
    for (const it of items) {
      if (it.rubble) { const s = it.rubble; tileDiamond(V, s.x + 0.15, s.y + 0.15, s.size - 0.3, 'rgba(120,90,60,.25)'); continue; }
      if (it.s) {
        const s = it.s, D = E.STRUCTS[s.type], art = ART[s.type];
        const r = drawBlock(V, s.x, s.y, s.size, art, { grey: s.silent, flash: s.hitT > 0.06, dome: s.type === 'wall' ? 0.2 : 0.55, squash: 1 });
        if (s.type === 'hub') hubTops[s.id] = r;
        if (s.tag > 0) { ctx.fillStyle = '#2563eb'; ctx.font = `700 ${Math.max(9, V.tw * 0.3)}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Y', r.cx + r.rx * 0.6, r.top - 2); }
        if (D.capsule && !(s.tag > 0)) { ctx.strokeStyle = 'rgba(14,116,144,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.cx, r.cy, r.rx * 1.15, r.ry * 1.6, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (D.infected) { ctx.fillStyle = '#be185d'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(r.cx + Math.cos(k * 1.6) * r.rx * 0.45, r.cy + Math.sin(k * 1.6) * r.ry * 0.5, Math.max(1.5, V.tw * 0.05), 0, Math.PI * 2); ctx.fill(); } }
        if (s.silent && D.quorum) { ctx.fillStyle = '#475569'; ctx.font = `600 ${Math.max(9, V.tw * 0.28)}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('z z', r.cx, r.top - 4); }
        if (s.hp < s.maxHp && !still) hpBar(ctx, r.cx, r.top - 8, Math.max(18, V.tw * 0.7), s.hp / s.maxHp, '#e11d48');
        continue;
      }
      const u = it.u, A = UNIT_ART[u.type], p = V.iso(u.x, u.y), rad = Math.max(5, A.r * V.tw * 1.05);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, rad, rad * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      const bob = reduceMotion ? 0 : Math.sin(t / 120 + u.x * 3) * 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y - rad - bob, rad, 0, Math.PI * 2);
      ctx.fillStyle = u.hitT > 0.06 ? '#fecaca' : A.fill; ctx.fill(); ctx.strokeStyle = A.ring; ctx.lineWidth = 1.5; ctx.stroke();
      if (u.type === 'neutrophil') { ctx.fillStyle = '#7c3aed'; [-0.35, 0, 0.35].forEach(o => { ctx.beginPath(); ctx.arc(p.x + o * rad, p.y - rad - bob + Math.abs(o) * rad * 0.3, rad * 0.22, 0, Math.PI * 2); ctx.fill(); }); }
      if (u.type === 'macrophage') { ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(p.x + rad * 0.2, p.y - rad - bob, rad * 0.3, 0, Math.PI * 2); ctx.fill(); }
      if (u.type === 'killerT') { ctx.fillStyle = '#4c1d95'; ctx.beginPath(); ctx.arc(p.x, p.y - rad - bob, rad * 0.45, 0, Math.PI * 2); ctx.fill(); }
      if (u.hp < u.maxHp) hpBar(ctx, p.x, p.y - rad * 2 - 5, Math.max(12, rad * 2.2), u.hp / u.maxHp, '#059669');
    }
    // Autoinducer links from hubs to the colonies they switch on.
    S.structs.forEach(s => {
      if (!s.alive || !E.STRUCTS[s.type].quorum || s.silent) return;
      const c = E.center(s), q = V.iso(c.x, c.y);
      S.structs.forEach(h => {
        if (h.type !== 'hub' || !h.alive) return;
        const hc = E.center(h); if (Math.hypot(hc.x - c.x, hc.y - c.y) > h.signal + s.size / 2) return;
        const hp = V.iso(hc.x, hc.y);
        const f = reduceMotion || still ? 0.5 : ((t / 900) + s.id * 0.13) % 1;
        ctx.fillStyle = '#65a30d'; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(hp.x + (q.x - hp.x) * f, hp.y - 20 + (q.y - hp.y) * f, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });
    });
    // Shots.
    S.shots.forEach(sh => {
      const f = Math.min(1, sh.t / sh.dur), a = V.iso(sh.fx, sh.fy), b = V.iso(sh.tx, sh.ty);
      const arc = sh.k === 'burst' ? Math.sin(f * Math.PI) * 40 : 0;
      if (f >= 1) return;
      ctx.fillStyle = sh.k === 'burst' ? '#ea580c' : '#a16207';
      ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * f, a.y - 16 + (b.y - a.y + 16) * f - arc, sh.k === 'burst' ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    });
    // Effects.
    fx.forEach(e => {
      const p = V.iso(e.x, e.y);
      if (e.k === 'bit') { ctx.fillStyle = e.col; ctx.globalAlpha = Math.min(1, e.t * 2); ctx.fillRect(p.x - 2, p.y - 2 - e.z * 6, 4, 4); ctx.globalAlpha = 1; }
      if (e.k === 'text') { ctx.globalAlpha = Math.min(1, e.t); ctx.fillStyle = e.col; ctx.font = '700 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.text, p.x, p.y - 30 - (1.4 - e.t) * 20); ctx.globalAlpha = 1; }
      if (e.k === 'ring') { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5); ctx.beginPath(); ctx.arc(0, 0, e.r * V.tw / Math.SQRT2 * (1.2 - e.t * 0.4), 0, Math.PI * 2); ctx.strokeStyle = e.col || '#ea580c'; ctx.globalAlpha = Math.min(1, e.t * 2); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; }
      if (e.k === 'nope') { ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2.5; ctx.globalAlpha = Math.min(1, e.t * 2); ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - 6); ctx.lineTo(p.x + 6, p.y + 6); ctx.moveTo(p.x + 6, p.y - 6); ctx.lineTo(p.x - 6, p.y + 6); ctx.stroke(); ctx.globalAlpha = 1; }
    });
    ctx.restore();
  }
  function hpBar(ctx, x, y, w, f, col) {
    ctx.fillStyle = 'rgba(15,23,42,.55)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
    ctx.fillStyle = f > 0.5 ? col : f > 0.25 ? '#d97706' : '#e11d48'; ctx.fillRect(x - w / 2, y, w * Math.max(0, f), 3);
  }

  /* ---------- Results ---------- */
  const QUESTIONS = {
    quorum: { q: 'Destroying the quorum hub silenced the toxin colonies near it. Why?', opts: ['They stopped receiving the autoinducer signal, so their toxin genes switched off', 'The hub was feeding them sugar', 'The hub was their only source of ATP'],
      why: 'Quorum sensing: bacteria release autoinducer and respond only when enough of it reaches their receptors. No signal reception means no transduction and no response.' },
    feedback: { q: 'The longer the battle went on, the farther the quorum hub\'s signal reached. What kind of feedback is that?', opts: ['Positive feedback', 'Negative feedback', 'No feedback'],
      why: 'Autoinducer turns on the genes that make more autoinducer, so the signal strengthens itself. That is positive feedback, which amplifies a response.' },
    storm: { q: 'Inflammation rose faster the higher it got, until it damaged your own cells. What kind of feedback is that?', opts: ['Positive feedback', 'Negative feedback', 'Endocrine signaling'],
      why: 'The response strengthened its own cause. IL-10 from regulatory T cells is negative feedback that brings it back down.' },
    opsonize: { q: 'Antibodies made the encapsulated bacteria much easier for phagocytes to destroy. Why?', opts: ['Antibodies coat (opsonize) the bacteria so phagocytes can grab them', 'Antibodies are toxic to all bacteria', 'Antibodies give phagocytes more ATP'],
      why: 'Capsules are slippery. Antibodies bound to the bacteria give phagocytes receptors something to hold on to, which speeds up phagocytosis.' },
    infected: { q: 'Why did killer T cells work on the infected cells when macrophages barely could?', opts: ['Killer T cells recognize infected body cells and destroy them', 'Infected cells are too big for any other cell', 'Macrophages only eat viruses'],
      why: 'Infected cells display pieces of virus on their surface. Cytotoxic (killer) T cells recognize those and trigger the infected cell to die.' },
    juxta: { q: 'Your B cells only made antibodies while touching an active helper T cell. What type of signaling is that?', opts: ['Juxtacrine (direct contact)', 'Paracrine (short distance)', 'Endocrine (through the blood)'],
      why: 'Helper T cells activate B cells through contact: a protein on the T cell binds a receptor on the B cell.' },
    paracrine: { q: 'Growth factor from a fibroblast only switched on respiring cells close to it. Why?', opts: ['It is a paracrine signal, so it only reaches nearby cells', 'Respiring cells far away had no ATP', 'Growth factor travels in the blood'],
      why: 'Paracrine signals diffuse a short distance from the cell that releases them. Endocrine signals like insulin travel in the blood and reach the whole body.' }
  };
  function lessonsFor(S) {
    const L = [], r = E.result(S);
    if (r.hubsDown && S.stats.silenced) L.push(['quorum', 'You destroyed a quorum hub, and the colonies relying on its autoinducer signal stopped firing.']);
    else if (!r.hubsDown) L.push(['quorum', 'The quorum hub survived, so its colonies kept receiving autoinducer and kept firing. Aim for the hub.']);
    if (S.stormTime > 0) L.push(['storm', `A cytokine storm lasted ${Math.round(S.stormTime)} seconds. Sending cells in waves, or IL-10 from regulatory T cells, keeps inflammation down.`]);
    if (S.stats.capsuleHits > 30 && S.stats.tagged < 2) L.push(['opsonize', 'Your phagocytes struggled with encapsulated bacteria. Antibodies would have tagged them first.']);
    else if (S.stats.tagged) L.push(['opsonize', 'Antibodies tagged bacteria so your phagocytes destroyed them faster.']);
    if (S.stats.infectedPhago > 20) L.push(['infected', 'Infected cells shrugged off phagocytes. Killer T cells are the cells that destroy them.']);
    if (S.stats.burstKills > 4) L.push([null, `Toxin bursts destroyed ${S.stats.burstKills} of your cells at once. Send macrophages in first to soak up the hits.`]);
    L.push(['feedback', 'The hub\'s signal reached farther as the battle went on: autoinduction is positive feedback.']);
    return L;
  }
  function finishRaid() {
    if (!R || $('battle').hidden) return;
    const r = E.result(R), site = E.SITES[raidSite], prev = base.sites[site.id] || 0;
    const newStars = Math.max(0, r.stars - prev);
    const replay = prev > 0 ? 0.5 : 1;
    const loot = Math.round(r.loot * replay), bonus = newStars * E.starBonus(raidSite);
    // Survivors come home.
    const home = {};
    R.units.forEach(u => { if (u.alive && u.type !== 'neutrophil') home[u.type] = (home[u.type] || 0) + 1; });
    E.UNIT_ORDER.forEach(t => { base.army[t] += (R.army[t] || 0) + (home[t] || 0); });
    const cap = calc.capacity; while (E.housingUsed(base.army) > cap) { const t = E.UNIT_ORDER.slice().reverse().find(k => base.army[k] > 0); base.army[t]--; }
    base.atp = Math.min(storageOf(), base.atp + loot + bonus);
    base.sites[site.id] = Math.max(prev, r.stars);
    save(); report();
    const lessons = lessonsFor(R);
    const qKey = (lessons.find(l => l[0]) || ['quorum'])[0];
    const Q = QUESTIONS[qKey];
    const order = Q.opts.map((o, i) => i).sort(() => Math.random() - 0.5);
    lastResult = { site: site.name, stars: r.stars, pct: r.pct, loot, bonus, lessons: lessons.map(l => l[1]), q: Q };
    $('resStars').innerHTML = [0, 1, 2].map(k => `<i class="${k < r.stars ? 'on' : ''}" style="animation-delay:${k * 0.18}s">${icon('star')}</i>`).join('');
    $('resTitle').textContent = r.stars === 3 ? 'Infection cleared!' : r.stars ? 'Infection pushed back' : 'The infection held on';
    $('resNums').innerHTML = `<span><b>${r.pct}%</b>destroyed</span><span><b>+${loot + bonus}</b>ATP${bonus ? ` (${bonus} star bonus)` : ''}</span><span><b>${R.stats.unitsLost}</b>cells lost</span>`;
    $('resLessons').innerHTML = lessons.slice(0, 3).map(l => `<li>${esc(l[1])}</li>`).join('');
    $('resCheck').innerHTML = `<div class="bd-label">Quick check</div><p><b>${esc(Q.q)}</b></p><div class="ss-opts">${order.map(i => `<button class="bd-btn secondary" type="button" data-opt="${i}" id="opt-${i}">${esc(Q.opts[i])}</button>`).join('')}</div><p class="bd-help" id="resWhy" hidden></p>`;
    $('resCheck').querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
      const right = +b.dataset.opt === 0;
      $('resCheck').querySelectorAll('[data-opt]').forEach(x => { x.disabled = true; if (+x.dataset.opt === 0) x.classList.add('right'); });
      if (!right) b.classList.add('wrong');
      $('resWhy').hidden = false; $('resWhy').innerHTML = `<b>${right ? 'Correct.' : 'Not quite.'}</b> ${esc(Q.why)}`;
      lastResult.answered = right ? 'correct' : 'incorrect';
    });
    $('results').showModal();
  }
  let lastResult = null;
  $('resHome').onclick = () => { $('results').close(); goHome(); };
  $('resAgain').onclick = () => { $('results').close(); goHome(); openArmy(); };
  $('resPrint').onclick = () => {
    const L = lastResult; if (!L) return;
    const stars = totalStars();
    W.print('Signal Siege raid report', `
      <h2>${esc(L.site)}</h2>
      <table><tr><th>Stars</th><td>${L.stars} of 3</td><th>Destroyed</th><td>${L.pct}%</td></tr><tr><th>ATP earned</th><td>${L.loot + L.bonus}</td><th>All stars so far</th><td>${stars} of ${E.SITES.length * 3}</td></tr></table>
      <h2>What happened, and why</h2><ul>${L.lessons.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <h2>Quick check</h2><p><b>${esc(L.q.q)}</b></p><p>Answer: ${esc(L.q.opts[0])}. ${esc(L.q.why)}</p>
      <h2>Reflection</h2><p><b>Describe one signal in this game as reception, transduction and response. Which cell sends it, which receives it, and what changes?</b></p>
      <div class="lines"></div><div class="lines"></div><div class="lines"></div><div class="lines"></div>`);
  };
  function goHome() { R = null; $('battle').hidden = true; $('home').hidden = false; baseV.resize(); renderAll(); }

  /* ================= Main loop ================= */
  let prodAcc = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
    if (R && !$('battle').hidden) {
      if (!R.over) { const steps = 2; for (let k = 0; k < steps; k++) E.step(R, dt / steps); }
      if (R.events.length) handleEvents();
      fx.forEach(e => { e.t -= dt; if (e.k === 'bit') { e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt; e.vz -= 12 * dt; if (e.z < 0) e.z = 0; } });
      fx = fx.filter(e => e.t > 0);
      if (shake > 0) shake -= dt;
      if (banners.length) { banners[0].t -= dt; if (banners[0].t <= 0) { banners = []; $('bBanner').hidden = true; } }
      drawRaidScene(battleV, R, now);
      renderBattleHud();
    } else {
      drawBase(now);
      prodAcc += dt;
      if (prodAcc >= 1) { base.atp = Math.min(storageOf(), base.atp + calc.production / 60 * prodAcc); prodAcc = 0; renderHud(); }
    }
    requestAnimationFrame(loop);
  }

  /* ================= How it works ================= */
  function openHow() { $('how').showModal(); }
  $('howGo').onclick = () => { $('how').close(); base.seenHow = true; save(); };

  /* ================= Wiring ================= */
  $('buildBtn').onclick = openBuild;
  $('armyBtn').onclick = openArmy;
  $('raidBtn').onclick = openSites;
  $('howBtn').onclick = openHow;
  setInterval(save, 15000);
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  recompute(); renderAll(); report();
  if (!base.seenHow) setTimeout(openHow, 300);
  requestAnimationFrame(loop);

  // Hooks for automated tests only.
  window.__siege = { get base() { return base; }, get raid() { return R; }, startRaid, openSites, openArmy, openBuild, finishRaid, recompute: () => { recompute(); renderAll(); }, E };
})();
