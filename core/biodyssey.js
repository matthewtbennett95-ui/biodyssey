/* ==========================================================================
   Biodyssey core: storage, progress, notes, backups, printing, icons and the top bar.
   Load worlds/registry.js first, then this file, at the end of <body>.
   Nothing here sends data anywhere. Everything lives in this browser under "biodyssey.*".
   ========================================================================== */
(function () {
  'use strict';

  const ROOT = new URL('..', document.currentScript.src).href;   // the site root, with a trailing slash
  const PREFIX = 'biodyssey.';
  const SAVE_TAG = 'BIODYSSEY-SAVE:';
  const LEGACY_SYMBIO_TAG = 'SYMBIO-SAVE:';
  const NEVER_SAVED = ['lastBackup', 'symbio.teacherMode'];      // teacher mode is never part of a backup
  const BACKUP_NUDGE_DAYS = 3;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Storage (localStorage can be blocked: fall back to memory) ---------- */
  const mem = {};
  let storageOk = true;
  try { localStorage.setItem(PREFIX + '_probe', '1'); localStorage.removeItem(PREFIX + '_probe'); } catch (e) { storageOk = false; }
  const store = {
    get(k, fallback) {
      if (!storageOk) return k in mem ? mem[k] : fallback;
      try { const v = localStorage.getItem(PREFIX + k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(k, v) {
      mem[k] = v;
      if (storageOk) try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { /* full or blocked */ }
    },
    remove(k) { delete mem[k]; if (storageOk) try { localStorage.removeItem(PREFIX + k); } catch (e) { /* blocked */ } },
    ok: () => storageOk
  };
  function scoped(ns) {
    return { get: (k, f) => store.get(ns + '.' + k, f), set: (k, v) => store.set(ns + '.' + k, v), remove: k => store.remove(ns + '.' + k) };
  }

  /* ---------- Worlds ---------- */
  const WORLDS = window.BIODYSSEY_WORLDS || [];
  const UNITS = window.BIODYSSEY_UNITS || [];
  const worldInfo = id => WORLDS.find(w => w.id === id) || null;
  const unitInfo = n => UNITS.find(u => u.n === n) || { n, name: '' };

  /* ---------- Progress ---------- */
  const listeners = [];
  const progress = {
    all: () => store.get('progress', {}),
    get(id) { return this.all()[id] || null; },
    opened(id) {
      const all = this.all(), p = all[id] || {};
      if (!p.opened) p.opened = new Date().toISOString();
      all[id] = p; store.set('progress', all); store.set('last', id);
    },
    // Goals are sticky: once reached, a goal stays reached.
    report(id, patch) {
      const all = this.all(), prev = all[id] || {}, now = new Date().toISOString();
      const next = Object.assign({}, prev, { updated: now });
      if (!next.opened) next.opened = now;
      if (patch.summary != null) next.summary = String(patch.summary).slice(0, 200);
      if (patch.step != null) next.step = String(patch.step).slice(0, 80);
      const newGoal = !!patch.goal && !prev.goal, newStretch = !!patch.stretch && !prev.stretch;
      if (patch.goal) next.goal = true;
      if (patch.stretch) next.stretch = true;
      all[id] = next; store.set('progress', all);
      if (newGoal || newStretch) {
        const w = worldInfo(id);
        toast(`${newStretch ? 'Stretch goal' : 'Goal'} reached${w ? ': ' + w.title : ''}. Back up your progress now?`,
          { kind: newStretch ? 'warn' : 'good', icon: newStretch ? 'star' : 'check-circle', action: 'Back up', onAction: () => openBackup('save'), ms: 9000 });
      }
      listeners.forEach(fn => fn(id, next));
      return next;
    },
    onChange(fn) { listeners.push(fn); }
  };
  function worldState(id) {
    const p = progress.get(id);
    if (!p) return 'new';
    if (p.stretch && p.goal) return 'stretch';
    if (p.goal) return 'goal';
    return 'started';
  }
  function hasProgress() {
    return Object.keys(progress.all()).length > 0 || Object.values(store.get('notes', {})).some(n => n && n.text && n.text.trim());
  }
  function backupNeeded() {
    if (!hasProgress()) return false;
    const last = store.get('lastBackup', null);
    return !last || (Date.now() - new Date(last).getTime()) > BACKUP_NUDGE_DAYS * 864e5;
  }
  function ago(iso) {
    if (!iso) return 'never';
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' minutes ago';
    if (s < 86400) return Math.round(s / 3600) + (Math.round(s / 3600) === 1 ? ' hour ago' : ' hours ago');
    const d = Math.round(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }

  /* ---------- Notes ---------- */
  const notes = {
    all: () => store.get('notes', {}),
    get(id) { const n = this.all()[id]; return n ? n.text || '' : ''; },
    set(id, text) {
      const all = this.all();
      all[id] = { text: String(text).slice(0, 50000), updated: new Date().toISOString() };
      store.set('notes', all);
    }
  };

  /* ---------- Icons (inline SVG sprite) ---------- */
  const ICONS = {
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'notes': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    'save': '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'printer': '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    'star': '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/>',
    'lock': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    'x': '<path d="M18 6 6 18M6 6l12 12"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'alert': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    'school': '<path d="M22 10 12 5 2 10l10 5zM6 12v5c3 2 9 2 12 0v-5M22 10v6"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    'play': '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    'map': '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    'refresh': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    'pin': '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'users': '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  };
  function icon(name, cls) { return `<svg class="bd-ic${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#bdi-${name}"/></svg>`; }
  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="#bd-logo"/></svg>`;
  function injectSprite() {
    if ($('bd-sprite')) return;
    const d = document.createElement('div');
    d.innerHTML = `<svg id="bd-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs><linearGradient id="bd-logo-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient></defs>
      <symbol id="bd-logo" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="url(#bd-logo-g)"/>
        <path d="M8 23.5C12 22 14 19 16 16.5S20.5 11 24 9.5" fill="none" stroke="#a5b4fc" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="1.6 2.4"/>
        <circle cx="8" cy="23.5" r="2" fill="#fff"/><circle cx="15.6" cy="16.8" r="3" fill="#fff"/><circle cx="23.6" cy="9.6" r="4.2" fill="none" stroke="#6ee7b7" stroke-width="2.2"/></symbol>
      ${Object.entries(ICONS).map(([k, v]) => `<symbol id="bdi-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`;
    document.body.prepend(d.firstElementChild);
  }

  /* ---------- Toasts ---------- */
  function toast(msg, opt) {
    opt = opt || {};
    // A world with a play area can show notices in its own panel instead, so nothing covers the board.
    if (window.Biodyssey && typeof window.Biodyssey.onToast === 'function' && window.Biodyssey.onToast(msg, opt)) return;
    let box = document.querySelector('.bd-toasts');
    if (!box) { box = document.createElement('div'); box.className = 'bd-toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'bd-toast ' + (opt.kind || '');
    t.innerHTML = `${opt.icon ? `<span class="bd-toast-ic">${icon(opt.icon)}</span>` : ''}<span class="grow"></span>${opt.action ? `<button class="bd-btn" type="button">${esc(opt.action)}</button>` : ''}`;
    t.querySelector('.grow').textContent = msg;
    if (opt.action) t.querySelector('button').onclick = () => { t.remove(); opt.onAction && opt.onAction(); };
    box.appendChild(t);
    setTimeout(() => t.remove(), opt.ms || 4200);
  }

  /* ---------- Dialog helper ---------- */
  function dialog(id, cls, html) {
    let d = $(id);
    if (!d) { d = document.createElement('dialog'); d.id = id; d.className = cls; document.body.appendChild(d); }
    d.innerHTML = html;
    d.addEventListener('click', e => { if (e.target === d) d.close(); });   // click on the backdrop closes it
    d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
    return d;
  }
  function openDialog(d) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  }
  const closeBtn = `<button class="bd-close" type="button" data-close aria-label="Close">${icon('x', 'lg')}</button>`;

  /* ---------- Backups: pack, code, parse, restore ---------- */
  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function biodysseyKeys() {
    const out = [];
    if (storageOk) {
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length)); } } catch (e) { /* blocked */ }
    } else out.push(...Object.keys(mem));
    return out;
  }
  function rawGet(k) { if (!storageOk) return JSON.stringify(mem[k]); try { return localStorage.getItem(PREFIX + k); } catch (e) { return null; } }
  function pack() {
    const data = {};
    biodysseyKeys().forEach(k => { if (!NEVER_SAVED.includes(k)) { const v = rawGet(k); if (typeof v === 'string') data[k] = v; } });
    return { app: 'biodyssey', v: 1, saved: new Date().toISOString(), data };
  }
  const saveCode = () => SAVE_TAG + b64encode(JSON.stringify(pack()));
  const KEY_OK = /^[A-Za-z0-9._:-]{1,120}$/;
  // Returns { pack, scope } or throws an Error with a student-friendly message.
  function parseBackup(text) {
    const t = String(text || '').trim();
    if (!t) throw new Error('Paste a save code or choose a save file first.');
    if (t.length > 8e6) throw new Error('That is too large to be a Biodyssey save.');
    let obj;
    try {
      if (t.startsWith(SAVE_TAG)) obj = JSON.parse(b64decode(t.slice(SAVE_TAG.length)));
      else if (t.startsWith(LEGACY_SYMBIO_TAG)) obj = JSON.parse(b64decode(t.slice(LEGACY_SYMBIO_TAG.length)));
      else obj = JSON.parse(t);
    } catch (e) { throw new Error('That doesn\'t look like a save code. Copy the whole code, starting with ' + SAVE_TAG); }
    if (!obj || typeof obj !== 'object' || !obj.data || typeof obj.data !== 'object') throw new Error('That doesn\'t look like a Biodyssey save.');
    let data = {}, scope = '';
    if (obj.app === 'biodyssey') data = obj.data;
    else if (obj.app === 'symbio') {   // an old Symbio progress code: it only replaces Symbio's data
      scope = 'symbio.';
      Object.keys(obj.data).forEach(k => { data['symbio.' + k] = obj.data[k]; });
    } else throw new Error('That doesn\'t look like a Biodyssey save.');
    const clean = {};
    const keys = Object.keys(data);
    if (keys.length > 3000) throw new Error('That save has too many entries to be a Biodyssey save.');
    keys.forEach(k => {
      if (!KEY_OK.test(k) || NEVER_SAVED.includes(k) || typeof data[k] !== 'string') return;
      try { JSON.parse(data[k]); clean[k] = data[k]; } catch (e) { /* skip anything that isn't valid saved data */ }
    });
    return { pack: { saved: obj.saved || null, data: clean }, scope };
  }
  function describeBackup(parsed) {
    const d = parsed.pack.data, parts = [];
    try {
      const p = d.progress ? JSON.parse(d.progress) : {};
      const n = Object.keys(p).length;
      if (n) parts.push(n + (n === 1 ? ' world' : ' worlds'));
      const nt = d.notes ? Object.values(JSON.parse(d.notes)).filter(x => x && x.text && x.text.trim()).length : 0;
      if (nt) parts.push('notes for ' + nt + (nt === 1 ? ' world' : ' worlds'));
    } catch (e) { /* fine */ }
    if (parsed.scope === 'symbio.') parts.push('Symbio progress (from the old Symbio site)');
    return parts.length ? parts.join(' · ') : 'Saved progress';
  }
  function restoreBackup(parsed) {
    if (!storageOk) throw new Error('This browser is blocking saved data, so a backup can\'t be restored here.');
    const scope = parsed.scope;
    biodysseyKeys().forEach(k => { if (!NEVER_SAVED.includes(k) && k.startsWith(scope)) localStorage.removeItem(PREFIX + k); });
    Object.entries(parsed.pack.data).forEach(([k, v]) => localStorage.setItem(PREFIX + k, v));
    localStorage.setItem(PREFIX + 'lastBackup', JSON.stringify(parsed.pack.saved || new Date().toISOString()));
  }

  /* ---------- Backup window ---------- */
  function markBackedUp() { store.set('lastBackup', new Date().toISOString()); refreshBackupState(); }
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function copyText(text, fallbackArea) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* try the older way */ }
    try {
      fallbackArea.hidden = false; fallbackArea.value = text; fallbackArea.select();
      if (document.execCommand('copy')) return true;
    } catch (e) { /* show it instead */ }
    return false;
  }
  function openBackup(tab) {
    const d = dialog('bd-backup', 'bd-modal', `
      <div class="bd-modal-head"><h2 id="bd-backup-title">Back up your progress</h2>${closeBtn}</div>
      <div class="bd-modal-body">
        <div class="bd-seg" role="tablist" aria-label="Back up or restore">
          <button type="button" role="tab" id="bd-tab-save" aria-selected="true" aria-controls="bd-pane-save">Back up</button>
          <button type="button" role="tab" id="bd-tab-load" aria-selected="false" aria-controls="bd-pane-load">Restore</button>
        </div>
        <div id="bd-pane-save" role="tabpanel" aria-labelledby="bd-tab-save" class="bd-stack">
          <p class="muted">Progress saves in this browser by itself. A backup keeps it safe if this browser's data gets cleared, or lets you move to another device.</p>
          <div class="bd-callout" id="bd-last"></div>
          <button class="bd-btn lg block" type="button" id="bd-copy">${icon('copy')}Copy save code</button>
          <p class="bd-help" id="bd-copy-help">Paste it into a Google Doc or a private comment on your Classroom assignment.</p>
          <textarea class="bd-textarea code" id="bd-code" readonly hidden aria-label="Your save code"></textarea>
          <button class="bd-btn secondary block" type="button" id="bd-download">${icon('download')}Download a save file</button>
        </div>
        <div id="bd-pane-load" role="tabpanel" aria-labelledby="bd-tab-load" class="bd-stack" hidden>
          <div class="bd-field"><label class="bd-label" for="bd-restore-code">Paste a save code</label>
            <textarea class="bd-textarea code" id="bd-restore-code" placeholder="${SAVE_TAG}…" spellcheck="false"></textarea></div>
          <div class="bd-actions"><button class="bd-btn secondary" type="button" id="bd-pick">${icon('upload')}Choose a save file</button>
            <input type="file" id="bd-file" accept=".json,application/json,text/plain" hidden><span class="bd-small" id="bd-file-name"></span></div>
          <p class="bd-help" id="bd-restore-msg" role="alert"></p>
          <button class="bd-btn lg block" type="button" id="bd-restore-check">Restore</button>
          <div id="bd-confirm" class="bd-stack" hidden>
            <div class="bd-callout warn">${icon('alert')}<div class="grow"><b>Replace the progress in this browser?</b><br><span id="bd-confirm-what"></span></div></div>
            <div class="bd-actions"><button class="bd-btn" type="button" id="bd-restore-go">Replace my progress</button><button class="bd-btn ghost" type="button" id="bd-restore-cancel">Cancel</button></div>
          </div>
        </div>
      </div>`);
    const show = which => {
      const save = which !== 'load';
      $('bd-tab-save').setAttribute('aria-selected', save); $('bd-tab-load').setAttribute('aria-selected', !save);
      $('bd-pane-save').hidden = !save; $('bd-pane-load').hidden = save;
      $('bd-backup-title').textContent = save ? 'Back up your progress' : 'Restore a backup';
    };
    $('bd-tab-save').onclick = () => show('save');
    $('bd-tab-load').onclick = () => show('load');
    const last = store.get('lastBackup', null);
    $('bd-last').innerHTML = `${icon(last ? 'check-circle' : 'info')}<div class="grow">Last backup: <b>${esc(ago(last))}</b></div>`;
    if (last) $('bd-last').classList.add('good');
    $('bd-copy').onclick = async () => {
      const code = saveCode();
      const ok = await copyText(code, $('bd-code'));
      if (ok) {
        $('bd-copy').innerHTML = icon('check') + 'Copied';
        $('bd-copy-help').textContent = 'Now paste it into a Google Doc or a private Classroom comment.';
        markBackedUp();
      } else {
        $('bd-code').hidden = false; $('bd-code').value = code; $('bd-code').select();
        $('bd-copy-help').textContent = 'This browser blocked copying. The code is selected below: press Ctrl+C (or tap and hold, then Copy).';
        markBackedUp();
      }
    };
    $('bd-download').onclick = () => {
      download('biodyssey-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(pack()));
      markBackedUp();
      toast('Save file downloaded. Keep it in Google Drive or your Downloads folder.', { icon: 'check-circle', kind: 'good' });
    };
    $('bd-pick').onclick = () => $('bd-file').click();
    $('bd-file').onchange = e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 8e6) { $('bd-restore-msg').textContent = 'That file is too large to be a Biodyssey save.'; return; }
      const r = new FileReader();
      r.onload = () => { $('bd-restore-code').value = r.result; $('bd-file-name').textContent = f.name; };
      r.readAsText(f);
    };
    let parsed = null;
    $('bd-restore-check').onclick = () => {
      $('bd-restore-msg').textContent = '';
      try { parsed = parseBackup($('bd-restore-code').value); } catch (e) { $('bd-restore-msg').textContent = e.message; return; }
      const when = parsed.pack.saved ? new Date(parsed.pack.saved).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'an unknown date';
      $('bd-confirm-what').textContent = `Backup from ${when}: ${describeBackup(parsed)}.`;
      $('bd-confirm').hidden = false; $('bd-restore-check').hidden = true;
    };
    $('bd-restore-cancel').onclick = () => { $('bd-confirm').hidden = true; $('bd-restore-check').hidden = false; };
    $('bd-restore-go').onclick = () => {
      try { restoreBackup(parsed); } catch (e) { $('bd-restore-msg').textContent = e.message; return; }
      location.reload();
    };
    show(tab === 'load' ? 'load' : 'save');
    openDialog(d);
  }
  function refreshBackupState() {
    const need = backupNeeded();
    document.querySelectorAll('[data-backup-dot]').forEach(el => { el.hidden = !need; });
    document.querySelectorAll('[data-backup-nudge]').forEach(el => { el.hidden = !need; });
  }

  /* ---------- Notes sheet ---------- */
  function openNotes(id) {
    const w = worldInfo(id) || { title: 'General notes', prompts: [] };
    const d = dialog('bd-notes', 'bd-sheet', `
      <div class="bd-sheet-head"><div><div class="bd-kicker">Notes</div><h2 class="bd-h2">${esc(w.title)}</h2></div>${closeBtn}</div>
      <div class="bd-sheet-body">
        ${w.prompts && w.prompts.length ? `<div class="bd-stack" style="gap:8px"><div class="bd-label">Try answering</div>
          <ol class="bd-prompts">${w.prompts.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>` : ''}
        <div class="bd-field" style="flex:1"><label class="bd-sr" for="bd-note-text">Your notes</label>
          <textarea class="bd-textarea" id="bd-note-text" style="flex:1;min-height:240px" placeholder="Write your notes here. They save by themselves."></textarea></div>
      </div>
      <div class="bd-sheet-foot"><span class="bd-small" id="bd-note-status" aria-live="polite"></span><span class="bd-bar-spacer"></span>
        <a class="bd-btn ghost" href="${ROOT}notes.html">All notes</a><button class="bd-btn" type="button" data-close>Done</button></div>`);
    const ta = $('bd-note-text'), status = $('bd-note-status');
    ta.value = notes.get(id);
    let t = null;
    ta.oninput = () => {
      status.textContent = 'Saving…';
      clearTimeout(t);
      t = setTimeout(() => { notes.set(id, ta.value); status.textContent = 'Saved'; refreshBackupState(); }, 350);
    };
    d.onclose = () => { if (t) { clearTimeout(t); notes.set(id, ta.value); } };
    status.textContent = ta.value ? 'Saved' : '';
    openDialog(d);
    if (window.matchMedia('(min-width: 641px)').matches) ta.focus();
  }

  /* ---------- Printing ---------- */
  const name = { get: () => store.get('name', ''), set: v => store.set('name', String(v || '').slice(0, 60)) };
  function docHead(title, sub) {
    const n = name.get();
    return `<h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}
      <div class="meta"><span>Name: ${esc(n)}</span><span>Date: ${esc(new Date().toLocaleDateString())}</span><span>Class: </span></div>`;
  }
  // Asks for an (optional) name, then prints. `build` returns the printout's HTML, built after the name is known.
  function print(build) {
    const d = dialog('bd-print-ask', 'bd-modal', `
      <div class="bd-modal-head"><h2>Print or save as PDF</h2>${closeBtn}</div>
      <div class="bd-modal-body">
        <div class="bd-field"><label class="bd-label" for="bd-print-name">Name on the printout</label>
          <input class="bd-input" id="bd-print-name" autocomplete="off" maxlength="60" placeholder="Optional"></div>
        <p class="bd-help">Your name stays on this device. It is only used on printouts.</p>
        <button class="bd-btn lg block" type="button" id="bd-print-go">${icon('printer')}Print</button>
      </div>`);
    $('bd-print-name').value = name.get();
    $('bd-print-go').onclick = () => {
      name.set($('bd-print-name').value.trim());
      d.close();
      let out = $('bd-print');
      if (!out) { out = document.createElement('div'); out.id = 'bd-print'; document.body.appendChild(out); }
      out.innerHTML = `<div class="bd-doc">${build()}<p class="foot">Printed from Biodyssey</p></div>`;
      document.body.classList.add('bd-printing');
      const done = () => { document.body.classList.remove('bd-printing'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      setTimeout(() => { window.print(); setTimeout(done, 1500); }, 50);
    };
    openDialog(d);
  }

  /* ---------- Top bar, menu and footer ---------- */
  function page(opt) {
    opt = opt || {};
    injectSprite();
    const w = opt.world ? worldInfo(opt.world) : null;
    const home = ROOT + 'index.html';
    const bar = document.createElement('header');
    bar.className = 'bd-bar';
    bar.innerHTML = `<a class="bd-skip" href="#main">Skip to content</a><div class="bd-bar-in">
      ${w ? `<a class="bd-btn ghost" href="${home}" id="bd-back">${icon('arrow-left')}Odyssey</a>
             <div class="bd-bar-title"><span>Unit ${w.unit} · ${esc(unitInfo(w.unit).name)}</span><b>${esc(w.title)}</b></div>`
          : `<a class="bd-brand" href="${home}" aria-label="Biodyssey home">${LOGO}<span>Biodyssey</span></a>`}
      <span class="bd-bar-spacer"></span>
      ${w ? `<button class="bd-btn ghost" type="button" id="bd-notes-btn">${icon('notes')}Notes</button>`
          : `<a class="bd-btn ghost bd-bar-wide" href="${ROOT}notes.html" id="bd-notes-link">${icon('notes')}My notes</a>`}
      <button class="bd-btn secondary bd-backup-btn bd-bar-wide" type="button" id="bd-backup-btn">${icon('save')}Back up<span class="bd-dot" data-backup-dot hidden></span></button>
      <div class="bd-menu-wrap"><button class="bd-btn ghost bd-backup-btn" type="button" id="bd-more-btn" aria-haspopup="true" aria-expanded="false" aria-controls="bd-menu">${icon('menu')}<span>More</span><span class="bd-dot bd-bar-menu-only" data-backup-dot hidden></span></button>
        <div class="bd-menu" id="bd-menu" hidden>
          <button type="button" class="bd-bar-menu-only" data-act="backup">${icon('save')}Back up my progress</button>
          <button type="button" data-act="restore">${icon('upload')}Restore a backup</button>
          <a href="${ROOT}notes.html" ${w ? '' : 'class="bd-bar-menu-only"'}>${icon('notes')}My notes and study guide</a>
          <hr>
          <a href="${home}">${icon('map')}The odyssey map</a>
          <a href="${ROOT}teacher.html">${icon('school')}Teacher guide</a>
          <a href="${ROOT}privacy.html">${icon('shield')}Safety and privacy</a>
        </div></div>
    </div>`;
    document.body.prepend(bar);
    const main = document.querySelector('main'); if (main && !main.id) main.id = 'main';
    $('bd-backup-btn').onclick = () => openBackup('save');
    if ($('bd-notes-btn')) $('bd-notes-btn').onclick = () => openNotes(w.id);
    const menu = $('bd-menu'), more = $('bd-more-btn');
    const setMenu = open => { menu.hidden = !open; more.setAttribute('aria-expanded', open); };
    more.onclick = e => { e.stopPropagation(); setMenu(menu.hidden); };
    document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); more.focus(); } });
    menu.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { setMenu(false); openBackup(b.dataset.act === 'restore' ? 'load' : 'save'); });
    if (opt.footer !== false) {
      const f = document.createElement('footer');
      f.className = 'bd-foot';
      f.innerHTML = `<div class="bd-foot-in"><span class="bd-foot-safe">${icon('shield')}No accounts. Nothing you do here leaves this device.</span>
        <a href="${ROOT}teacher.html">Teacher guide</a><a href="${ROOT}privacy.html">Safety and privacy</a></div>`;
      document.body.appendChild(f);
    }
    if (w) progress.opened(w.id);
    if (!storageOk) toast('This browser is blocking saved data, so progress will be lost when you close the tab.', { kind: 'warn', icon: 'alert', ms: 9000 });
    refreshBackupState();
  }

  window.Biodyssey = {
    ROOT, esc, icon, store, scoped, progress, notes, name, toast, print, docHead, page,
    worlds: WORLDS, units: UNITS, worldInfo, unitInfo, worldState, hasProgress, backupNeeded, ago,
    openBackup, openNotes, refreshBackupState,
    backup: { pack, code: saveCode, parse: parseBackup, restore: restoreBackup },
    // The world contract: what a world gets to work with.
    world(id) {
      const info = worldInfo(id);
      return {
        info,
        store: scoped(id),
        progress: () => progress.get(id) || {},
        report: patch => progress.report(id, patch),
        print: (title, bodyHtml) => print(() => docHead(title, info ? info.title + ' · Biodyssey' : '') + bodyHtml)
      };
    }
  };
})();
