/**
 * SIGNAL SIEGE — cell communication base builder (Day 1 build)
 * Google Apps Script backend. The spreadsheet is the database AND the settings panel.
 *
 * Tabs this script creates (run "Signal Siege > Set up / repair tabs" once):
 *   Config    – game settings, one per row (validated)
 *   Buildings – every cell type students can build (validated)
 *   Ligands   – signal molecules the cells send and receive
 *   Roster    – YOUR student list: studentId, firstName, lastName, homeroom
 *   Players   – one row per student, written by the game
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me      Who has access: Anyone
 * Student link:  <web app URL>
 * Teacher link:  <web app URL>?page=teacher
 */

// ===================== CHANGE THIS (optional) =====================
// Seconds the game keeps settings in memory. Edits made in the teacher panel
// apply instantly; edits typed straight into the sheet show up within this time.
const CACHE_SECONDS = 60;
// Largest saved base allowed (characters). A busy 22x22 base with 160 walls is about 4,000.
const MAX_BASE_CHARS = 40000;
// ==================================================================

const TABS = {
  config: 'Config',
  buildings: 'Buildings',
  ligands: 'Ligands',
  roster: 'Roster',
  players: 'Players',
  answers: 'Answers'
};

const PLAYER_HEADERS = ['studentId', 'name', 'homeroom', 'base', 'atp', 'lastSave',
  'buildings', 'active', 'activePct', 'atpPerMin', 'goals', 'stars', 'level', 'checks', 'correct', 'firstLogin'];

const ROSTER_HEADERS = ['studentId', 'firstName', 'lastName', 'homeroom'];
const ANSWER_HEADERS = ['time', 'studentId', 'name', 'homeroom', 'level', 'question', 'choice', 'correct'];

/** How many Day 1 goals the game checks (shown on the teacher panel). */
const GOALS_TOTAL = 5;
/** Infection levels built into the game (each adds a new pathogen). */
const LEVELS_TOTAL = 6;

/** Settings. type/min/max here are the rules; the sheet columns just display them. */
const DEFAULT_CONFIG = [
  { key: 'gameTitle', value: 'Signal Siege', type: 'text', description: 'Name shown at the top of the game.' },
  { key: 'teacherPin', value: '2468', type: 'text', description: 'PIN for the teacher panel. Never sent to students. CHANGE THIS.' },
  { key: 'unlockedDay', value: 1, type: 'integer', min: 1, max: 3, description: 'Highest day students can play. Buildings from later days stay locked.' },
  { key: 'maxLevel', value: 6, type: 'integer', min: 1, max: 6, description: 'Highest infection level open. Students also have to beat each level to unlock the next.' },
  { key: 'gridSize', value: 16, type: 'integer', min: 14, max: 24, description: 'Buildable tiles per side for NEW bases. Existing bases keep their size.' },
  { key: 'startATP', value: 700, type: 'integer', min: 0, max: 100000, description: 'ATP a brand-new base starts with.' },
  { key: 'productionMultiplier', value: 1, type: 'number', min: 0, max: 10, description: 'Multiplies all ATP production. 2 = everything makes twice as much.' },
  { key: 'storageCapBase', value: 1200, type: 'integer', min: 50, max: 1000000, description: 'ATP a base can hold before adding adipocytes.' },
  { key: 'offlineHours', value: 24, type: 'number', min: 0, max: 168, description: 'Hours of production a base banks while the student is away (0 turns it off).' },
  { key: 'sellRefund', value: 0.5, type: 'number', min: 0, max: 1, description: 'Share of the cost returned when a student removes a cell.' },
  { key: 'goalReward', value: 150, type: 'integer', min: 0, max: 10000, description: 'ATP paid the first time a student completes each goal.' },
  { key: 'killReward', value: 4, type: 'number', min: 0, max: 1000, description: 'ATP per pathogen destroyed. Paid only on the highest level a student has unlocked, so replaying easy levels does not pay.' },
  { key: 'starReward', value: 60, type: 'integer', min: 0, max: 10000, description: 'ATP per new star, multiplied by the level number.' },
  { key: 'testWaveSize', value: 12, type: 'integer', min: 1, max: 60, description: 'Pathogens in level 1. Higher levels scale up from this.' },
  { key: 'pathogenHP', value: 80, type: 'number', min: 1, max: 10000, description: 'Health of a standard bacterium. Other pathogens are multiples of this.' },
  { key: 'pathogenDPS', value: 16, type: 'number', min: 0, max: 1000, description: 'Damage per second a standard bacterium does.' },
  { key: 'pathogenSpeed', value: 1.1, type: 'number', min: 0.2, max: 5, description: 'Standard bacterium speed in tiles per second.' },
  { key: 'alarmBoost', value: 2, type: 'number', min: 1, max: 5, description: 'Damage multiplier for defenders near a wall that is passing an alarm through gap junctions.' },
  { key: 'helperBoost', value: 1.75, type: 'number', min: 1, max: 5, description: 'Damage multiplier for a defender activated by a helper T cell.' },
  { key: 'neutrophilDPS', value: 30, type: 'number', min: 0, max: 1000, description: 'Damage per second from each recruited neutrophil.' },
  { key: 'neutrophilLife', value: 20, type: 'number', min: 3, max: 120, description: 'Seconds a recruited neutrophil lives (real neutrophils are short-lived).' },
  { key: 'antibodyBoost', value: 2, type: 'number', min: 1, max: 5, description: 'Damage multiplier against pathogens tagged by antibodies.' },
  { key: 'complementDPS', value: 10, type: 'number', min: 0, max: 1000, description: 'Damage per second complement does to each tagged pathogen (Gram-positive bacteria resist it).' },
  { key: 'antibodySlow', value: 0.6, type: 'number', min: 0.1, max: 1, description: 'Speed multiplier for tagged pathogens (0.6 = 40% slower).' },
  { key: 'inflammationRate', value: 1.7, type: 'number', min: 0, max: 10, description: 'How fast fighting raises inflammation. 0 turns cytokine storms off.' },
  { key: 'stormThreshold', value: 100, type: 'number', min: 10, max: 1000, description: 'Inflammation level where a cytokine storm starts damaging your own cells.' },
  { key: 'stormDPS', value: 8, type: 'number', min: 0, max: 1000, description: 'Damage per second a cytokine storm does to each of your cells.' },
  { key: 'il10Calm', value: 0.25, type: 'number', min: 0, max: 1, description: 'Inflammation multiplier for defenders that receive IL-10 from a regulatory T cell (0.25 = 75% less).' },
  { key: 'showLeaderboard', value: true, type: 'boolean', description: 'Let students see the class leaderboard (first name and last initial).' },
  { key: 'checkQuestions', value: true, type: 'boolean', description: 'Ask one question after each test infection. Answers go to the Answers tab.' },
  { key: 'autosaveSeconds', value: 30, type: 'integer', min: 10, max: 300, description: 'Seconds between automatic saves. Raise this if saves start failing with a full class.' },
  { key: 'showSignalLines', value: true, type: 'boolean', description: 'Draw moving lines from each signal source to the cells it activates.' }
];

const LIGAND_HEADERS = ['id', 'name', 'color', 'description'];
const DEFAULT_LIGANDS = [
  ['GF', 'Growth factor', '#D8C27E', 'Paracrine signal from fibroblasts. Binds a receptor tyrosine kinase on respiring cells.'],
  ['INSULIN', 'Insulin', '#E0955E', 'Endocrine hormone carried by the blood. Cells with insulin receptors take in more glucose and make more ATP.'],
  ['ANTIGEN', 'Antigen contact', '#A98BE0', 'Juxtacrine signal: a dendritic cell presents antigen to the T cell receptor of a helper T cell it touches.'],
  ['CXCL8', 'Chemokine (IL-8)', '#8FD16F', 'Paracrine signal from macrophages. Binds G protein-coupled receptors and calls neutrophils out of the blood.'],
  ['THELP', 'T cell help (CD40L)', '#E0606B', 'Juxtacrine signal: a helper T cell activates a B cell it touches through CD40L plus cytokines.'],
  ['IL10', 'IL-10', '#7FC6E8', 'Paracrine anti-inflammatory cytokine from regulatory T cells. Negative feedback that calms nearby defenders.']
];

const BUILDING_HEADERS = ['id', 'name', 'abbr', 'kind', 'size', 'cost', 'unlockDay', 'maxCount', 'needs', 'emits', 'mode', 'range',
  'produces', 'storage', 'boostedBy', 'boostMult', 'troopCap', 'ability', 'hp', 'dps', 'attackRange', 'color', 'description'];

/** Validation rules for each Buildings column (id is fixed). */
const BUILDING_FIELDS = {
  name: { type: 'text', label: 'Name' },
  abbr: { type: 'text', label: 'Short label (2 letters)' },
  kind: { type: 'list', options: ['core', 'wall', 'defense', 'barracks', 'producer', 'signal', 'storage'], label: 'Kind (sets its shape and role)' },
  size: { type: 'integer', min: 1, max: 4, label: 'Footprint (tiles per side)' },
  cost: { type: 'integer', min: 0, max: 100000, label: 'Cost (ATP)' },
  unlockDay: { type: 'integer', min: 1, max: 3, label: 'Unlocks on day' },
  maxCount: { type: 'integer', min: 0, max: 200, label: 'Most a base can have' },
  needs: { type: 'ligand', label: 'Needs signal' },
  emits: { type: 'ligand', label: 'Sends signal' },
  mode: { type: 'list', options: ['none', 'juxtacrine', 'paracrine', 'endocrine'], label: 'Signal reach' },
  range: { type: 'number', min: 0, max: 20, label: 'Paracrine range (tiles)' },
  produces: { type: 'number', min: 0, max: 100000, label: 'ATP per minute' },
  storage: { type: 'integer', min: 0, max: 1000000, label: 'Extra ATP storage' },
  boostedBy: { type: 'ligand', label: 'Boosted by signal' },
  boostMult: { type: 'number', min: 1, max: 10, label: 'Boost multiplier' },
  troopCap: { type: 'integer', min: 0, max: 100, label: 'Troops sent out in an infection' },
  ability: { type: 'list', options: ['none', 'activate', 'antibody', 'recruit'], label: 'Troop job (activate defenders, fire antibodies, recruit neutrophils)' },
  hp: { type: 'number', min: 1, max: 100000, label: 'Health' },
  dps: { type: 'number', min: 0, max: 10000, label: 'Damage per second' },
  attackRange: { type: 'number', min: 0, max: 20, label: 'Attack or patrol range (tiles)' },
  color: { type: 'color', label: 'Color' },
  description: { type: 'text', label: 'Description' }
};

const DEFAULT_BUILDINGS = [
  // id, name, abbr, kind, size, cost, unlockDay, maxCount, needs, emits, mode, range, produces, storage, boostedBy, boostMult, troopCap, ability, hp, dps, attackRange, color, description
  ['core', 'Lymph Node', 'LN', 'core', 4, 0, 1, 1, '', '', 'none', 0, 0, 0, '', 1, 0, 'none', 2000, 0, 0, '#C7B683', 'The lymph node in the middle of your tissue. If pathogens destroy it, the infection wins.'],
  ['wall', 'Epithelial Wall', 'Ep', 'wall', 1, 10, 1, 60, '', '', 'none', 0, 0, 0, '', 1, 0, 'none', 300, 0, 0, '#D98F86', 'Epithelial cells sealed by tight junctions. Connected walls pass an alarm through gap junctions when pathogens attack.'],
  ['respiring', 'Respiring Cell', 'Rc', 'producer', 2, 50, 1, 8, 'GF', '', 'none', 0, 50, 0, 'INSULIN', 1.5, 0, 'none', 220, 0, 0, '#4FA3A5', 'Makes ATP by cellular respiration, but only while growth factor reaches its receptors.'],
  ['fibroblast', 'Fibroblast', 'Fb', 'signal', 2, 60, 1, 4, '', 'GF', 'paracrine', 2, 0, 0, '', 1, 0, 'none', 220, 0, 0, '#D8C27E', 'Secretes growth factor. Cells within 2 tiles that need it switch on.'],
  ['dendritic', 'Dendritic Cell', 'Dc', 'signal', 2, 70, 1, 3, '', 'ANTIGEN', 'juxtacrine', 1, 0, 0, '', 1, 0, 'none', 220, 0, 0, '#A98BE0', 'Presents antigen to cells it touches. Contact signaling only.'],
  ['macrophage', 'Macrophage Post', 'Mp', 'defense', 3, 120, 1, 4, '', 'CXCL8', 'paracrine', 3, 0, 0, '', 1, 0, 'none', 700, 45, 5, '#6FB37A', 'Eats pathogens in range without needing any signal. Releases chemokine that calls neutrophils out of capillaries within 3 tiles.'],
  ['capillary', 'Capillary', 'Cp', 'defense', 3, 120, 1, 3, 'CXCL8', '', 'none', 0, 0, 0, '', 1, 4, 'recruit', 450, 0, 6, '#C94F5D', 'A blood vessel. When chemokine from a macrophage reaches it, neutrophils squeeze out of the blood and hunt pathogens nearby.'],
  ['islet', 'Pancreatic Islet', 'Is', 'signal', 3, 220, 1, 1, '', 'INSULIN', 'endocrine', 0, 0, 0, '', 1, 0, 'none', 500, 0, 0, '#E0955E', 'Releases insulin into the blood. Every cell with insulin receptors gets it and makes more ATP.'],
  ['adipocyte', 'Adipocyte', 'Ad', 'storage', 3, 100, 1, 3, '', '', 'none', 0, 0, 800, '', 1, 0, 'none', 500, 0, 0, '#E8D9A0', 'Stores energy reserves. Raises how much ATP your base can hold.'],
  ['helperT', 'Helper T Barracks', 'Th', 'barracks', 3, 140, 1, 2, 'ANTIGEN', 'THELP', 'juxtacrine', 1, 0, 0, '', 1, 4, 'activate', 600, 0, 0, '#C2454F', 'Switches on when a dendritic cell touches it. Helps B cell barracks it touches. In an infection it sends helper T cells to activate defenders.'],
  ['bcell', 'B Cell Barracks', 'Bc', 'barracks', 3, 160, 1, 2, 'THELP', '', 'none', 0, 0, 0, '', 1, 3, 'antibody', 600, 0, 6, '#5B8DEF', 'Switches on when it touches an active helper T barracks. In an infection its B cells fire antibodies that tag pathogens: slower, easier to kill, and worn down by complement.'],
  ['treg', 'Regulatory T Cell', 'Tr', 'signal', 2, 90, 1, 3, '', 'IL10', 'paracrine', 5, 0, 0, '', 1, 0, 'none', 250, 0, 0, '#7FC6E8', 'Releases IL-10, an anti-inflammatory signal. Defenders within 5 tiles add much less inflammation, which prevents cytokine storms.'],
  ['killerT', 'Cytotoxic T Barracks', 'Tc', 'barracks', 3, 160, 2, 2, 'THELP', '', 'none', 0, 0, 0, '', 1, 3, 'none', 600, 0, 0, '#D46A8C', 'Killer T cells destroy the body\'s own infected cells, which matters once viruses arrive on Day 2.']
];

// =================================================================
// Web app entry
// =================================================================

function doGet(e) {
  const isTeacher = e && e.parameter && e.parameter.page === 'teacher';
  let title = 'Signal Siege';
  try { title = getConfig_().values.gameTitle || title; } catch (err) { /* sheet not set up yet */ }
  return HtmlService.createHtmlOutputFromFile(isTeacher ? 'Teacher' : 'Index')
    .setTitle(isTeacher ? title + ' · Teacher' : title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

// =================================================================
// Student API (called from Index.html with google.script.run)
// =================================================================

/** Look up the student, create their base on first visit, return everything the game needs. */
function login(studentId) {
  try {
    const id = normId_(studentId);
    if (!id) return { ok: false, error: 'Type your student number first.' };
    const student = getRoster_()[id];
    if (!student) {
      return { ok: false, error: "That student number isn't on the class list. Check it and try again, or ask your teacher." };
    }
    const cfg = getConfig_();
    const game = getGameData_();
    const sh = sheet_(TABS.players);
    let row = findRowById_(sh, id);
    let save;

    if (row) {
      const v = sh.getRange(row, 1, 1, PLAYER_HEADERS.length).getValues()[0];
      const base = parseBase_(v[3]);
      save = {
        base: base || starterBase_(cfg.values.gridSize),
        atp: num_(v[4], cfg.values.startATP),
        lastSave: toMs_(v[5]) || Date.now(),
        repaired: !base
      };
    } else {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        row = findRowById_(sh, id); // another tab may have created it while we waited
        if (!row) {
          const base = starterBase_(cfg.values.gridSize);
          const now = new Date();
          sh.appendRow([id, student.name, student.homeroom, JSON.stringify(base), cfg.values.startATP, now,
            base.cells.length, base.cells.length, 100, 0, 0, 0, 0, 0, 0, now]);
          save = { base: base, atp: cfg.values.startATP, lastSave: now.getTime(), isNew: true };
        }
      } finally {
        lock.releaseLock();
      }
      if (!save) return login(studentId);
    }

    return {
      ok: true,
      player: { id: id, name: student.name, firstName: student.firstName, homeroom: student.homeroom },
      config: cfg.publicValues,
      buildings: game.buildings,
      ligands: game.ligands,
      save: save,
      serverNow: Date.now()
    };
  } catch (err) {
    return { ok: false, error: 'The game server hit a problem (' + err.message + '). Try again in a moment.' };
  }
}

/**
 * Save one student's base. Each student writes only their own row, so saves
 * from a whole class don't wait on each other.
 */
function save(studentId, payload) {
  try {
    const id = normId_(studentId);
    if (!id || !payload) return { ok: false, error: 'Missing save data.' };
    const base = cleanBase_(payload.base);
    if (!base) return { ok: false, error: 'Save data was damaged, so it was not written.' };
    const json = JSON.stringify(base);
    if (json.length > MAX_BASE_CHARS) return { ok: false, error: 'This base is too large to save.' };

    const s = payload.stats || {};
    const sh = sheet_(TABS.players);
    const row = findRowById_(sh, id);
    if (!row) return { ok: false, error: 'No base found for this student number. Reload the game.' };

    sh.getRange(row, 4, 1, 12).setValues([[
      json,
      clamp_(num_(payload.atp, 0), 0, 10000000),
      new Date(),
      clamp_(Math.round(num_(s.buildings, 0)), 0, 1000),
      clamp_(Math.round(num_(s.active, 0)), 0, 1000),
      clamp_(Math.round(num_(s.activePct, 0)), 0, 100),
      clamp_(Math.round(num_(s.atpPerMin, 0) * 10) / 10, 0, 1000000),
      clamp_(Math.round(num_(s.goals, 0)), 0, 50),
      clamp_(Math.round(num_(s.stars, 0)), 0, LEVELS_TOTAL * 3),
      clamp_(Math.round(num_(s.level, 0)), 0, LEVELS_TOTAL),
      clamp_(Math.round(num_(s.checks, 0)), 0, 10000),
      clamp_(Math.round(num_(s.correct, 0)), 0, 10000)
    ]]);
    return { ok: true, serverNow: Date.now() };
  } catch (err) {
    return { ok: false, error: err.message, retry: true };
  }
}

/** Class leaderboard: highest level beaten, then total stars. Names are first name + last initial. */
function leaderboard(studentId) {
  try {
    const cfg = getConfig_();
    if (!cfg.values.showLeaderboard) return { ok: false, off: true };
    const cache = CacheService.getScriptCache();
    let rows = null;
    const hit = cache.get('lb');
    if (hit) rows = JSON.parse(hit);
    if (!rows) {
      const roster = getRoster_();
      rows = readPlayerSummaries_().map(function (p) {
        const r = roster[normId_(p.id)] || {};
        const parts = String(r.name || p.name || '').trim().split(/\s+/);
        const label = (r.firstName || parts[0] || 'Player') + (parts.length > 1 ? ' ' + parts[parts.length - 1].charAt(0) + '.' : '');
        return { id: normId_(p.id), name: label, homeroom: p.homeroom, level: p.level, stars: p.stars };
      }).sort(function (a, b) { return b.level - a.level || b.stars - a.stars || a.name.localeCompare(b.name); });
      cache.put('lb', JSON.stringify(rows), 60);
    }
    const id = normId_(studentId);
    const me = rows.filter(function (r) { return r.id === id; })[0] || null;
    const strip = function (list) { return list.slice(0, 10).map(function (r) { return { name: r.name, homeroom: r.homeroom, level: r.level, stars: r.stars, you: r.id === id }; }); };
    return {
      ok: true,
      top: strip(rows),
      homeroom: me ? strip(rows.filter(function (r) { return r.homeroom === me.homeroom; })) : [],
      you: me ? { rank: rows.indexOf(me) + 1, of: rows.length, level: me.level, stars: me.stars, homeroom: me.homeroom } : null
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** One answer to the question after a test infection, logged for the teacher. */
function logAnswer(studentId, rec) {
  try {
    const id = normId_(studentId);
    const student = getRoster_()[id];
    if (!student || !rec) return { ok: false };
    sheet_(TABS.answers).appendRow([new Date(), id, student.name, student.homeroom,
      clamp_(Math.round(num_(rec.level, 0)), 0, LEVELS_TOTAL), String(rec.question || '').slice(0, 300),
      String(rec.choice || '').slice(0, 300), rec.correct === true]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// =================================================================
// Teacher API (called from Teacher.html). Every call checks the PIN.
// =================================================================

function teacherLoad(pin) {
  try {
    checkPin_(pin);
    const cfg = getConfig_(true);
    const game = getGameData_(true);
    const roster = getRoster_(true);

    const config = DEFAULT_CONFIG.filter(function (d) { return d.key !== 'teacherPin'; }).map(function (d) {
      return {
        key: d.key, value: cfg.values[d.key], type: d.type, min: d.min, max: d.max,
        description: d.description, warning: cfg.warnings[d.key] || ''
      };
    });

    const players = readPlayerSummaries_();
    const homerooms = {};
    Object.keys(roster).forEach(function (k) { if (roster[k].homeroom) homerooms[roster[k].homeroom] = true; });

    return {
      ok: true,
      config: config,
      buildings: game.buildings,
      buildingWarnings: game.warnings,
      fields: BUILDING_FIELDS,
      ligands: game.ligands,
      players: players,
      rosterCount: Object.keys(roster).length,
      goalsTotal: GOALS_TOTAL,
      levelsTotal: LEVELS_TOTAL,
      homerooms: Object.keys(homerooms).sort(),
      serverNow: Date.now()
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function teacherUpdateConfig(pin, key, value) {
  try {
    checkPin_(pin);
    const spec = DEFAULT_CONFIG.filter(function (d) { return d.key === key; })[0];
    if (!spec || key === 'teacherPin') return { ok: false, error: 'That setting cannot be changed here.' };
    const clean = coerce_(value, spec, ligandIds_());
    if (clean === null) return { ok: false, error: rangeMessage_(spec) };
    const sh = sheet_(TABS.config);
    const row = findRowById_(sh, key);
    if (!row) return { ok: false, error: 'Setting ' + key + ' is missing from the Config tab. Run Set up / repair tabs.' };
    sh.getRange(row, 2).setValue(clean);
    clearCache_();
    return { ok: true, value: clean };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function teacherUpdateBuilding(pin, buildingId, field, value) {
  try {
    checkPin_(pin);
    const spec = BUILDING_FIELDS[field];
    if (!spec) return { ok: false, error: 'That field cannot be changed here.' };
    const clean = coerce_(value, spec, ligandIds_());
    if (clean === null) return { ok: false, error: rangeMessage_(spec) };
    const sh = sheet_(TABS.buildings);
    const row = findRowById_(sh, buildingId);
    if (!row) return { ok: false, error: 'No cell type with id ' + buildingId + '.' };
    sh.getRange(row, BUILDING_HEADERS.indexOf(field) + 1).setValue(clean);
    clearCache_();
    return { ok: true, value: clean };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Give one student a fresh starter base. */
function teacherResetBase(pin, studentId) {
  try {
    checkPin_(pin);
    const cfg = getConfig_(true);
    const sh = sheet_(TABS.players);
    const row = findRowById_(sh, normId_(studentId));
    if (!row) return { ok: false, error: 'That student has not started yet.' };
    const base = starterBase_(cfg.values.gridSize);
    sh.getRange(row, 4, 1, 12).setValues([[JSON.stringify(base), cfg.values.startATP, new Date(),
      base.cells.length, base.cells.length, 100, 0, 0, 0, 0, 0, 0]]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// =================================================================
// Spreadsheet menu: setup, archive, links
// =================================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Signal Siege')
    .addItem('Set up / repair tabs', 'setupSheets')
    .addItem('Show game links', 'showLinks')
    .addSeparator()
    .addItem('Archive and reset all bases…', 'archiveAndReset')
    .addToUi();
}

/** Creates missing tabs, fills defaults into empty ones, and (re)applies validation. Safe to run again. */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());

  const ligands = ensureTab_(ss, TABS.ligands, LIGAND_HEADERS, DEFAULT_LIGANDS);
  const config = ensureTab_(ss, TABS.config, ['key', 'value', 'type', 'min', 'max', 'description'],
    DEFAULT_CONFIG.map(function (d) {
      return [d.key, d.value, d.type, d.min === undefined ? '' : d.min, d.max === undefined ? '' : d.max, d.description];
    }));
  // Add any settings that were introduced after the tab was first created.
  const haveKeys = config.getRange(1, 1, Math.max(config.getLastRow(), 1), 1).getValues().map(function (r) { return String(r[0]); });
  DEFAULT_CONFIG.forEach(function (d) {
    if (haveKeys.indexOf(d.key) === -1) {
      config.appendRow([d.key, d.value, d.type, d.min === undefined ? '' : d.min, d.max === undefined ? '' : d.max, d.description]);
    }
  });

  const buildings = ensureTab_(ss, TABS.buildings, BUILDING_HEADERS, DEFAULT_BUILDINGS);
  const roster = ensureTab_(ss, TABS.roster, ROSTER_HEADERS, [
    ['1001', 'Sample', 'Student', 'Sample HR'],
    ['1002', 'Test', 'Student', 'Sample HR']
  ]);
  const players = ensureTab_(ss, TABS.players, PLAYER_HEADERS, []);

  roster.getRange('A:A').setNumberFormat('@');
  players.getRange('A:A').setNumberFormat('@');
  players.hideColumns(4); // the saved base JSON is long and not meant for reading
  players.getRange('F:F').setNumberFormat('m/d h:mm am/pm');
  players.getRange('P:P').setNumberFormat('m/d h:mm am/pm');
  const answers = ensureTab_(ss, TABS.answers, ANSWER_HEADERS, []);
  answers.getRange('A:A').setNumberFormat('m/d h:mm am/pm');
  answers.getRange('B:B').setNumberFormat('@');

  applyConfigValidation_(config);
  applyBuildingValidation_(buildings, ligands);
  clearCache_();

  SpreadsheetApp.getUi().alert('Signal Siege is set up.\n\nNext: paste your class list into the Roster tab (keep the header row), change teacherPin on the Config tab, then deploy as a web app.');
}

function showLinks() {
  let url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (err) { /* not deployed */ }
  const ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('Deploy the web app first: Extensions > Apps Script > Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).');
    return;
  }
  ui.alert('Student link:\n' + url + '\n\nTeacher panel (bookmark on your phone):\n' + url + '?page=teacher');
}

/** Copies Players to a dated archive tab, then clears every base. */
function archiveAndReset() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert('Archive and reset all bases?',
    'Every student will start over with a fresh base. A copy of the current Players tab is kept as an archive tab.',
    ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.players);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  sh.copyTo(ss).setName('Players archive ' + stamp);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, PLAYER_HEADERS.length).clearContent();
  ui.alert('Done. The old data is in "Players archive ' + stamp + '".');
}

// =================================================================
// Reading settings and game data (cached)
// =================================================================

/** Returns { values, publicValues, warnings }. Bad cells fall back to defaults and get a warning. */
function getConfig_(fresh) {
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const hit = cache.get('cfg');
    if (hit) return JSON.parse(hit);
  }
  const rows = readRows_(sheet_(TABS.config));
  const byKey = {};
  rows.forEach(function (r) { byKey[String(r.key).trim()] = r.value; });
  const ligIds = ligandIds_();
  const values = {};
  const warnings = {};
  DEFAULT_CONFIG.forEach(function (d) {
    const raw = byKey[d.key];
    const clean = (raw === undefined || raw === '') ? null : coerce_(raw, d, ligIds);
    if (clean === null) {
      values[d.key] = d.value;
      warnings[d.key] = raw === undefined ? 'Missing from the sheet, so the default is used.'
        : 'The sheet value "' + raw + '" is not allowed (' + rangeMessage_(d) + '), so the default ' + d.value + ' is used.';
    } else {
      values[d.key] = clean;
    }
  });
  const publicValues = {};
  Object.keys(values).forEach(function (k) { if (k !== 'teacherPin') publicValues[k] = values[k]; });
  const out = { values: values, publicValues: publicValues, warnings: warnings };
  cache.put('cfg', JSON.stringify(out), CACHE_SECONDS);
  return out;
}

/** Buildings + ligands, validated. */
function getGameData_(fresh) {
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const hit = cache.get('game');
    if (hit) return JSON.parse(hit);
  }
  const ligands = readRows_(sheet_(TABS.ligands)).filter(function (r) { return String(r.id).trim(); }).map(function (r) {
    return {
      id: String(r.id).trim().toUpperCase(),
      name: String(r.name || r.id),
      color: /^#[0-9a-f]{6}$/i.test(String(r.color).trim()) ? String(r.color).trim() : '#9FB0C8',
      description: String(r.description || '')
    };
  });
  const ligIds = ligands.map(function (l) { return l.id; });
  const defaults = {};
  DEFAULT_BUILDINGS.forEach(function (row) {
    const o = {};
    BUILDING_HEADERS.forEach(function (h, i) { o[h] = row[i]; });
    defaults[o.id] = o;
  });

  const warnings = [];
  const buildings = readRows_(sheet_(TABS.buildings)).filter(function (r) { return String(r.id).trim(); }).map(function (r) {
    const id = String(r.id).trim();
    const def = defaults[id] || {};
    const b = { id: id };
    Object.keys(BUILDING_FIELDS).forEach(function (f) {
      const spec = BUILDING_FIELDS[f];
      const raw = r[f];
      let clean = (raw === undefined || raw === '') ? emptyValue_(spec) : coerce_(raw, spec, ligIds);
      if (clean === null) {
        clean = def[f] !== undefined ? def[f] : emptyValue_(spec);
        warnings.push(id + ' ' + f + ': "' + raw + '" is not allowed (' + rangeMessage_(spec) + '), so ' + (clean === '' ? 'blank' : clean) + ' is used.');
      }
      b[f] = clean;
    });
    if (!b.name) b.name = id;
    if (!b.abbr) b.abbr = b.name.slice(0, 2);
    if (b.mode === 'none') b.emits = '';
    if (!b.emits) b.mode = 'none';
    return b;
  });

  const out = { buildings: buildings, ligands: ligands, warnings: warnings };
  cache.put('game', JSON.stringify(out), CACHE_SECONDS);
  return out;
}

function getRoster_(fresh) {
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const hit = cache.get('roster');
    if (hit) return JSON.parse(hit);
  }
  const map = {};
  readRows_(sheet_(TABS.roster)).forEach(function (r) {
    const id = normId_(r.studentId);
    if (!id) return;
    const first = String(r.firstName || '').trim();
    const last = String(r.lastName || '').trim();
    map[id] = {
      name: (first + ' ' + last).trim() || id,
      firstName: first || id,
      homeroom: String(r.homeroom || '').trim()
    };
  });
  try { cache.put('roster', JSON.stringify(map), CACHE_SECONDS); } catch (err) { /* very large roster: skip cache */ }
  return map;
}

function readPlayerSummaries_() {
  const sh = sheet_(TABS.players);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const left = sh.getRange(2, 1, last - 1, 3).getValues();
  const right = sh.getRange(2, 5, last - 1, 12).getValues();
  return left.map(function (l, i) {
    const r = right[i];
    return {
      id: String(l[0]), name: String(l[1]), homeroom: String(l[2]),
      atp: num_(r[0], 0), lastSave: toMs_(r[1]), buildings: num_(r[2], 0), active: num_(r[3], 0),
      activePct: num_(r[4], 0), atpPerMin: num_(r[5], 0), goals: num_(r[6], 0), stars: num_(r[7], 0), level: num_(r[8], 0),
      checks: num_(r[9], 0), correct: num_(r[10], 0), firstLogin: toMs_(r[11])
    };
  }).filter(function (p) { return p.id; });
}

// =================================================================
// Helpers
// =================================================================

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('The "' + name + '" tab is missing. Open the sheet and run Signal Siege > Set up / repair tabs');
  return sh;
}

function readRows_(sh) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (h) { return String(h).trim(); });
  return values.slice(1).map(function (row) {
    const o = {};
    headers.forEach(function (h, i) { if (h) o[h] = row[i]; });
    return o;
  });
}

/** Row number (1-based) whose column A exactly matches id, or 0. */
function findRowById_(sh, id) {
  if (!id || sh.getLastRow() < 2) return 0;
  const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function normId_(v) {
  let s = String(v === null || v === undefined ? '' : v).trim();
  if (/^\d+(\.0+)?$/.test(s)) s = String(parseInt(s, 10));
  return s.toUpperCase();
}

function num_(v, fallback) {
  const n = Number(v);
  return (v === '' || v === null || !isFinite(n)) ? fallback : n;
}

function clamp_(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

function toMs_(v) {
  if (v instanceof Date) return v.getTime();
  const n = Number(v);
  if (v !== '' && isFinite(n)) return n;
  const d = new Date(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function ligandIds_() {
  try { return getGameData_().ligands.map(function (l) { return l.id; }); } catch (err) {
    return DEFAULT_LIGANDS.map(function (l) { return l[0]; });
  }
}

/** Returns the cleaned value, or null when the value breaks the rule. */
function coerce_(value, spec, ligIds) {
  switch (spec.type) {
    case 'integer':
    case 'number': {
      if (value === '' || value === null || typeof value === 'boolean') return null;
      let n = Number(value);
      if (!isFinite(n)) return null;
      if (spec.type === 'integer') n = Math.round(n);
      if (spec.min !== undefined && n < spec.min) return null;
      if (spec.max !== undefined && n > spec.max) return null;
      return n;
    }
    case 'boolean':
      if (value === true || value === false) return value;
      if (/^(true|yes|1|on)$/i.test(String(value).trim())) return true;
      if (/^(false|no|0|off)$/i.test(String(value).trim())) return false;
      return null;
    case 'ligand': {
      const s = String(value || '').trim().toUpperCase();
      if (!s) return '';
      return ligIds.indexOf(s) === -1 ? null : s;
    }
    case 'list': {
      const s = String(value || '').trim().toLowerCase();
      return spec.options.indexOf(s) === -1 ? null : s;
    }
    case 'color': {
      const s = String(value || '').trim();
      return /^#[0-9a-f]{6}$/i.test(s) ? s.toUpperCase() : null;
    }
    default:
      return String(value === null || value === undefined ? '' : value).trim().slice(0, 300);
  }
}

function emptyValue_(spec) {
  if (spec.type === 'integer' || spec.type === 'number') return spec.min !== undefined ? spec.min : 0;
  if (spec.type === 'list') return spec.options[0];
  if (spec.type === 'color') return '#9FB0C8';
  if (spec.type === 'boolean') return false;
  return '';
}

function rangeMessage_(spec) {
  if (spec.type === 'integer') return 'a whole number from ' + spec.min + ' to ' + spec.max;
  if (spec.type === 'number') return 'a number from ' + spec.min + ' to ' + spec.max;
  if (spec.type === 'boolean') return 'TRUE or FALSE';
  if (spec.type === 'ligand') return 'blank or an id from the Ligands tab';
  if (spec.type === 'list') return 'one of: ' + spec.options.join(', ');
  if (spec.type === 'color') return 'a hex color like #4FA3A5';
  return 'text';
}

function checkPin_(pin) {
  const real = String(getConfig_(true).values.teacherPin).trim();
  if (!real || String(pin || '').trim() !== real) throw new Error('That PIN is not correct.');
}

function clearCache_() {
  CacheService.getScriptCache().removeAll(['cfg', 'game', 'roster']);
}

/**
 * New bases: the lymph node (4x4) in the middle, a fibroblast feeding two respiring cells,
 * and one macrophage post so the first infection has something to fight.
 */
function starterBase_(size) {
  const n = clamp_(Math.round(num_(size, 16)), 14, 24);
  const c = Math.floor(n / 2) - 2; // lymph node covers c..c+3
  return { v: 3, size: n, best: 0, paid: [], lv: {}, ck: [0, 0], cells: [
    ['core', c, c],
    ['fibroblast', c - 3, c - 3], ['respiring', c - 5, c - 3], ['respiring', c - 3, c - 5],
    ['macrophage', c + 5, c]
  ] };
}

function parseBase_(json) {
  try { return cleanBase_(JSON.parse(json)); } catch (err) { return null; }
}

/**
 * Accepts only { v, size, best, cells: [[typeId, x, y], ...] } with anchors inside the grid.
 * Footprint overlaps are prevented by the game itself.
 */
function cleanBase_(base) {
  if (!base || typeof base !== 'object' || !Array.isArray(base.cells)) return null;
  const size = Math.round(num_(base.size, 0));
  if (size < 4 || size > 32) return null;
  const seen = {};
  const cells = [];
  for (let i = 0; i < base.cells.length && i < size * size; i++) {
    const c = base.cells[i];
    if (!Array.isArray(c) || c.length < 3) continue;
    const t = String(c[0]).slice(0, 40);
    const x = Math.round(num_(c[1], -1));
    const y = Math.round(num_(c[2], -1));
    if (!t || x < 0 || y < 0 || x >= size || y >= size || seen[x + ',' + y]) continue;
    seen[x + ',' + y] = true;
    cells.push([t, x, y]);
  }
  const paid = Array.isArray(base.paid) ? base.paid.filter(function (g) { return typeof g === 'string'; })
    .map(function (g) { return g.slice(0, 24); }).slice(0, 30) : [];
  const lv = {};
  if (base.lv && typeof base.lv === 'object') {
    Object.keys(base.lv).slice(0, 20).forEach(function (k) {
      const n = Math.round(num_(k, 0));
      if (n >= 1 && n <= LEVELS_TOTAL) lv[n] = clamp_(Math.round(num_(base.lv[k], 0)), 0, 3);
    });
  }
  const ck = Array.isArray(base.ck) ? [clamp_(Math.round(num_(base.ck[0], 0)), 0, 10000), clamp_(Math.round(num_(base.ck[1], 0)), 0, 10000)] : [0, 0];
  return { v: 3, size: size, best: clamp_(Math.round(num_(base.best, 0)), 0, 3), paid: paid, lv: lv, ck: ck, cells: cells };
}

function ensureTab_(ss, name, headers, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0C223F').setFontColor('#C7B683');
  return sh;
}

function applyConfigValidation_(sh) {
  const keys = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  keys.forEach(function (r, i) {
    const spec = DEFAULT_CONFIG.filter(function (d) { return d.key === String(r[0]).trim(); })[0];
    if (!spec) return;
    const cell = sh.getRange(i + 1, 2);
    const rule = validationRule_(spec, null);
    if (rule) cell.setDataValidation(rule); else cell.clearDataValidations();
  });
  sh.getRange('C:E').setFontColor('#6B7A90');
}

function applyBuildingValidation_(sh, ligandSheet) {
  const rows = 200;
  Object.keys(BUILDING_FIELDS).forEach(function (f) {
    const rule = validationRule_(BUILDING_FIELDS[f], ligandSheet);
    const range = sh.getRange(2, BUILDING_HEADERS.indexOf(f) + 1, rows, 1);
    if (rule) range.setDataValidation(rule); else range.clearDataValidations();
  });
}

function validationRule_(spec, ligandSheet) {
  const b = SpreadsheetApp.newDataValidation().setAllowInvalid(false);
  switch (spec.type) {
    case 'integer':
    case 'number':
      return b.requireNumberBetween(spec.min, spec.max).setHelpText('Enter ' + rangeMessage_(spec) + '.').build();
    case 'boolean':
      return b.requireCheckbox().build();
    case 'ligand':
      return ligandSheet ? b.requireValueInRange(ligandSheet.getRange('A2:A50'), true)
        .setHelpText('Leave blank, or pick a signal from the Ligands tab.').build() : null;
    case 'list':
      return b.requireValueInList(spec.options, true).build();
    case 'color':
      return b.requireTextMatchesPattern('^#[0-9A-Fa-f]{6}$').setHelpText('Enter a hex color like #4FA3A5.').build();
    default:
      return null;
  }
}
