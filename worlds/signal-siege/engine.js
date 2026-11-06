/* ==========================================================================
   Signal Siege engine: the rules, with no drawing. Runs in the browser and in Node (for balance simulations).
   Biology in the rules:
   - Quorum sensing (AP Bio 4.1): toxin colonies only fire while they RECEIVE autoinducer from a quorum hub.
     The hub's signal reaches farther over time (autoinduction is positive feedback). Destroying a hub
     silences every colony that depended on it.
   - Opsonization: antibodies tag bacteria so phagocytes destroy them faster; capsules resist phagocytes
     unless tagged.
   - Inflammation: fighting raises it, and it rises faster the higher it gets (positive feedback). Past the
     threshold, a cytokine storm damages your own cells. IL-10 from regulatory T cells is negative feedback.
   - In your lymph node, cells only work when they receive the signal they need: juxtacrine (touching),
     paracrine (nearby) or endocrine (everywhere, through the blood).
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------------- Your immune cells (troops) ---------------- */
  const UNITS = {
    neutrophil: { name: 'Neutrophil', short: 'Neutrophil', housing: 1, cost: 6, hp: 44, dps: 11, speed: 2.3, range: 0.65, prefer: 'any', life: 32, phago: true,
      about: 'Fast and cheap. Rushes the nearest target. Short-lived: it dies after about 30 seconds.' },
    macrophage: { name: 'Macrophage', short: 'Macrophage', housing: 4, cost: 30, hp: 360, dps: 17, speed: 1.15, range: 0.85, prefer: 'defense', phago: true,
      about: 'Slow and tough. Heads for toxin colonies first and soaks up their fire.' },
    killerT: { name: 'Killer T cell', short: 'Killer T', housing: 3, cost: 40, hp: 170, dps: 34, speed: 1.7, range: 0.75, prefer: 'infected', phago: false,
      about: 'Destroys virus-infected cells. Trained only when helper T cells activate your killer T barracks.' }
  };
  const UNIT_ORDER = ['neutrophil', 'macrophage', 'killerT'];

  /* ---------------- Signals you can send in a raid (spells) ---------------- */
  const SPELLS = {
    chemokine: { name: 'Chemokine', radius: 2.6, dur: 10, about: 'Calls immune cells to a spot. Your cells inside move 50% faster and hit 35% harder for 10 seconds.' },
    antibody: { name: 'Antibodies', radius: 2.6, dur: 16, about: 'Tags (opsonizes) bacteria. Tagged targets take 60% more damage from phagocytes, and capsules stop protecting them.' }
  };

  /* ---------------- Pathogen structures in an infection site ---------------- */
  const STRUCTS = {
    hub: { name: 'Quorum hub', size: 2, hp: 1000, kind: 'core', signal: 5, grow: 0.04, maxSignal: 7,
      about: 'A dense cluster of bacteria releasing autoinducer. Colonies within its signal turn on their toxin genes.' },
    spitter: { name: 'Toxin colony', size: 2, hp: 340, kind: 'defense', dps: 30, range: 3.9, quorum: true,
      about: 'Fires toxin at the nearest immune cell, but only while it receives autoinducer from a quorum hub.' },
    burst: { name: 'Toxin burst colony', size: 2, hp: 440, kind: 'defense', dmg: 56, every: 2.6, splash: 1.35, range: 5, minRange: 1.6, quorum: true,
      about: 'Lobs toxin that splashes a small area. Deadly to crowds of neutrophils. Needs autoinducer too.' },
    wall: { name: 'Biofilm', size: 1, hp: 200, kind: 'wall',
      about: 'A slimy matrix bacteria build to shield themselves. Cells must break through or go around.' },
    cache: { name: 'Glucose cache', size: 2, hp: 280, kind: 'loot',
      about: 'Bacteria hoarding sugar. Destroying it recovers ATP for your lymph node.' },
    cluster: { name: 'Bacteria', size: 1, hp: 120, kind: 'plain', about: 'A small group of bacteria.' },
    capsule: { name: 'Encapsulated colony', size: 2, hp: 330, kind: 'plain', capsule: true,
      about: 'A slippery capsule keeps phagocytes from grabbing these bacteria, unless antibodies tag them first.' },
    infected: { name: 'Infected cell', size: 2, hp: 400, kind: 'plain', infected: true,
      about: 'One of the body\'s own cells, full of virus. Phagocytes barely hurt it. Killer T cells destroy it.' }
  };

  /* ---------------- Infection sites (the campaign) ---------------- */
  // Maps are 18 x 18. Letters: H hub, T toxin colony, X toxin burst, w biofilm, G glucose cache, b bacteria,
  // C encapsulated colony, I infected cell. Size-2 structures are drawn as 2x2 blocks of the same letter.
  const SITES = [
    { id: 'splinter', name: 'Splinter', place: 'A splinter in the finger', loot: 140, hpMult: 0.7, tip: 'Destroy the quorum hub and its toxin colony goes quiet.', map: [
      '..................', '..................', '..................', '..................', '..................',
      '.......GG.........', '.......GG..b......', '....b.............', '.....HH....TT.....', '.....HH....TT.....',
      '..........b.......', '.......b..........', '..........GG......', '..........GG......', '..................',
      '..................', '..................', '..................'] },
    { id: 'knee', name: 'Scraped knee', place: 'Broken skin on a knee', loot: 220, tip: 'Biofilm walls slow your cells down. Neutrophils will chew through or find a gap.', map: [
      '..................', '..................', '..................', '....b.....b.......', '.....wwwwwww......',
      '.....w.....w......', '.TT..w.HH..w..GG..', '.TT..w.HH..w..GG..', '.....w.....w......', '.....ww.www.......',
      '..........b.TT....', '...GG.......TT....', '...GG.............', '........b.........', '..................',
      '..................', '..................', '..................'] },
    { id: 'throat', name: 'Strep throat', place: 'An infected throat', loot: 300, hpMult: 0.7, tip: 'Two quorum hubs. Each one keeps the colonies near it firing.', map: [
      '..................', '..................', '..HH....TT........', '..HH....TT...b....', '.........ww.......',
      '..TT...GG.ww......', '..TT...GG.........', '..........b.......', '....b.............', '........b.........',
      '.........GG.......', '.......w.GG....b..', '......w...........', '.....w.....TT..HH.', '...........TT..HH.',
      '..................', '..................', '..................'] },
    { id: 'sinus', name: 'Sinus infection', place: 'The sinuses', loot: 360, hpMult: 0.8, tip: 'Burst colonies splash crowds. Send macrophages in front to take the hits.', map: [
      '..................', '..................', '..........b.......', '...GG.............', '...GG....XX.......',
      '.........XX..TT...', '.............TT...', '..b...wwwwww......', '......w.HH.w..b...', '......w.HH.w......',
      '......wwwwww......', '..TT..............', '..TT.....XX....GG.', '.........XX....GG.', '.....b............',
      '..........b.......', '..................', '..................'] },
    { id: 'pneumonia', name: 'Pneumonia', place: 'The lungs', loot: 420, tip: 'Capsules make these bacteria slippery. Tag them with antibodies first.', map: [
      '..................', '..................', '...CC.....CC......', '...CC.....CC......', '..........b.......',
      '.....TT.HH....GG..', '.....TT.HH....GG..', '..b...............', '.......CC..XX.....', '.......CC..XX.....',
      '..GG..........CC..', '..GG.....b....CC..', '........TT........', '........TT...b....', '...CC.............',
      '...CC.............', '..................', '..................'] },
    { id: 'flu', name: 'Flu, then bacteria', place: 'An airway after the flu', loot: 480, tip: 'Infected cells need killer T cells. A flu infection often lets bacteria move in.', map: [
      '..................', '..II......II......', '..II......II......', '.......b..........', '....TT.....GG.....',
      '....TT.....GG.....', '..........ww......', '.II..ww.HH.ww..II.', '.II..ww.HH.ww..II.', '..........ww......',
      '.....XX...........', '.....XX....TT..b..', '...........TT.....', '..GG..............', '..GG.....II.......',
      '.........II.......', '..................', '..................'] },
    { id: 'wound', name: 'Wound biofilm', place: 'A chronic wound', loot: 560, tip: 'A biofilm fortress. Find the weak side, or break the wall where it counts.', map: [
      '..................', '..................', '...wwwwwwwwwwww...', '...w..........w...', '...w.TT..XX...w...',
      '...w.TT..XX...w...', '...w....HH....w...', '...w.CC.HH.TT.w...', '...w.CC....TT.w...', '...w..GG......w...',
      '...w..GG..CC..w...', '...w......CC..w...', '...wwwwww.wwwww...', '..................', '..b....TT.....b...',
      '.......TT.........', '..................', '..................'] },
    { id: 'sepsis', name: 'Sepsis', place: 'The bloodstream', loot: 700, storm: 78, tip: 'In sepsis the body\'s own response does the most harm. Watch inflammation closely.', map: [
      '..................', '.HH....XX....TT...', '.HH....XX....TT...', '...........w......', '..TT..CC...w..GG..',
      '..TT..CC...w..GG..', '......wwwwww......', '.II...w.HH.w...XX.', '.II...w.HH.w...XX.', '......wwwwww......',
      '..GG.....CC.......', '..GG.....CC.....II', '.............TT.II', '..XX.........TT...', '..XX...b...HH.....',
      '...........HH.....', '..................', '..................'] }
  ];

  /* ---------------- Your lymph node (the base) ---------------- */
  // needs: the signal a building must receive to work. emits/mode/range: the signal it sends.
  const BUILDINGS = {
    node: { name: 'Lymph node', size: 3, cost: 0, kind: 'core', about: 'Your command center. Upgrade it to unlock more cells.' },
    respiring: { name: 'Respiring cell', size: 2, cost: 60, kind: 'economy', needs: 'GF', produces: 24,
      about: 'Makes ATP for your lymph node, but only while growth factor reaches its receptors.' },
    fibroblast: { name: 'Fibroblast', size: 2, cost: 70, kind: 'signal', emits: 'GF', mode: 'paracrine', range: 2,
      about: 'Secretes growth factor, a paracrine signal. Cells within 2 tiles that need it switch on.' },
    adipocyte: { name: 'Adipocyte', size: 2, cost: 80, kind: 'economy', storage: 600, about: 'Stores energy. Raises how much ATP you can hold.' },
    marrow: { name: 'Bone marrow', size: 3, cost: 0, kind: 'army', about: 'Makes neutrophils and macrophages. Train your army here.' },
    capillary: { name: 'Capillary', size: 2, cost: 120, kind: 'army', capacity: 10, about: 'Blood vessels carry your army to the infection. Each adds 10 army space.' },
    macrophagePost: { name: 'Macrophage post', size: 2, cost: 100, kind: 'signal', spell: 'chemokine',
      about: 'Resident macrophages release chemokine. Each post gives you one Chemokine signal per raid.' },
    dendritic: { name: 'Dendritic cell', size: 1, cost: 80, kind: 'signal', emits: 'ANTIGEN', mode: 'juxtacrine',
      about: 'Presents antigen to cells it touches. Contact (juxtacrine) signaling only.' },
    helperT: { name: 'Helper T cell', size: 2, cost: 120, kind: 'signal', needs: 'ANTIGEN', emits: 'HELP', mode: 'juxtacrine',
      about: 'Switches on when a dendritic cell touches it. Then it activates B cells and killer T cells that it touches.' },
    bcell: { name: 'B cell', size: 2, cost: 140, kind: 'signal', needs: 'HELP', spell: 'antibody',
      about: 'Makes antibodies once a helper T cell touches it. Each active B cell gives one Antibodies signal per raid.' },
    killerBarracks: { name: 'Killer T barracks', size: 2, cost: 160, kind: 'army', needs: 'HELP', unlocks: 'killerT',
      about: 'Trains killer T cells, but only while an active helper T cell touches it.' },
    islet: { name: 'Pancreatic islet', size: 2, cost: 200, kind: 'signal', emits: 'INSULIN', mode: 'endocrine',
      about: 'Releases insulin into the blood (endocrine). Every respiring cell makes 50% more ATP.' },
    treg: { name: 'Regulatory T cell', size: 1, cost: 120, kind: 'signal', il10: true,
      about: 'Releases IL-10, which calms inflammation (negative feedback). Each one slows inflammation in raids by 30%.' }
  };
  const SIGNALS = {
    GF: { name: 'Growth factor', mode: 'paracrine' },
    ANTIGEN: { name: 'Antigen contact', mode: 'juxtacrine' },
    HELP: { name: 'T cell help', mode: 'juxtacrine' },
    INSULIN: { name: 'Insulin', mode: 'endocrine' }
  };
  // How many of each building a lymph node level allows.
  const LIMITS = {
    1: { node: 1, marrow: 1, respiring: 3, fibroblast: 2, adipocyte: 1, capillary: 2, macrophagePost: 1, dendritic: 1, helperT: 1, bcell: 1 },
    2: { node: 1, marrow: 1, respiring: 4, fibroblast: 2, adipocyte: 2, capillary: 3, macrophagePost: 2, dendritic: 1, helperT: 1, bcell: 2, killerBarracks: 1, islet: 1, treg: 1 },
    3: { node: 1, marrow: 1, respiring: 5, fibroblast: 3, adipocyte: 3, capillary: 4, macrophagePost: 2, dendritic: 2, helperT: 2, bcell: 2, killerBarracks: 1, islet: 1, treg: 2 }
  };
  const NODE_UPGRADE = { 2: 400, 3: 900 };
  const starBonus = siteIndex => 30 * (siteIndex + 1);   // ATP for each star earned for the first time   // ATP to reach each level
  const BASE_SIZE = 14;
  const START_ATP = 300;
  const STORAGE_BASE = 900;
  const RAID_SECONDS = 120;

  function starterBase() {
    return { v: 1, level: 1, atp: START_ATP, army: { neutrophil: 0, macrophage: 0, killerT: 0 }, sites: {}, at: Date.now(),
      cells: [['node', 5, 5], ['marrow', 1, 1], ['capillary', 10, 1], ['fibroblast', 2, 6], ['respiring', 2, 9], ['macrophagePost', 10, 10]] };
  }

  /* Which buildings are working, and what the base provides. */
  function footprint(c) { const b = BUILDINGS[c[0]]; return { x0: c[1], y0: c[2], x1: c[1] + b.size, y1: c[2] + b.size }; }
  function gap(a, b) {   // tiles of empty space between two footprints (0 = touching)
    const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
    return Math.max(dx, dy);
  }
  function computeBase(base) {
    const cells = base.cells, n = cells.length, fp = cells.map(footprint);
    const on = cells.map(c => !BUILDINGS[c[0]].needs);
    const why = cells.map(() => '');
    const gets = cells.map(() => ({}));
    // Signals can chain (dendritic → helper T → B cell), so settle in a few passes.
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < n; i++) gets[i] = {};
      for (let s = 0; s < n; s++) {
        const B = BUILDINGS[cells[s][0]];
        if (!B.emits || !on[s]) continue;
        for (let r = 0; r < n; r++) {
          if (r === s) continue;
          const reach = B.mode === 'endocrine' ? true : B.mode === 'juxtacrine' ? gap(fp[s], fp[r]) === 0 : gap(fp[s], fp[r]) <= B.range;
          if (reach) (gets[r][B.emits] = gets[r][B.emits] || []).push(s);
        }
      }
      for (let i = 0; i < n; i++) {
        const B = BUILDINGS[cells[i][0]];
        if (B.needs) on[i] = !!gets[i][B.needs];
      }
    }
    for (let i = 0; i < n; i++) {
      const B = BUILDINGS[cells[i][0]];
      if (B.needs && !on[i]) {
        const sig = SIGNALS[B.needs];
        why[i] = sig.mode === 'juxtacrine' ? `Needs ${sig.name.toLowerCase()}: it must touch a cell that sends it.`
          : `Needs ${sig.name.toLowerCase()}: move it within ${BUILDINGS.fibroblast.range} tiles of a fibroblast.`;
      }
    }
    const count = t => cells.filter((c, i) => c[0] === t && on[i]).length;
    const insulin = cells.some((c, i) => c[0] === 'islet' && on[i]);
    const out = {
      on, why, gets, insulin,
      production: cells.reduce((s, c, i) => s + (on[i] && BUILDINGS[c[0]].produces ? BUILDINGS[c[0]].produces * (insulin ? 1.5 : 1) : 0), 0),
      storage: STORAGE_BASE + cells.reduce((s, c) => s + (BUILDINGS[c[0]].storage || 0), 0),
      capacity: cells.reduce((s, c) => s + (BUILDINGS[c[0]].capacity || 0), 0),
      spells: { chemokine: count('macrophagePost'), antibody: count('bcell') },
      il10: Math.min(2, count('treg')),
      killerT: count('killerBarracks') > 0
    };
    return out;
  }
  function housingUsed(army) { return UNIT_ORDER.reduce((s, t) => s + (army[t] || 0) * UNITS[t].housing, 0); }
  function fits(base, type, x, y, ignore) {
    const b = BUILDINGS[type];
    if (x < 0 || y < 0 || x + b.size > BASE_SIZE || y + b.size > BASE_SIZE) return false;
    const me = { x0: x, y0: y, x1: x + b.size, y1: y + b.size };
    return base.cells.every((c, i) => {
      if (i === ignore) return true;
      const o = footprint(c);
      return me.x1 <= o.x0 || o.x1 <= me.x0 || me.y1 <= o.y0 || o.y1 <= me.y0;
    });
  }

  /* ---------------- Raids ---------------- */
  const N = 18;
  function parseSite(site) {
    const map = site.map, used = {}, out = [];
    const code = { H: 'hub', T: 'spitter', X: 'burst', w: 'wall', G: 'cache', b: 'cluster', C: 'capsule', I: 'infected' };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const ch = map[y][x];
      if (!code[ch] || used[x + ',' + y]) continue;
      const type = code[ch], s = STRUCTS[type].size;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) used[(x + dx) + ',' + (y + dy)] = true;
      out.push([type, x, y]);
    }
    return out;
  }

  function createRaid(siteIndex, opts) {
    opts = opts || {};
    const site = SITES[siteIndex];
    const level = opts.level || 1;
    const S = {
      site, siteIndex, time: 0, left: RAID_SECONDS, over: false, endReason: '',
      level, mult: 1 + 0.18 * (level - 1),
      army: Object.assign({ neutrophil: 0, macrophage: 0, killerT: 0 }, opts.army || {}),
      spells: Object.assign({ chemokine: 0, antibody: 0 }, opts.spells || {}),
      il10: opts.il10 || 0, stormAt: site.storm || 100,
      structs: [], units: [], zones: [], shots: [], events: [],
      infl: 0, storm: false, stormTime: 0, deployed: 0, firstDeploy: false,
      grid: new Array(N * N).fill(-1), wallVersion: 0, fields: {},
      loot: 0, stats: { silenced: 0, tagged: 0, capsuleHits: 0, infectedPhago: 0, unitsLost: 0, burstKills: 0, wallsBroken: 0 }
    };
    let id = 0;
    parseSite(site).forEach(([type, x, y]) => {
      const D = STRUCTS[type];
      const hp = Math.round(D.hp * (site.hpMult || 1));
      const st = { id: id++, type, x, y, size: D.size, hp, maxHp: hp, cd: 0, alive: true, silent: false, tag: 0, signal: D.signal || 0, hitT: 0 };
      S.structs.push(st);
      for (let dy = 0; dy < D.size; dy++) for (let dx = 0; dx < D.size; dx++) S.grid[(y + dy) * N + (x + dx)] = st.id;
    });
    const counted = S.structs.filter(s => s.type !== 'wall');
    S.totalCount = counted.length;
    const lootStructs = S.structs.filter(s => s.type === 'cache');
    S.lootEach = lootStructs.length ? Math.round(site.loot * 0.7 / lootStructs.length) : 0;
    S.hubBonus = Math.round(site.loot * 0.3 / Math.max(1, S.structs.filter(s => s.type === 'hub').length));
    updateSilence(S);
    return S;
  }

  const center = s => ({ x: s.x + s.size / 2, y: s.y + s.size / 2 });
  function rectDist(px, py, s) {
    const dx = Math.max(s.x - px, 0, px - (s.x + s.size)), dy = Math.max(s.y - py, 0, py - (s.y + s.size));
    return Math.hypot(dx, dy);
  }
  function canDeploy(S, x, y) {
    if (x < 0 || y < 0 || x >= N || y >= N) return false;
    // Not on or right next to a structure (one tile of clearance), like a real immune response arriving from the blood.
    for (const s of S.structs) if (s.alive && rectDist(x, y, s) < 1.0) return false;
    return true;
  }
  function deploy(S, type, x, y) {
    if (S.over || !(S.army[type] > 0) || !canDeploy(S, x, y)) return false;
    S.army[type]--;
    const U = UNITS[type], m = S.mult;
    S.units.push({ id: 'u' + (S.deployed++), type, x, y, hp: U.hp * m, maxHp: U.hp * m, dps: U.dps * m, cd: 0, age: 0, target: null, wallTarget: null, alive: true, face: 1 });
    S.firstDeploy = true;
    return true;
  }
  function cast(S, spell, x, y) {
    if (S.over || !(S.spells[spell] > 0)) return false;
    S.spells[spell]--;
    const D = SPELLS[spell];
    S.zones.push({ spell, x, y, r: D.radius, t: D.dur, dur: D.dur });
    if (spell === 'antibody') {
      S.structs.forEach(s => { if (s.alive && s.type !== 'wall' && rectDist(x, y, s) <= D.radius) { s.tag = D.dur; S.stats.tagged++; } });
    }
    S.events.push({ k: 'cast', spell, x, y });
    return true;
  }

  /* Quorum sensing: which colonies receive autoinducer right now. */
  function updateSilence(S) {
    const hubs = S.structs.filter(s => s.type === 'hub' && s.alive);
    S.structs.forEach(s => {
      if (!s.alive || !STRUCTS[s.type].quorum) return;
      const c = center(s);
      const hears = hubs.some(h => { const hc = center(h); return Math.hypot(hc.x - c.x, hc.y - c.y) <= h.signal + s.size / 2; });
      if (s.silent === false && !hears && S.time > 0) { S.stats.silenced++; S.events.push({ k: 'silent', id: s.id }); }
      s.silent = !hears;
    });
  }

  /* Pathfinding: a cost field toward the tiles next to a target. Biofilm costs extra (it has to be broken). */
  function field(S, target) {
    const key = target.id + ':' + S.wallVersion;
    if (S.fields[key]) return S.fields[key];
    const INF = 1e9, dist = new Float32Array(N * N).fill(INF), open = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const occ = S.grid[y * N + x];
      if (occ !== -1) continue;
      if (rectDist(x + 0.5, y + 0.5, target) <= 1.0) { dist[y * N + x] = 0; open.push(y * N + x); }
    }
    // Dijkstra with a simple binary heap.
    const heap = open.map(i => [0, i]);
    const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    heap.sort((a, b) => a[0] - b[0]);
    const cost = i => { const o = S.grid[i]; if (o === -1) return 1; const s = S.structs[o]; return s.type === 'wall' ? 7 : INF; };
    while (heap.length) {
      const [d, i] = pop();
      if (d > dist[i]) continue;
      const x = i % N, y = (i / N) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const j = ny * N + nx, c = cost(j);
        if (c >= INF) continue;
        if (dx && dy && (cost(y * N + nx) >= 7 || cost(ny * N + x) >= 7)) continue;   // no squeezing between corners
        const nd = d + c * (dx && dy ? 1.414 : 1);
        if (nd < dist[j]) { dist[j] = nd; push(nd, j); }
      }
    }
    S.fields[key] = dist;
    return dist;
  }

  function pickTarget(S, u) {
    const U = UNITS[u.type];
    const live = S.structs.filter(s => s.alive && s.type !== 'wall');
    if (!live.length) return null;
    let pool = live;
    if (U.prefer === 'defense') { const d = live.filter(s => STRUCTS[s.type].kind === 'defense'); if (d.length) pool = d; }
    if (U.prefer === 'infected') { const d = live.filter(s => s.type === 'infected'); if (d.length) pool = d; }
    // Chemokine draws cells toward targets inside the signal.
    const zone = S.zones.find(z => z.spell === 'chemokine' && Math.hypot(z.x - u.x, z.y - u.y) < z.r + 4);
    let best = null, bd = 1e9;
    for (const s of pool) {
      let d = rectDist(u.x, u.y, s);
      if (zone && rectDist(zone.x, zone.y, s) <= zone.r) d *= 0.5;
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  function damageMult(S, u, s) {
    const U = UNITS[u.type], D = STRUCTS[s.type];
    let m = 1;
    if (U.phago) {
      if (s.tag > 0) m *= 1.6;
      if (D.capsule && !(s.tag > 0)) { m *= 0.3; S.stats.capsuleHits++; }
      if (D.infected) { m *= 0.2; S.stats.infectedPhago++; }
    } else if (!D.infected) m *= 0.6;   // killer T cells are made for infected cells
    if (S.zones.some(z => z.spell === 'chemokine' && Math.hypot(z.x - u.x, z.y - u.y) <= z.r)) m *= 1.35;
    return m;
  }

  function hitStruct(S, s, dmg) {
    if (!s.alive) return;
    s.hp -= dmg; s.hitT = 0.12;
    S.infl += dmg * 0.04 * (1 + S.infl / 120) * Math.pow(0.7, S.il10);   // feeds on itself: positive feedback
    if (s.hp <= 0) {
      s.alive = false; s.hp = 0;
      for (let dy = 0; dy < s.size; dy++) for (let dx = 0; dx < s.size; dx++) S.grid[(s.y + dy) * N + (s.x + dx)] = -1;
      if (s.type === 'wall') { S.wallVersion++; S.fields = {}; S.stats.wallsBroken++; }
      else { S.wallVersion++; S.fields = {}; }
      if (s.type === 'cache') S.loot += S.lootEach;
      if (s.type === 'hub') { S.loot += S.hubBonus; updateSilence(S); }
      S.events.push({ k: 'down', id: s.id, type: s.type });
    }
  }
  function hitUnit(S, u, dmg, cause) {
    if (!u.alive) return;
    u.hp -= dmg; u.hitT = 0.12;
    if (u.hp <= 0) { u.alive = false; S.stats.unitsLost++; if (cause === 'burst') S.stats.burstKills++; S.events.push({ k: 'lost', id: u.id, type: u.type, cause }); }
  }

  function step(S, dt) {
    if (S.over) return;
    if (S.firstDeploy) { S.time += dt; S.left = Math.max(0, RAID_SECONDS - S.time); }
    // Quorum hubs grow louder over time (autoinduction, a positive feedback loop).
    S.structs.forEach(s => { if (s.type === 'hub' && s.alive && S.firstDeploy) s.signal = Math.min(STRUCTS.hub.maxSignal, s.signal + STRUCTS.hub.grow * dt); });
    updateSilence(S);
    S.zones.forEach(z => z.t -= dt); S.zones = S.zones.filter(z => z.t > 0);
    S.structs.forEach(s => { if (s.tag > 0) s.tag -= dt; if (s.hitT > 0) s.hitT -= dt; });

    // Inflammation drains slowly; past the threshold, a cytokine storm hurts your own cells.
    S.infl = Math.max(0, S.infl - 1.6 * dt);
    if (!S.storm && S.infl >= S.stormAt) { S.storm = true; S.events.push({ k: 'storm' }); }
    if (S.storm && S.infl < S.stormAt * 0.65) { S.storm = false; S.events.push({ k: 'calm' }); }
    if (S.storm) S.stormTime += dt;
    S.peak = Math.max(S.peak || 0, S.infl);

    // Your cells.
    for (const u of S.units) {
      if (!u.alive) continue;
      const U = UNITS[u.type];
      u.age += dt; if (u.hitT > 0) u.hitT -= dt;
      if (U.life && u.age > U.life) { u.alive = false; S.events.push({ k: 'expire', id: u.id }); continue; }
      if (S.storm) hitUnit(S, u, 9 * dt, 'storm');
      if (!u.alive) continue;
      if (!u.target || !u.target.alive) { u.target = pickTarget(S, u); u.wallTarget = null; }
      const t = u.wallTarget && u.wallTarget.alive ? u.wallTarget : u.target;
      if (!t) continue;
      const fast = S.zones.some(z => z.spell === 'chemokine' && Math.hypot(z.x - u.x, z.y - u.y) <= z.r) ? 1.5 : 1;
      if (rectDist(u.x, u.y, t) <= U.range) {
        u.cd -= dt;
        if (u.cd <= 0) { u.cd = 0.5; hitStruct(S, t, u.dps * 0.5 * damageMult(S, u, t)); u.swing = 0.15; }
        if (u.swing > 0) u.swing -= dt;
        continue;
      }
      u.wallTarget = null;
      // Follow the cost field downhill toward the target.
      const f = field(S, u.target);
      const cx = Math.max(0, Math.min(N - 1, Math.floor(u.x))), cy = Math.max(0, Math.min(N - 1, Math.floor(u.y)));
      let bx = cx, by = cy, bv = f[cy * N + cx];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const occ = S.grid[ny * N + nx];
        let v;
        if (occ !== -1 && S.structs[occ].type === 'wall') v = (fieldThroughWall(S, f, nx, ny));
        else v = f[ny * N + nx];
        if (v < bv) { bv = v; bx = nx; by = ny; }
      }
      const occ = S.grid[by * N + bx];
      if (occ !== -1 && S.structs[occ].type === 'wall') { u.wallTarget = S.structs[occ]; continue; }
      let tx = bx + 0.5, ty = by + 0.5;
      if (bx === cx && by === cy) { const c = center(u.target); tx = c.x; ty = c.y; }
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy) || 1;
      const sp = U.speed * fast * dt;
      u.x += dx / d * Math.min(sp, d); u.y += dy / d * Math.min(sp, d);
      if (Math.abs(dx) > 0.01) u.face = dx > 0 ? 1 : -1;
    }

    // Toxin colonies fire only while they hear autoinducer.
    const alive = S.units.filter(u => u.alive);
    for (const s of S.structs) {
      if (!s.alive) continue;
      const D = STRUCTS[s.type];
      if (D.kind !== 'defense') continue;
      s.cd -= dt;
      if (s.silent || s.cd > 0 || !alive.length) continue;
      const c = center(s);
      let best = null, bd = 1e9;
      for (const u of alive) {
        const d = Math.hypot(u.x - c.x, u.y - c.y) - s.size / 2;
        if (d > D.range || (D.minRange && d < D.minRange)) continue;
        if (d < bd) { bd = d; best = u; }
      }
      if (!best) continue;
      if (s.type === 'spitter') { s.cd = 0.8; S.shots.push({ k: 'spit', fx: c.x, fy: c.y, tx: best.x, ty: best.y, t: 0, dur: 0.25, target: best, dmg: D.dps * 0.8 }); }
      else { s.cd = D.every; S.shots.push({ k: 'burst', fx: c.x, fy: c.y, tx: best.x, ty: best.y, t: 0, dur: 0.9, dmg: D.dmg, r: D.splash }); }
    }
    for (const sh of S.shots) {
      sh.t += dt;
      if (sh.t >= sh.dur && !sh.done) {
        sh.done = true;
        if (sh.k === 'spit') hitUnit(S, sh.target, sh.dmg, 'spit');
        else { for (const u of S.units) if (u.alive && Math.hypot(u.x - sh.tx, u.y - sh.ty) <= sh.r) hitUnit(S, u, sh.dmg, 'burst'); S.events.push({ k: 'splash', x: sh.tx, y: sh.ty }); }
      }
    }
    S.shots = S.shots.filter(sh => sh.t < sh.dur + 0.3);

    // The end: time, everything destroyed, or no cells left to fight.
    const r = result(S);
    const armyLeft = UNIT_ORDER.some(t => S.army[t] > 0);
    if (r.pct >= 100) end(S, 'cleared');
    else if (S.left <= 0) end(S, 'time');
    else if (S.firstDeploy && !armyLeft && !S.units.some(u => u.alive)) end(S, 'army');
  }
  function fieldThroughWall(S, f, x, y) {
    // A wall tile's value = cost to break it + the best neighbor beyond it.
    let best = 1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      best = Math.min(best, f[ny * N + nx]);
    }
    return best + 7;
  }
  function end(S, why) { if (!S.over) { S.over = true; S.endReason = why; S.events.push({ k: 'end', why }); } }
  function result(S) {
    const counted = S.structs.filter(s => s.type !== 'wall');
    const down = counted.filter(s => !s.alive).length;
    const pct = Math.round(down / S.totalCount * 100);
    const hubsDown = S.structs.filter(s => s.type === 'hub').every(s => !s.alive);
    const stars = (hubsDown ? 1 : 0) + (pct >= 50 ? 1 : 0) + (pct >= 100 ? 1 : 0);
    return { pct, stars, hubsDown, loot: S.loot };
  }

  const API = { UNITS, UNIT_ORDER, SPELLS, STRUCTS, SITES, BUILDINGS, SIGNALS, LIMITS, NODE_UPGRADE, BASE_SIZE, STORAGE_BASE, START_ATP, RAID_SECONDS, N, starBonus,
    starterBase, computeBase, housingUsed, fits, footprint, parseSite, createRaid, canDeploy, deploy, cast, step, result, end, center, rectDist, field };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SiegeEngine = API;
})(typeof window !== 'undefined' ? window : globalThis);
