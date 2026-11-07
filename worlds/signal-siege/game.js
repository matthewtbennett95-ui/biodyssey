/* Signal Siege: plan, run, explain. The rules live in engine.js; the levels in levels.js. */
(function () {
  'use strict';
  const E = window.SiegeEngine, LEVELS = window.SiegeLevels, B = window.Biodyssey, W = B.world('signal-siege');
  const $ = id => document.getElementById(id);
  const esc = B.esc, icon = B.icon;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Saved progress ================= */
  W.store.remove('base');   // the earlier raid version's save is no longer used
  const saved = W.store.get('camp', null) || {};
  const camp = { stars: {}, layouts: {}, predictions: {}, skip: !!saved.skip };
  Object.keys(saved.predictions || {}).forEach(k => { if (LEVELS.some(L => L.id === k)) camp.predictions[k] = !!saved.predictions[k]; });
  LEVELS.forEach(L => {
    const s = (saved.stars || {})[L.id]; if (s) camp.stars[L.id] = Math.max(0, Math.min(3, s | 0));
    const lay = (saved.layouts || {})[L.id];
    if (Array.isArray(lay)) camp.layouts[L.id] = lay.filter(p => Array.isArray(p) && L.palette[p[0]] && isBuildable(L, p[1], p[2])).map(p => [p[0], p[1] | 0, p[2] | 0]);
  });
  function save() { W.store.set('camp', camp); }
  const BOOT = LEVELS.filter(L => !L.kind), CASES = LEVELS.filter(L => L.kind === 'case');
  const isCase = L => L.kind === 'case';
  const starsIn = list => list.reduce((s, L) => s + (camp.stars[L.id] || 0), 0);
  const totalStars = () => starsIn(LEVELS);
  const GOAL_CASES = 4;
  function report() {
    const solved = CASES.filter(L => (camp.stars[L.id] || 0) >= 1).length, all3 = CASES.every(L => camp.stars[L.id] === 3);
    W.report({ goal: solved >= GOAL_CASES, stretch: all3, summary: `Boot camp ${starsIn(BOOT)}/${BOOT.length * 3} stars · cases solved ${solved}/${CASES.length}` });
  }
  // Boot camp opens one level at a time. Cases open all at once, after boot camp (or if a student tests out).
  const casesOpen = () => camp.skip || BOOT.every(L => (camp.stars[L.id] || 0) >= 1);
  const unlocked = i => { const L = LEVELS[i]; if (isCase(L)) return casesOpen(); const k = BOOT.indexOf(L); return k === 0 || (camp.stars[BOOT[k - 1].id] || 0) >= 1; };
  const numberOf = L => isCase(L) ? 'C' + (CASES.indexOf(L) + 1) : String(BOOT.indexOf(L) + 1);
  function isBuildable(L, c, r) { return L.map[r] && L.map[r][c] === '.' && !(L.fixed || []).some(f => f[1] === c && f[2] === r); }

  /* ================= Cell art (game pieces) ================= */
  const ART = {
    macrophage: '<path d="M20 5c4 0 5 3 8 3s6 3 5 7 3 5 1 9-4 4-5 7-5 5-9 4-6 2-9-1-6-4-6-8 2-6 0-9 2-7 5-8 5-4 10-4z" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/><circle cx="23" cy="19" r="5" fill="#16a34a" opacity=".8"/><circle cx="14" cy="24" r="2" fill="#15803d" opacity=".5"/>',
    capillary: '<rect x="3" y="12" width="34" height="16" rx="8" fill="#fecaca" stroke="#dc2626" stroke-width="2"/><ellipse cx="12" cy="20" rx="4" ry="3" fill="#ef4444"/><ellipse cx="21" cy="20" rx="4" ry="3" fill="#ef4444"/><ellipse cx="30" cy="20" rx="3.5" ry="3" fill="#ef4444"/>',
    dendritic: '<path d="M20 4l3 9 9-4-5 8 9 3-9 3 5 8-9-4-3 9-3-9-9 4 5-8-9-3 9-3-5-8 9 4z" fill="#e9d5ff" stroke="#9333ea" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="20" r="4.5" fill="#9333ea" opacity=".75"/>',
    helperT: '<circle cx="20" cy="20" r="14" fill="#fbcfe8" stroke="#db2777" stroke-width="2"/><circle cx="20" cy="20" r="8" fill="#db2777" opacity=".75"/><path d="M6 14l-3-2M34 14l3-2M6 26l-3 2M34 26l3 2" stroke="#db2777" stroke-width="2" stroke-linecap="round"/>',
    bcell: '<circle cx="20" cy="21" r="13" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/><circle cx="20" cy="21" r="6" fill="#2563eb" opacity=".7"/><path d="M11 7v4l-3 3M11 11l3 3M29 7v4l-3 3M29 11l3 3" stroke="#2563eb" stroke-width="2" stroke-linecap="round" fill="none"/>',
    adrenal: '<path d="M20 5c8 2 15 10 15 20 0 6-6 10-15 10S5 31 5 25C5 15 12 7 20 5z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/><path d="M12 25c3-4 13-4 16 0" stroke="#ea580c" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="17" r="3" fill="#ea580c"/>',
    treg: '<circle cx="20" cy="20" r="13" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#0284c7" opacity=".7"/><circle cx="20" cy="20" r="17" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3 3"/>',
    wall: '<rect x="5" y="7" width="30" height="26" rx="6" fill="#e7e5e4" stroke="#78716c" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="#a8a29e"/>'
  };
  const art = (t, size) => `<svg viewBox="0 0 40 40" width="${size || 40}" height="${size || 40}" aria-hidden="true" focusable="false">${ART[t]}</svg>`;

  /* ================= Notices: shown in the coach panel, never on top of the board ================= */
  let notice = null, noticeTimer = null;
  function say(msg, opt) {
    opt = opt || {};
    notice = { msg, opt };
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice = null; if (!$('play').hidden && L) renderCoach(); else renderCampNotice(); }, opt.ms || 6000);
    if (!$('play').hidden && L) renderCoach(); else renderCampNotice();
    return true;
  }
  B.onToast = say;
  function noticeHtml() {
    if (!notice) return '';
    return `<div class="ss-notice ${notice.opt.kind || ''}">${icon(notice.opt.icon || 'info')}<span>${esc(notice.msg)}</span>${notice.opt.action ? `<button class="bd-btn secondary" type="button" id="noticeAct">${esc(notice.opt.action)}</button>` : ''}</div>`;
  }
  function wireNotice() { const b = $('noticeAct'); if (b) b.onclick = () => { const f = notice.opt.onAction; notice = null; renderCoach(); if (f) f(); }; }
  function renderCampNotice() { const box = $('campNotice'); if (!box) return; box.innerHTML = noticeHtml(); box.hidden = !notice; wireNotice(); }

  /* ================= State ================= */
  let L = null, li = 0, placed = [], pick = null, selected = null, run = null, phase = 'plan', speed = 1, tut = 0, pausedFor = null, explained = {}, feed = [], lastStars = 0;

  /* ================= Camp screen ================= */
  function renderCamp() {
    const g = W.info.goals, p = W.progress();
    $('goals').innerHTML = `<li class="goal ${p.goal ? 'done' : ''}"><span class="bd-goal-ic">${icon('check')}</span><span><b>Goal</b><small>${esc(g.goal)}</small></span></li>
      <li class="stretch ${p.stretch ? 'done' : ''}"><span class="bd-goal-ic">${icon('star')}</span><span><b>Stretch goal</b><small>${esc(g.stretch)}</small></span></li>`;
    $('campStars').textContent = `${starsIn(BOOT)} of ${BOOT.length * 3} stars`;
    $('caseStars').textContent = `${CASES.filter(L => camp.stars[L.id]).length} of ${CASES.length} solved`;
    $('casesNote').textContent = casesOpen() ? 'Harder: read the case file, then predict before you run. Play them in any order.' : 'Finish boot camp to open the cases.';
    $('skipBtn').hidden = casesOpen();
    const card = (L) => {
      const i = LEVELS.indexOf(L), st = camp.stars[L.id] || 0, open = unlocked(i);
      return `<li><button class="ss-level${isCase(L) ? ' case' : ''}" type="button" id="lvl-${L.id}" data-i="${i}" ${open ? '' : 'disabled'}>
        <span class="ss-lvl-n">${numberOf(L)}</span>
        <span class="ss-level-body"><b>${esc(L.title)}</b><small>${esc(L.topic)}</small></span>
        ${open ? `<span class="ss-stars" aria-label="${st} of 3 stars">${[0, 1, 2].map(k => `<i class="${k < st ? 'on' : ''}">${icon('star')}</i>`).join('')}</span>` : `<span class="ss-lock">${icon('lock')}</span>`}
      </button></li>`;
    };
    $('levels').innerHTML = BOOT.map(card).join('');
    $('cases').innerHTML = CASES.map(card).join('');
    document.querySelectorAll('#levels [data-i], #cases [data-i]').forEach(b => b.onclick = () => openLevel(+b.dataset.i));
    const order = casesOpen() ? CASES.concat(BOOT) : BOOT;
    const next = order.find(L => unlocked(LEVELS.indexOf(L)) && !camp.stars[L.id]) || order.find(L => (camp.stars[L.id] || 0) < 3) || BOOT[0];
    $('continueBtn').innerHTML = `${totalStars() ? 'Continue' : 'Start'}: ${isCase(next) ? 'Case ' + numberOf(next).slice(1) : numberOf(next) + '.'} ${esc(next.title)}${icon('arrow-right')}`;
    $('continueBtn').onclick = () => openLevel(LEVELS.indexOf(next));
  }

  $('skipBtn').onclick = () => { camp.skip = true; save(); renderCamp(); say('Cases unlocked. Boot camp is still there if you need it.', { icon: 'check-circle', kind: 'good' }); };

  /* ================= Level screen ================= */
  function openLevel(i) {
    li = i; L = LEVELS[i];
    placed = (camp.layouts[L.id] || []).map(p => p.slice());
    pick = null; selected = null; run = null; phase = 'plan'; tut = 0; explained = {}; feed = []; pausedFor = null;
    $('camp').hidden = true; $('play').hidden = false;
    $('lvlN').textContent = numberOf(L); $('lvlTitle').textContent = L.title; $('lvlTopic').textContent = L.topic;
    buildBoard(); layoutBoard(); renderAll(); window.scrollTo({ top: 0 });
    requestAnimationFrame(sizeFx);
  }
  function backToCamp() { stopRun(); $('play').hidden = true; $('camp').hidden = false; renderCamp(); window.scrollTo({ top: 0 }); }
  $('backBtn').onclick = backToCamp;

  const spent = () => E.cost(L, placed);
  const left = t => L.palette[t] - placed.filter(p => p[0] === t).length;
  function allCells() { return (L.fixed || []).map(f => ({ type: f[0], c: f[1], r: f[2], fixed: true })).concat(placed.map(p => ({ type: p[0], c: p[1], r: p[2] }))); }
  function cellAt(c, r) { return allCells().find(x => x.c === c && x.r === r); }
  function incoming() { const n = {}; L.waves.forEach(w => { n[w[1]] = (n[w[1]] || 0) + 1; }); return n; }

  function buildBoard() {
    const b = $('board'); b.innerHTML = '';
    for (let r = 0; r < E.ROWS; r++) for (let c = 0; c < E.COLS; c++) {
      const t = document.createElement('button');
      t.type = 'button'; t.className = 'ss-tile'; t.id = `t-${c}-${r}`; t.dataset.c = c; t.dataset.r = r;
      t.onclick = () => tapTile(c, r);
      b.appendChild(t);
    }
  }
  // Rows where nothing can be placed are drawn thin, so the squares you use stay big (important on phones).
  function thinRow(r) { return [...L.map[r]].every((ch, c) => ch !== '.') && !(L.fixed || []).some(f => f[2] === r); }
  function layoutBoard() {
    const b = $('board'); if (!b.clientWidth || !L) return;
    const cs = getComputedStyle(b), gap = parseFloat(cs.columnGap) || 4, pad = parseFloat(cs.paddingLeft) || 8;
    const tw = (b.clientWidth - pad * 2 - gap * (E.COLS - 1)) / E.COLS, phone = innerWidth <= 640;
    const full = Math.round(tw * (phone ? 0.8 : 0.86)), thin = Math.max(32, Math.round(full * 0.42));
    b.style.gridTemplateRows = Array.from({ length: E.ROWS }, (_, r) => (thinRow(r) ? thin : full) + 'px').join(' ');
    for (let r = 0; r < E.ROWS; r++) for (let c = 0; c < E.COLS; c++) $(`t-${c}-${r}`).classList.toggle('thin', thinRow(r));
  }
  function renderBoard() {
    const cells = allCells(), sig = E.signals(cells), inc = incoming();
    // Where would the picked cell work? (Shown while placing, so students can see signal reach.)
    let good = null;
    if (pick && E.CELLS[pick].needs && phase === 'plan') {
      good = {};
      for (let r = 0; r < E.ROWS; r++) for (let c = 0; c < E.COLS; c++) if (isBuildable(L, c, r) && !cellAt(c, r)) {
        const trial = cells.concat([{ type: pick, c, r }]);
        good[c + ',' + r] = E.signals(trial).on[trial.length - 1];
      }
    }
    for (let r = 0; r < E.ROWS; r++) for (let c = 0; c < E.COLS; c++) {
      const t = $(`t-${c}-${r}`), i = cells.findIndex(x => x.c === c && x.r === r), x = cells[i];
      const build = isBuildable(L, c, r);
      t.className = 'ss-tile' + (build ? ' build' : ' off') + (x ? ' has' : '') + (x && x.fixed ? ' fixed' : '') + (selected && selected.c === c && selected.r === r ? ' sel' : '');
      if (good && good[c + ',' + r]) t.classList.add('good');
      if (r === 0 && inc[c] && !x && phase === 'plan') t.classList.add('entry');
      let label = `Row ${r + 1}, lane ${c + 1}`;
      let html = '';
      if (x) {
        const D = E.CELLS[x.type], on = phase === 'plan' ? sig.on[i] : (run ? run.sig.on[run.cells.findIndex(y => y.c === c && y.r === r)] : sig.on[i]);
        const live = run && run.cells.find(y => y.c === c && y.r === r);
        const hp = live ? live.hp / live.max : 1;
        html = `<span class="ss-art${live && live.hp <= 0 ? ' dead' : ''}">${art(x.type)}</span>` +
          (D.needs ? `<span class="ss-dot ${on ? 'on' : 'off'}" aria-hidden="true"></span>` : '') +
          (live && hp < 1 && hp > 0 ? `<span class="ss-hp"><i style="width:${Math.round(hp * 100)}%"></i></span>` : '') +
          (x.fixed ? `<span class="ss-pin" aria-hidden="true">${icon('lock')}</span>` : '') +
          (live && live.blocked ? '<span class="ss-tox block">Gi blocked</span>' : '') + (live && live.locked ? '<span class="ss-tox lock">Gs stuck on</span>' : '');
        label = `${D.name}${x.fixed ? ' (already placed)' : ''}${D.needs ? (on ? ', working' : ', not working') : ''}. ${label}`;
      } else if (r === 0 && inc[c] && phase === 'plan') {
        html = `<span class="ss-entry-tag">${icon('arrow-right')}${inc[c]}</span>`;
        label = `${inc[c]} bacteria will enter lane ${c + 1}`;
      }
      t.innerHTML = html;
      t.setAttribute('aria-label', label);
      t.disabled = phase !== 'plan';
    }
    tutorialHighlight();
  }

  function tapTile(c, r) {
    if (phase !== 'plan') return;
    const x = cellAt(c, r);
    if (pick && !x && isBuildable(L, c, r)) {
      if (left(pick) <= 0) { say(`No more ${E.CELLS[pick].name.toLowerCase()}s for this level.`, { kind: 'warn', icon: 'alert', ms: 3500 }); return; }
      if (spent() + E.CELLS[pick].cost > L.budget) { say('Not enough ATP for that. Remove a cell or pick a cheaper one.', { kind: 'warn', icon: 'alert', ms: 3500 }); return; }
      placed.push([pick, c, r]); selected = { c, r };
      if (left(pick) <= 0) pick = null;
      camp.layouts[L.id] = placed; save();
      tutorialEvent('place');
    } else if (x) { selected = { c, r }; tutorialEvent('select'); }
    else selected = null;
    renderAll();
  }
  function removeSelected() {
    if (!selected) return;
    const k = placed.findIndex(p => p[1] === selected.c && p[2] === selected.r);
    if (k >= 0) { placed.splice(k, 1); camp.layouts[L.id] = placed; save(); }
    selected = null; renderAll();
  }
  $('speedBtn').onclick = () => { speed = speed === 1 ? 2 : 1; renderAll(); };
  $('clearBtn').onclick = () => { if (phase !== 'plan') { resetToPlan(); return; } placed = []; selected = null; camp.layouts[L.id] = placed; save(); renderAll(); };

  /* ---------- Tray ---------- */
  function renderTray() {
    const types = Object.keys(L.palette);
    $('tray').innerHTML = types.map(t => {
      const D = E.CELLS[t], n = left(t), poor = spent() + D.cost > L.budget;
      return `<button class="ss-piece${pick === t ? ' on' : ''}" type="button" id="pick-${t}" data-t="${t}" ${phase !== 'plan' || n <= 0 || poor ? 'disabled' : ''} aria-pressed="${pick === t}">
        ${art(t, 34)}<b>${esc(D.name)}</b><span class="mono">${D.cost} ATP</span><span class="ss-count">×${n}</span></button>`;
    }).join('');
    $('tray').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { pick = pick === b.dataset.t ? null : b.dataset.t; selected = null; tutorialEvent('pick:' + b.dataset.t); renderAll(); });
    $('tray').hidden = phase !== 'plan';
  }

  function renderChips() {
    $('atpChip').innerHTML = `<span class="mono">${L.budget - spent()}</span>&nbsp;ATP left`;
    const tissue = run ? run.tissue : (L.tissue || 3), max = L.tissue || 3;
    $('tissueChip').innerHTML = `Tissue <span class="ss-pips">${Array.from({ length: max }, (_, k) => `<i class="${k < tissue ? 'on' : ''}"></i>`).join('')}</span>`;
    $('tissueChip').className = 'bd-chip' + (run && run.tissue < max ? ' bad' : '');
  }

  /* ---------- The coach: always beside or below the board, never on top of it ---------- */
  function signalSteps(type, on) {
    const D = E.CELLS[type];
    const S = D.needs ? E.SIGNALS[D.needs] : null;
    if (!S) return '';
    return `<ol class="ss-steps${on ? '' : ' dim'}"><li><b>Reception</b>${esc(S.receptor)} binds ${esc(S.name.toLowerCase())}</li><li><b>Transduction</b>${esc(S.relay)}</li><li><b>Response</b>${esc(S.response)}</li></ol>`;
  }
  // Which relay each of the cell's receptors uses: this is what toxins attack.
  function pathways(type) {
    const D = E.CELLS[type], list = [D.needs, D.boost].filter(Boolean);
    if (!list.length) return '';
    return `<p class="ss-paths">${list.map(k => `<span class="bd-chip line">${esc(E.SIGNALS[k].name)} → ${esc(E.PATHS[E.SIGNALS[k].path])}</span>`).join('')}</p>`;
  }
  const fileOpen = {};
  function caseFile() {
    if (fileOpen[L.id] === undefined) fileOpen[L.id] = !camp.layouts[L.id] || !camp.layouts[L.id].length;
    const open = fileOpen[L.id];
    return `<div class="ss-file"><button class="ss-file-head" type="button" id="caseToggle" aria-expanded="${open}"><span class="bd-label">Case file</span><span class="bd-small">${open ? 'Hide' : `Show the story and ${L.file.findings.length} findings`}</span>${icon('chevron-right')}</button>
      ${open ? `<p>${esc(L.file.story)}</p><ul class="ss-findings">${L.file.findings.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}</div>`;
  }
  function renderCoach() {
    const box = $('coach');
    if (phase === 'done') { renderResult(); $('coach').insertAdjacentHTML('afterbegin', noticeHtml()); wireNotice(); return; }
    if (phase === 'predict') {
      box.innerHTML = `<div class="bd-label">Before you run</div><p class="ss-say tut">Predict what will happen with your plan.</p>
        <div class="ss-opts">${PREDICT.map(([k, t]) => `<button class="bd-btn secondary" type="button" id="pred-${k}" data-pred="${k}">${esc(t)}</button>`).join('')}</div>
        <button class="bd-btn ghost" type="button" id="predBack">Back to my plan</button>`;
      box.querySelectorAll('[data-pred]').forEach(b => b.onclick = () => startRun(b.dataset.pred));
      $('predBack').onclick = () => { phase = 'plan'; renderAll(); };
      return;
    }
    if (phase === 'run') {
      const extra = [];
      if (L.storm) extra.push(meter('Inflammation', run.infl / 100, run.storm ? 'Cytokine storm!' : ''));
      if (L.quorum) { const n = run.germs.filter(g => g.alive).length; extra.push(meter(`Bacteria on the board (quorum at ${L.quorum})`, n / L.quorum, run.quorumOn ? 'Quorum reached: toxins on!' : '')); }
      box.innerHTML = `<div class="ss-coach-head"><span class="bd-label">Running</span></div>
        ${pausedFor ? `<p class="ss-say">${esc(pausedFor)}</p><button class="bd-btn block" type="button" id="resumeBtn">Keep going</button>` : `<ul class="ss-feed">${feed.slice(-3).map(f => `<li class="${f.bad ? 'bad' : ''}">${esc(f.text)}</li>`).join('') || '<li>Watch the lanes…</li>'}</ul>`}
        ${extra.join('')}`;
      if ($('resumeBtn')) $('resumeBtn').onclick = () => { pausedFor = null; renderCoach(); };
      return;
    }
    // Planning.
    const step = L.tutorial && L.tutorial[tut];
    let html = '';
    if (step) html += `<p class="ss-say tut"><span class="ss-step-n">Step ${tut + 1} of ${L.tutorial.length}</span>${esc(step.say)}</p>${step.waitFor ? '' : '<button class="bd-btn" type="button" id="tutNext">Next</button>'}`;
    else html += isCase(L) ? caseFile() : `<p class="ss-say">${esc(L.brief)}</p>`;
    if (selected) {
      const cells = allCells(), sig = E.signals(cells), i = cells.findIndex(x => x.c === selected.c && x.r === selected.r), x = cells[i];
      if (x) {
        const D = E.CELLS[x.type], on = sig.on[i];
        html += `<div class="ss-info"><div class="ss-info-head">${art(x.type, 28)}<b>${esc(D.name)}</b>${D.needs ? (on ? `<span class="bd-chip good">${icon('check')}Working</span>` : `<span class="bd-chip bad">${icon('alert')}Not working</span>`) : ''}</div>
          <p>${esc(D.job)}</p>${pathways(x.type)}${!on && D.needs ? `<p class="ss-why">${esc(E.why(cells, i, sig))}</p>` : ''}${signalSteps(x.type, on)}
          ${!x.fixed ? `<button class="bd-btn ghost" type="button" id="removeBtn">Remove</button>` : ''}</div>`;
      }
    } else if (!step) {
      if (!isCase(L)) html += `<details class="ss-learn"><summary>The biology${icon('chevron-right')}</summary><p>${esc(L.learn)}</p></details>`;
      if (pick && E.CELLS[pick].needs) html += `<p class="bd-help">Green squares are where it would receive its signal.</p>`;
    }
    box.innerHTML = noticeHtml() + html;
    wireNotice();
    if ($('caseToggle')) $('caseToggle').onclick = () => { fileOpen[L.id] = !fileOpen[L.id]; renderCoach(); };
    if ($('removeBtn')) $('removeBtn').onclick = removeSelected;
    if ($('tutNext')) $('tutNext').onclick = () => { tut++; renderAll(); };
  }
  function meter(label, f, alert) {
    const pct = Math.max(0, Math.min(100, f * 100));
    return `<div class="ss-meter-row${alert ? ' alert' : ''}"><span>${esc(alert || label)}</span><div class="ss-meter"><i style="width:${pct}%"></i></div></div>`;
  }

  /* ---------- Tutorial ---------- */
  function tutorialEvent(ev) {
    const step = L.tutorial && L.tutorial[tut];
    if (step && step.waitFor && (ev === step.waitFor || (step.waitFor === 'place' && ev === 'place'))) { tut++; }
  }
  function tutorialHighlight() {
    document.querySelectorAll('.ss-hl').forEach(e => e.classList.remove('ss-hl'));
    const step = phase === 'plan' && L.tutorial && L.tutorial[tut];
    if (!step || !step.highlight) return;
    const [k, v] = step.highlight.split(':');
    if (k === 'tile') { const [c, r] = v.split(','); const t = $(`t-${c}-${r}`); if (t) t.classList.add('ss-hl'); }
    if (k === 'tray') { const t = $('pick-' + v); if (t) t.classList.add('ss-hl'); }
    if (k === 'run') $('runBtn').classList.add('ss-hl');
    if (k === 'lane') for (let r = 0; r < E.ROWS; r++) $(`t-${v}-${r}`).classList.add('ss-hl', 'soft');
  }

  /* ================= Running ================= */
  // The first time something important happens, explain it (and in the first two levels, pause to read).
  const FIRSTS = {
    kill: 'The macrophage engulfed a bacterium. Its membrane wrapped around it, pulled it in and digested it: phagocytosis.',
    neutrophil: 'Chemokine reached the capillary\'s receptors, so neutrophils left the blood and charged up the lane. That\'s paracrine signaling.',
    tag: 'The B cell fired antibodies. Tagged bacteria take double damage, and capsules stop protecting them.',
    quorum: 'Enough bacteria gathered to reach a quorum. Their autoinducer signal switched on their toxins, so they hit harder and move faster.',
    storm: 'Cytokine storm! Inflammation fed on itself (positive feedback) and is now damaging your own cells.',
    calm: 'Inflammation is back down. IL-10 and time brought it under control (negative feedback).',
    leak: 'A bacterium reached your tissue. Nothing in that lane stopped it.',
    lost: 'One of your cells was destroyed. If it was sending a signal, the cells relying on it just switched off.',
    blocked: 'Pertussis toxin reached a capillary and disabled its Gi G protein. Chemokine still binds, but the signal can\'t be relayed, so it stopped responding.',
    locked: 'Cholera toxin locked a capillary\'s Gs G protein "on". It will keep releasing neutrophils with no signal at all, and inflammation will climb.'
  };
  const PREDICT = [['clean', 'All bacteria stopped, none reach my tissue'], ['leak', 'I win, but some bacteria get through'], ['lose', 'The infection wins']];
  function note(key, bad) {
    if (explained[key]) return;
    explained[key] = true;
    feed.push({ text: FIRSTS[key], bad });
    if (li <= 1 && ['kill', 'neutrophil'].includes(key)) pausedFor = FIRSTS[key];
  }
  $('runBtn').onclick = () => {
    if (phase === 'done') { resetToPlan(); return; }
    if (phase !== 'plan') return;
    tutorialEvent('run');
    if (isCase(L)) { phase = 'predict'; pick = null; selected = null; renderAll(); return; }
    startRun(null);
  };
  function startRun(prediction) {
    if (isCase(L)) fileOpen[L.id] = false;
    phase = 'run'; pick = null; selected = null; feed = []; explained = {}; pausedFor = null;
    run = E.createRun(L, placed); run.prediction = prediction;
    fxParts = [];
    renderAll();
  }
  function stopRun() { run = null; phase = 'plan'; }
  function resetToPlan() { stopRun(); pausedFor = null; renderAll(); }

  let acc = 0, lastT = 0, lastBoard = 0, fxParts = [];
  function loop(now) {
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    if (phase === 'run' && run && !pausedFor) {
      acc += dt * speed;
      let changed = false;
      while (acc >= E.DT && !run.over && !pausedFor) {
        acc -= E.DT; E.step(run);
        for (const e of run.events) {
          if (e.k === 'kill') { note('kill'); fxParts.push({ x: e.x, y: e.y, t: 0.5, k: 'pop' }); }
          if (e.k === 'leak') { note('leak', true); fxParts.push({ x: e.c + 0.5, y: E.ROWS - 0.2, t: 0.8, k: 'leak' }); changed = true; }
          if (e.k === 'quorum') note('quorum', true);
          if (e.k === 'storm') note('storm', true);
          if (e.k === 'calm') note('calm');
          if (e.k === 'lost') { note('lost', true); changed = true; }
          if (e.k === 'switchedOff') changed = true;
          if (e.k === 'blocked' || e.k === 'locked') { note(e.k, true); changed = true; }
          if (e.k === 'end') { finishRun(); }
        }
        run.events.length = 0;
        if (run.stats.neutrophils === 1 && !explained.neutrophil) note('neutrophil');
        if (run.stats.tagged === 1 && !explained.tag) note('tag');
      }
      if (changed) renderBoard();
      if (phase === 'run') { renderCoach(); renderChips(); }
      // Refresh tile health bars a few times a second.
      if (now - lastBoard > 250) { lastBoard = now; renderBoard(); }
    }
    drawFx(dt);
    requestAnimationFrame(loop);
  }

  /* ---------- Drawing bacteria, neutrophils and signals on the overlay ---------- */
  const fx = $('fx'), ctx = fx.getContext('2d');
  let geo = null;
  function sizeFx() {
    const b = $('board'), r = b.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    fx.width = Math.round(r.width * d); fx.height = Math.round(r.height * d);
    fx.style.width = r.width + 'px'; fx.style.height = r.height + 'px';
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const t00 = $('t-0-0').getBoundingClientRect(), t10 = $('t-1-0').getBoundingClientRect();
    const tops = [], hs = [];
    for (let k = 0; k < E.ROWS; k++) { const q = $(`t-0-${k}`).getBoundingClientRect(); tops.push(q.top - r.top); hs.push(q.height); }
    geo = { w: r.width, h: r.height, x0: t00.left - r.left, tw: t00.width, px: t10.left - t00.left, tops, hs };
  }
  let lastW = 0;
  const onResize = () => { const w = $('board').clientWidth; if (w !== lastW) { lastW = w; layoutBoard(); } sizeFx(); };
  if (window.ResizeObserver) new ResizeObserver(onResize).observe($('board')); else addEventListener('resize', onResize);
  const X = c => geo.x0 + c * geo.px + geo.tw / 2;     // lane center
  const Y = y => {                                        // y in rows (0 = top edge of row 0); rows can differ in height
    if (y < 0) return geo.tops[0] + y * geo.hs[0];
    const k = Math.floor(y);
    if (k >= E.ROWS) return geo.tops[E.ROWS - 1] + geo.hs[E.ROWS - 1] + (y - E.ROWS) * geo.hs[E.ROWS - 1];
    return geo.tops[k] + (y - k) * geo.hs[k];
  };
  function drawFx(dt) {
    if (!geo || $('play').hidden) return;
    ctx.clearRect(0, 0, geo.w, geo.h);
    const t = performance.now();
    if (phase === 'plan') drawSignals(t);
    if (!run) return;
    if (run.storm) { ctx.fillStyle = `rgba(225,29,72,${0.08 + 0.05 * Math.sin(t / 150)})`; ctx.fillRect(0, 0, geo.w, geo.h); }
    // Antibody shots.
    run.shots.forEach(s => { const f = s.t / 0.35; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5; const x = X(s.c), y = Y(s.from + (s.to - s.from) * f); ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y); ctx.lineTo(x - 4, y - 5); ctx.moveTo(x, y); ctx.lineTo(x + 4, y - 5); ctx.stroke(); });
    // Neutrophils.
    run.neuts.forEach(n => {
      const x = X(n.c), y = Y(n.y), r = Math.max(7, geo.tw * 0.13);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7c3aed'; [-0.4, 0, 0.4].forEach(o => { ctx.beginPath(); ctx.arc(x + o * r, y + Math.abs(o) * r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill(); });
    });
    // Bacteria.
    run.germs.forEach(g => {
      if (!g.alive) return;
      const G = E.GERMS[g.type], x = X(g.c), y = Y(g.y), small = g.type === 'swarmer';
      const len = geo.tw * (small ? 0.3 : 0.42), wid = geo.tw * (small ? 0.07 : 0.1);
      const wob = reduceMotion ? 0 : Math.sin(t / 140 + g.id) * 2;
      if (G.capsule && !(g.tag > 0)) { ctx.fillStyle = 'rgba(14,116,144,.18)'; ctx.strokeStyle = 'rgba(14,116,144,.6)'; ctx.lineWidth = 1.5; roundRect(x - wid - 5, y - len / 2 - 5, wid * 2 + 10, len + 10, wid + 5); ctx.fill(); ctx.stroke(); }
      if (G.toxin) { ctx.fillStyle = G.toxin === 'pertussis' ? 'rgba(147,51,234,.16)' : 'rgba(234,88,12,.16)'; ctx.beginPath(); ctx.arc(x, y, geo.tw * 0.75, 0, Math.PI * 2); ctx.fill(); }
      if (run.quorumOn) { ctx.fillStyle = 'rgba(234,88,12,.25)'; ctx.beginPath(); ctx.arc(x, y, len * 0.9, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - len / 2); ctx.quadraticCurveTo(x + wob * 2, y - len / 2 - 6, x - wob, y - len / 2 - 10); ctx.stroke();
      ctx.fillStyle = g.hit > 0.06 ? '#fef9c3' : (g.tag > 0 ? '#a5b4fc' : G.toxin === 'pertussis' ? '#d8b4fe' : G.toxin === 'cholera' ? '#fdba74' : (small ? '#bef264' : '#84cc16')); ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 1.5;
      roundRect(x - wid, y - len / 2, wid * 2, len, wid); ctx.fill(); ctx.stroke();
      if (g.tag > 0) { ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + wid, y); ctx.lineTo(x + wid + 4, y - 3); ctx.moveTo(x + wid + 4, y - 3); ctx.lineTo(x + wid + 7, y - 6); ctx.moveTo(x + wid + 4, y - 3); ctx.lineTo(x + wid + 7, y); ctx.stroke(); }
      if (g.hp < g.max) { const w = geo.tw * 0.4; ctx.fillStyle = 'rgba(15,23,42,.5)'; ctx.fillRect(x - w / 2, y - len / 2 - 8, w, 3); ctx.fillStyle = '#e11d48'; ctx.fillRect(x - w / 2, y - len / 2 - 8, w * Math.max(0, g.hp / g.max), 3); }
    });
    fxParts.forEach(p => {
      p.t -= dt;
      const x = X(p.x - 0.5), y = Y(p.y);
      if (p.k === 'pop') { ctx.strokeStyle = `rgba(22,163,74,${Math.max(0, p.t * 2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, (0.5 - p.t) * 40 + 4, 0, Math.PI * 2); ctx.stroke(); }
      if (p.k === 'leak') { ctx.fillStyle = `rgba(225,29,72,${Math.max(0, p.t)})`; ctx.fillRect(x - geo.tw / 2, geo.h - 10, geo.tw, 10); }
    });
    fxParts = fxParts.filter(p => p.t > 0);
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  // During planning: draw who signals to whom.
  function drawSignals(t) {
    const cells = allCells(), sig = E.signals(cells);
    cells.forEach((x, i) => {
      const g = sig.gets[i]; if (!g) return;
      Object.keys(g).forEach(k => {
        const S = E.SIGNALS[k];
        if (!sig.on[i] && E.CELLS[x.type].needs !== k) return;
        g[k].forEach(s => {
          const a = cells[s];
          if (S.mode === 'endocrine') { ctx.fillStyle = S.color; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('via blood', X(x.c), Y(x.r) + 12); return; }
          const ax = X(a.c), ay = Y(a.r + 0.5), bx = X(x.c), by = Y(x.r + 0.5);
          ctx.strokeStyle = S.color; ctx.lineWidth = S.mode === 'juxtacrine' ? 4 : 2; ctx.globalAlpha = 0.7; ctx.setLineDash(S.mode === 'juxtacrine' ? [] : [5, 5]);
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
          const f = reduceMotion ? 0.5 : ((t / 1200) + s * 0.2) % 1;
          ctx.fillStyle = S.color; ctx.beginPath(); ctx.arc(ax + (bx - ax) * f, ay + (by - ay) * f, 4, 0, Math.PI * 2); ctx.fill();
        });
      });
    });
  }

  /* ================= Results ================= */
  function finishRun() {
    phase = 'done';
    lastStars = E.stars(run, L, placed);
    const prev = camp.stars[L.id] || 0;
    if (lastStars > prev) camp.stars[L.id] = lastStars;
    if (run.prediction) camp.predictions[L.id] = run.prediction === E.outcome(run);
    camp.layouts[L.id] = placed; save(); report();
    renderAll();
  }
  function renderResult() {
    const s = lastStars, lines = E.explain(run), next = li + 1 < LEVELS.length && unlocked(li + 1) ? li + 1 : -1;
    const P = run.prediction ? PREDICT.find(p => p[0] === run.prediction) : null, right = P && run.prediction === E.outcome(run);
    const conditions = [['Stop the infection', run.won], ['No bacteria reach your tissue', run.won && !run.leaks.length], [E.star3Text(L), s === 3]];
    const order = L.q.opts.map((o, i) => i).sort((a, b) => ((a * 7 + li * 3) % 5) - ((b * 7 + li * 3) % 5));
    $('coach').innerHTML = `<div class="ss-result">
      <div class="ss-res-stars" aria-label="${s} of 3 stars">${[0, 1, 2].map(k => `<i class="${k < s ? 'on' : ''}" style="animation-delay:${k * 0.15}s">${icon('star')}</i>`).join('')}</div>
      <b class="ss-res-title">${s ? (s === 3 ? 'Perfect!' : 'Infection stopped') : 'The infection got through'}</b>
      <ul class="ss-conds">${conditions.map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${icon(ok ? 'check-circle' : 'x')}${esc(t)}</li>`).join('')}</ul>
      ${P ? `<p class="ss-pred ${right ? 'ok' : ''}">${icon(right ? 'check-circle' : 'info')}<span>You predicted: <b>${esc(P[1].toLowerCase())}</b>. ${right ? 'Correct!' : 'Not this time. Look at what happened below and see what your model of the system missed.'}</span></p>` : ''}
      <div class="bd-label">What happened</div>
      <ul class="ss-feed">${lines.slice(0, 4).map(l => `<li class="${l.bad ? 'bad' : ''}">${esc(l.text)}</li>`).join('')}</ul>
      ${isCase(L) ? `<details class="ss-learn"><summary>The biology${icon('chevron-right')}</summary><p>${esc(L.learn)}</p></details>` : ''}
      ${s ? `<div class="ss-check"><div class="bd-label">Quick check</div><p><b>${esc(L.q.q)}</b></p><div class="ss-opts">${order.map(i => `<button class="bd-btn secondary" type="button" data-opt="${i}" id="opt-${i}">${esc(L.q.opts[i])}</button>`).join('')}</div><p class="bd-help" id="why" hidden></p></div>` : ''}
      <div class="bd-actions">${s && next >= 0 ? `<button class="bd-btn lg" type="button" id="nextBtn">${isCase(LEVELS[next]) ? 'Next case' : 'Next level'}${icon('arrow-right')}</button><button class="bd-btn secondary" type="button" id="againBtn">Try again</button>`
        : `<button class="bd-btn lg" type="button" id="againBtn">${s ? 'Try for 3 stars' : 'Change my plan'}</button>${s ? '<button class="bd-btn secondary" type="button" id="campBtn">All levels</button>' : ''}`}</div></div>`;
    $('coach').querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
      const right = +b.dataset.opt === 0;
      $('coach').querySelectorAll('[data-opt]').forEach(x => { x.disabled = true; if (+x.dataset.opt === 0) x.classList.add('right'); });
      if (!right) b.classList.add('wrong');
      $('why').hidden = false; $('why').innerHTML = `<b>${right ? 'Correct.' : 'Not quite.'}</b> ${esc(L.q.why)}`;
    });
    if ($('nextBtn')) $('nextBtn').onclick = () => openLevel(next);
    if ($('againBtn')) $('againBtn').onclick = resetToPlan;
    if ($('campBtn')) $('campBtn').onclick = backToCamp;
  }

  function renderAll() {
    if (!L) return;
    renderBoard(); renderTray(); renderChips(); renderCoach();
    $('runBtn').hidden = phase !== 'plan';
    $('speedBtn').hidden = phase !== 'run';
    $('speedBtn').textContent = speed === 1 ? 'Speed: 1×' : 'Speed: 2×';
    $('runRow').hidden = phase === 'done' || phase === 'predict';
    $('clearBtn').textContent = phase === 'plan' ? 'Clear' : 'Stop';
    $('clearBtn').hidden = phase === 'plan' && !placed.length;
  }

  /* ================= Printing ================= */
  $('printCamp').onclick = () => {
    const row = L => `<tr><td>${esc(numberOf(L))}. ${esc(L.title)}</td><td>${esc(L.topic)}</td><td>${camp.stars[L.id] || 0} of 3</td>${isCase(L) ? `<td>${L.id in camp.predictions ? (camp.predictions[L.id] ? 'Correct' : 'Incorrect') : '–'}</td>` : ''}</tr>`;
    const preds = Object.values(camp.predictions);
    W.print('Signal Siege results', `
      <h2>Boot camp</h2><table><tr><th>Level</th><th>Biology</th><th>Stars</th></tr>${BOOT.map(row).join('')}</table>
      <h2>Cases</h2><table><tr><th>Case</th><th>Biology</th><th>Stars</th><th>Last prediction</th></tr>${CASES.map(row).join('')}</table>
      <p><b>Cases solved:</b> ${CASES.filter(L => camp.stars[L.id]).length} of ${CASES.length}. <b>Correct predictions:</b> ${preds.filter(Boolean).length} of ${preds.length}.</p>
      <h2>Reflection</h2><p><b>Pick one case. Which component of a signal transduction pathway did the toxin (or the infection) affect, and how did that change the cell's response? Use the words reception, transduction and response.</b></p>
      <div class="lines"></div><div class="lines"></div><div class="lines"></div><div class="lines"></div><div class="lines"></div>`);
  };

  renderCamp(); report();
  requestAnimationFrame(loop);
  window.__siege = { E, LEVELS, openLevel, get run() { return run; }, get placed() { return placed; }, camp, finishNow() { while (run && !run.over) { E.step(run); if (run.over) { run.events.length = 0; finishRun(); } else run.events.length = 0; } } };
})();
