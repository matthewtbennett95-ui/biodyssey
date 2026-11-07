/* ==========================================================================
   Signal Siege engine: plan, run, explain. Deterministic (no randomness), so every level is a fair puzzle
   and can be checked by trying every layout. Runs in the browser and in Node (for the level checker).

   The board: COLS lanes x ROWS rows. Bacteria enter at the top and move down their lane toward the
   tissue at the bottom. Your cells sit on squares. Signals decide which cells work:
   - Juxtacrine (contact): reaches cells that share an edge.
   - Paracrine (local): reaches cells within 2 squares (including diagonals).
   - Endocrine (hormone): travels in the blood and reaches every cell with the receptor.
   ========================================================================== */
(function (root) {
  'use strict';
  const COLS = 5, ROWS = 7, DT = 0.05, MAX_T = 90;

  /* ---------- Signals ---------- */
  const SIGNALS = {
    chemokine: { name: 'Chemokine', mode: 'paracrine', range: 2, color: '#65a30d', path: 'Gi',
      receptor: 'G protein-coupled receptor', relay: 'G protein activates a relay of kinases', response: 'Neutrophils leave the blood here' },
    antigen: { name: 'Antigen', mode: 'juxtacrine', color: '#9333ea', path: 'kinase',
      receptor: 'T cell receptor', relay: 'Kinase cascade inside the helper T cell', response: 'The helper T cell switches on' },
    help: { name: 'T cell help', mode: 'juxtacrine', color: '#db2777', path: 'kinase',
      receptor: 'CD40 receptor', relay: 'Relay proteins switch on new genes', response: 'The B cell makes antibodies' },
    epinephrine: { name: 'Epinephrine', mode: 'endocrine', color: '#ea580c', path: 'Gs',
      receptor: 'G protein-coupled receptor', relay: 'Second messenger (cAMP) amplifies the signal', response: 'Twice as many neutrophils released' },
    il10: { name: 'IL-10', mode: 'paracrine', range: 2, color: '#0284c7', path: 'kinase',
      receptor: 'IL-10 receptor', relay: 'Kinases switch on calming genes', response: 'This cell causes much less inflammation' }
  };
  const PATHS = {
    Gi: 'G protein (Gi)', Gs: 'G protein (Gs)', kinase: 'Kinase cascade'
  };

  /* ---------- Your cells ---------- */
  const CELLS = {
    macrophage: { name: 'Macrophage', cost: 50, hp: 320, dps: 26, reach: 0, emits: 'chemokine',
      job: 'Engulfs bacteria that reach it in its lane (phagocytosis). Sends chemokine to cells within 2 squares.' },
    capillary: { name: 'Capillary', cost: 40, hp: 220, needs: 'chemokine', boost: 'epinephrine',
      job: 'A small blood vessel. When chemokine reaches it, neutrophils leave the blood and charge up its lane.' },
    dendritic: { name: 'Dendritic cell', cost: 30, hp: 140, emits: 'antigen',
      job: 'Shows pieces of bacteria (antigen) to cells it touches.' },
    helperT: { name: 'Helper T cell', cost: 40, hp: 160, needs: 'antigen', emits: 'help',
      job: 'Switches on when a dendritic cell touches it. Then it switches on B cells it touches.' },
    bcell: { name: 'B cell', cost: 40, hp: 160, needs: 'help',
      job: 'Once a helper T cell touches it, it fires antibodies up its lane. Tagged bacteria are easier to destroy.' },
    adrenal: { name: 'Adrenal gland', cost: 60, hp: 260, emits: 'epinephrine',
      job: 'Releases epinephrine into the blood. It reaches every capillary on the board.' },
    treg: { name: 'Regulatory T cell', cost: 40, hp: 160, emits: 'il10',
      job: 'Releases IL-10, which calms inflammation in cells within 2 squares.' },
    wall: { name: 'Epithelial cell', cost: 10, hp: 420,
      job: 'A tough barrier cell. Bacteria have to chew through it.' }
  };
  const NEUTROPHIL = { hp: 45, dps: 32, speed: 2.4, life: 7, every: 3 };

  /* ---------- Bacteria ---------- */
  const GERMS = {
    bacterium: { name: 'Bacterium', hp: 60, speed: 0.55, dps: 16 },
    swarmer: { name: 'Fast bacterium', hp: 26, speed: 1.15, dps: 10 },
    capsule: { name: 'Encapsulated bacterium', hp: 95, speed: 0.5, dps: 16, capsule: true },
    pertussis: { name: 'Pertussis-toxin bacterium', hp: 70, speed: 0.5, dps: 14, toxin: 'pertussis' },
    cholera: { name: 'Cholera-toxin bacterium', hp: 70, speed: 0.5, dps: 14, toxin: 'cholera' }
  };

  /* ---------- Signals on a layout ---------- */
  function adjacent(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1; }
  function near(a, b, r) { return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)) <= r; }
  // For each cell: which signals reach it, from which cells, and whether it works.
  function signals(cells) {
    const n = cells.length, alive = cells.map(x => x.hp == null || x.hp > 0);
    const on = cells.map((x, i) => alive[i] && !CELLS[x.type].needs);
    let gets = [];
    for (let pass = 0; pass < 4; pass++) {
      gets = cells.map(() => ({}));
      for (let s = 0; s < n; s++) {
        const D = CELLS[cells[s].type];
        if (!D.emits || !on[s]) continue;
        const sig = SIGNALS[D.emits];
        for (let r = 0; r < n; r++) {
          if (r === s || !alive[r]) continue;
          const ok = sig.mode === 'endocrine' || (sig.mode === 'juxtacrine' ? adjacent(cells[s], cells[r]) : near(cells[s], cells[r], sig.range));
          if (ok && cells[r].blocked && sig.path === 'Gi') continue;   // pertussis toxin: Gi can't relay the signal
          if (ok) (gets[r][D.emits] = gets[r][D.emits] || []).push(s);
        }
      }
      for (let i = 0; i < n; i++) { const D = CELLS[cells[i].type]; if (D.needs) on[i] = alive[i] && (!!gets[i][D.needs] || !!cells[i].locked); }
    }
    return { on, gets };
  }
  function why(cells, i, sig) {
    const D = CELLS[cells[i].type];
    if (!D.needs || sig.on[i]) return '';
    if (cells[i].blocked && SIGNALS[D.needs].path === 'Gi') return 'Pertussis toxin blocked its G protein (Gi). Chemokine still binds the receptor, but the signal can\'t be relayed inside the cell.';
    const S = SIGNALS[D.needs];
    if (S.mode === 'juxtacrine') return `Needs ${S.name.toLowerCase()} by contact: it must share an edge with a cell that sends it.`;
    if (S.mode === 'paracrine') return `Needs ${S.name.toLowerCase()}: it must be within ${S.range} squares of a cell that sends it.`;
    return `Needs ${S.name.toLowerCase()}.`;
  }

  /* ---------- A run ---------- */
  function createRun(level, placed) {
    const cells = (level.fixed || []).map(f => ({ type: f[0], c: f[1], r: f[2], fixed: true })).concat(placed.map(p => ({ type: p[0], c: p[1], r: p[2] })));
    cells.forEach(x => { x.hp = CELLS[x.type].hp; x.max = x.hp; x.cd = 0; x.dmgDone = 0; });
    const R = { level, cells, t: 0, germs: [], neuts: [], shots: [], tissue: level.tissue || 3, leaks: [], over: false, won: false,
      infl: 0, storm: false, stormTime: 0, quorumOn: false, quorumTime: 0, events: [], spawned: 0, nextId: 0,
      stats: { killed: 0, tagged: 0, neutrophils: 0, lostCells: [], capsuleHits: 0, phagoHits: 0, blocked: 0, locked: 0 } };
    R.waves = level.waves.map(w => ({ t: w[0], c: w[1], type: w[2] || 'bacterium' })).sort((a, b) => a.t - b.t);
    R.sig = signals(cells);
    R.startOn = R.sig.on.slice();
    return R;
  }
  const mid = x => ({ x: x.c + 0.5, y: x.r + 0.5 });

  function damageGerm(R, g, dmg, by) {
    const G = GERMS[g.type];
    let m = 1;
    if (g.tag > 0) m *= 2;
    if (G.capsule && !(g.tag > 0) && (by === 'macrophage' || by === 'neutrophil')) { m *= 0.15; R.stats.capsuleHits++; }
    g.hp -= dmg * m; g.hit = 0.12;
    if (by === 'macrophage' || by === 'neutrophil') R.stats.phagoHits++;
    if (g.hp <= 0 && g.alive) { g.alive = false; R.stats.killed++; R.events.push({ k: 'kill', x: g.c + 0.5, y: g.y, by }); }
    return dmg * m;
  }
  function addInflammation(R, cell, amount) {
    if (!R.level.storm) return;
    const calm = cell && R.sig.gets[R.cells.indexOf(cell)] && R.sig.gets[R.cells.indexOf(cell)].il10;
    R.infl += amount * (calm ? 0.25 : 1);
  }

  function step(R) {
    if (R.over) return;
    const dt = DT, L = R.level;
    R.t += dt;
    // New bacteria arrive at the top of their lane.
    while (R.spawned < R.waves.length && R.waves[R.spawned].t <= R.t) {
      const w = R.waves[R.spawned++], G = GERMS[w.type];
      R.germs.push({ id: R.nextId++, type: w.type, c: w.c, y: -0.4, hp: G.hp, max: G.hp, alive: true, tag: 0, hit: 0 });
    }
    const germs = R.germs.filter(g => g.alive);
    // Quorum sensing: once enough bacteria are on the board together, they all switch on their toxins.
    if (L.quorum) {
      const was = R.quorumOn;
      R.quorumOn = germs.length >= L.quorum;
      if (R.quorumOn) R.quorumTime += dt;
      if (R.quorumOn && !was) R.events.push({ k: 'quorum' });
    }
    const toxic = R.quorumOn ? 3 : 1;
    // Toxins: cells within 1 square of a toxin bacterium are hit for the rest of the run.
    for (const g of germs) {
      const T = GERMS[g.type].toxin; if (!T || g.y < 0) continue;
      R.cells.forEach((x, i) => {
        if (x.hp <= 0 || x[T === 'pertussis' ? 'blocked' : 'locked']) return;
        if (Math.max(Math.abs(x.c - g.c), Math.abs(x.r + 0.5 - g.y)) > 1.5) return;
        if (T === 'pertussis' && !(CELLS[x.type].needs && SIGNALS[CELLS[x.type].needs].path === 'Gi')) return;
        if (T === 'cholera' && !CELLS[x.type].boost) return;   // only cells with a Gs pathway (epinephrine receptor)
        x[T === 'pertussis' ? 'blocked' : 'locked'] = true;
        R.stats[T === 'pertussis' ? 'blocked' : 'locked']++;
        R.events.push({ k: T === 'pertussis' ? 'blocked' : 'locked', i, type: x.type });
        R.sig = signals(R.cells);
      });
    }

    // Bacteria move down, or stop and attack what's in their way.
    for (const g of germs) {
      const G = GERMS[g.type];
      if (g.tag > 0) g.tag -= dt;
      if (g.hit > 0) g.hit -= dt;
      const blockN = R.neuts.find(n => n.alive && n.c === g.c && Math.abs(n.y - g.y) < 0.45);
      const blockC = R.cells.find(x => x.hp > 0 && x.c === g.c && g.y + 0.35 >= x.r && g.y < x.r + 0.9);
      if (blockN) { blockN.hp -= G.dps * toxic * dt; if (blockN.hp <= 0) blockN.alive = false; continue; }
      if (blockC) {
        blockC.hp -= G.dps * toxic * dt; blockC.hit = 0.12;
        if (blockC.hp <= 0) {
          blockC.hp = 0; R.stats.lostCells.push(blockC.type); R.events.push({ k: 'lost', type: blockC.type, c: blockC.c, r: blockC.r });
          const before = R.sig.on.slice(); R.sig = signals(R.cells);
          R.sig.on.forEach((v, i) => { if (before[i] && !v) R.events.push({ k: 'switchedOff', i, type: R.cells[i].type }); });
        }
        continue;
      }
      g.y += G.speed * (R.quorumOn ? 1.35 : 1) * dt;
      if (g.y >= ROWS) { g.alive = false; R.tissue--; R.leaks.push(g.c); R.events.push({ k: 'leak', c: g.c, type: g.type }); }
    }

    // Your cells act.
    R.cells.forEach((x, i) => {
      if (x.hp <= 0) return;
      if (x.hit > 0) x.hit -= dt;
      const D = CELLS[x.type], on = R.sig.on[i];
      if (R.storm) { x.hp -= 16 * dt; x.hit = 0.12; if (x.hp <= 0) { x.hp = 0; R.stats.lostCells.push(x.type); R.events.push({ k: 'lost', type: x.type, c: x.c, r: x.r, storm: true }); R.sig = signals(R.cells); return; } }
      if (x.type === 'macrophage') {
        let best = null, bd = 9;
        for (const g of R.germs) if (g.alive && Math.abs(g.c - x.c) <= D.reach && Math.abs(g.y - (x.r + 0.5)) <= 1.25) { const d = Math.abs(g.y - (x.r + 0.5)) + Math.abs(g.c - x.c); if (d < bd) { bd = d; best = g; } }
        x.target = best ? best.id : null;
        if (best) { const done = damageGerm(R, best, D.dps * dt, 'macrophage'); addInflammation(R, x, done * 0.22); }
      }
      if (x.type === 'capillary' && on && R.spawned > 0) {
        const epi = R.sig.gets[i] && R.sig.gets[i].epinephrine;
        x.cd -= dt;
        if (x.cd <= 0) {
          x.cd = NEUTROPHIL.every / (x.locked ? 3 : epi ? 2 : 1);
          R.neuts.push({ c: x.c, y: x.r + 0.3, hp: NEUTROPHIL.hp, age: 0, alive: true, from: i });
          R.stats.neutrophils++;
        }
      }
      if (x.type === 'bcell' && on) {
        x.cd -= dt;
        if (x.cd <= 0) {
          const g = R.germs.filter(g => g.alive && g.c === x.c && g.y < x.r + 0.5 && !(g.tag > 0)).sort((a, b) => b.y - a.y)[0];
          if (g) { x.cd = 1.6; g.tag = 12; R.stats.tagged++; R.shots.push({ c: x.c, from: x.r + 0.3, to: g.y, t: 0 }); }
        }
      }
    });

    // Neutrophils charge up their lane and fight the first bacterium they meet.
    for (const n of R.neuts) {
      if (!n.alive) continue;
      n.age += dt;
      if (n.age > NEUTROPHIL.life) { n.alive = false; continue; }
      const g = R.germs.find(g => g.alive && g.c === n.c && Math.abs(g.y - n.y) < 0.45);
      if (g) { const done = damageGerm(R, g, NEUTROPHIL.dps * dt, 'neutrophil'); addInflammation(R, R.cells[n.from], done * 0.22); }
      else n.y -= NEUTROPHIL.speed * dt;
      if (n.y < -0.6) n.alive = false;
    }
    R.neuts = R.neuts.filter(n => n.alive);
    R.shots.forEach(s => s.t += dt); R.shots = R.shots.filter(s => s.t < 0.35);

    // Inflammation: it feeds on itself (positive feedback) and drains slowly.
    if (L.storm) {
      R.infl = Math.min(150, Math.max(0, R.infl * (1 + 0.012 * dt * 20 * (R.infl / 100)) - 2.5 * dt));
      if (!R.storm && R.infl >= (L.stormAt || 100)) { R.storm = true; R.events.push({ k: 'storm' }); }
      if (R.storm && R.infl < (L.stormAt || 100) * 0.55) { R.storm = false; R.events.push({ k: 'calm' }); }
      if (R.storm) R.stormTime += dt;
      R.peak = Math.max(R.peak || 0, R.infl);
    }

    // The end.
    if (R.tissue <= 0) finish(R, false);
    else if (R.spawned >= R.waves.length && !R.germs.some(g => g.alive)) finish(R, true);
    else if (R.t > MAX_T) finish(R, false);
  }
  function finish(R, won) { R.over = true; R.won = won; R.events.push({ k: 'end', won }); }

  function cost(level, placed) { return placed.reduce((s, p) => s + CELLS[p[0]].cost, 0); }
  function stars(R, level, placed) {
    if (!R.won) return 0;
    let s = 1;
    if (!R.leaks.length) s++;
    if (s === 2) {
      // The third star is the level's lesson: spend wisely, or keep quorum or storm from ever happening.
      if (level.star3 === 'noQuorum') { if (!R.quorumTime) s++; }
      else if (level.star3 === 'noStorm') { if (!R.stormTime) s++; }
      else if (level.star3 === 'noToxin') { if (!R.stats.blocked && !R.stats.locked) s++; }
      else if (cost(level, placed) <= level.par) s++;
    }
    return s;
  }
  function simulate(level, placed) {
    const R = createRun(level, placed);
    while (!R.over) { step(R); R.events.length = 0; }
    return R;
  }

  /* ---------- What happened, in plain biology ---------- */
  function explain(R) {
    const out = [], L = R.level, cells = R.cells;
    if (R.stats.blocked) out.push({ bad: true, text: `Pertussis toxin blocked the Gi G protein in ${R.stats.blocked} of your cells. Chemokine still reached their receptors, but transduction failed, so there was no response.` });
    if (R.stats.locked) out.push({ bad: true, text: `Cholera toxin locked the Gs G protein "on" in ${R.stats.locked} capillar${R.stats.locked > 1 ? 'ies' : 'y'}. They kept releasing neutrophils with no signal, and inflammation soared.` });
    const total = R.waves.length;
    if (R.won && !R.leaks.length) out.push({ text: `Your cells destroyed all ${total} bacteria before they reached your tissue.` });
    cells.forEach((x, i) => {
      if (CELLS[x.type].needs && !R.startOn[i]) out.push({ bad: true, text: `Your ${CELLS[x.type].name.toLowerCase()} never switched on. ${why(cells, i, { on: R.startOn })}` });
    });
    const lanes = [...new Set(R.leaks)];
    lanes.forEach(c => out.push({ bad: true, text: `Bacteria got through lane ${c + 1}. Nothing there stopped them in time.` }));
    if (R.stats.neutrophils) out.push({ text: `Chemokine reached your capillaries, so ${R.stats.neutrophils} neutrophils left the blood to fight. That's paracrine signaling.` });
    if (R.stats.tagged) out.push({ text: `Your B cells tagged ${R.stats.tagged} bacteria with antibodies, so they took double damage.` });
    if (R.stats.capsuleHits > 40 && R.stats.tagged < 3) out.push({ bad: true, text: 'Capsules made the bacteria too slippery to engulf. Antibodies would have tagged them first.' });
    if (L.quorum && R.quorumTime > 0) out.push({ bad: true, text: `${L.quorum} or more bacteria gathered on the board, so quorum sensing switched on their toxins. Stop them sooner.` });
    else if (L.quorum) out.push({ text: `You never let ${L.quorum} bacteria build up, so they never reached a quorum and stayed weak.` });
    if (L.storm && R.stormTime > 0) out.push({ bad: true, text: `A cytokine storm lasted ${Math.round(R.stormTime)} seconds and damaged your own cells. IL-10 from regulatory T cells calms it.` });
    else if (L.storm) out.push({ text: 'Inflammation stayed under control, so there was no cytokine storm.' });
    if (R.events && R.stats.lostCells.length && !R.won) out.push({ bad: true, text: `You lost: ${[...new Set(R.stats.lostCells)].map(t => CELLS[t].name.toLowerCase()).join(', ')}. A lost cell stops sending its signals too.` });
    return out;
  }

    function star3Text(level) {
    if (level.star3 === 'noQuorum') return `Never let ${level.quorum} bacteria gather`;
    if (level.star3 === 'noStorm') return 'No cytokine storm';
    if (level.star3 === 'noToxin') return 'Keep the toxin away from every cell it can break';
    return `Spend ${level.par} ATP or less`;
  }
  // What actually happened, in the same words as the prediction choices.
  function outcome(R) { return !R.won ? 'lose' : R.leaks.length ? 'leak' : 'clean'; }
  const API = { outcome, PATHS, star3Text, COLS, ROWS, DT, SIGNALS, CELLS, GERMS, NEUTROPHIL, signals, why, createRun, step, simulate, stars, cost, explain, adjacent, near };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SiegeEngine = API;
})(typeof window !== 'undefined' ? window : globalThis);
