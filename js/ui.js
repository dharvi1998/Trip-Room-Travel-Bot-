/* Phone shell, components and event wiring shared by every screen. */
(function () {
  const T = window.TR;
  const E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  const ic = window.icon;

  T.screens = {};   // id -> function(ph, params) => html
  T.sheets = {};    // id -> function(ph, params) => html
  T.after = {};     // id -> function(ph, el) optional hook after render
  T.on = {};        // action handlers: name -> function(ph, arg, el, ev)

  /* ---------- small components ---------- */
  const UI = {};
  UI.E = E;
  UI.img = function (n) { return 'url(assets/' + (/\.\w+$/.test(n) ? n : n + '.jpg') + '?v=3)'; };
  UI.av = function (uid, size, extra) {
    const p = T.PEOPLE[uid];
    return '<span class="av av' + p.av + (extra ? ' ' + extra : '') + '" style="--s:' + (size || 32) + 'px" title="' + E(p.name) + '">' + E(p.name[0]) + '</span>';
  };
  UI.avStatus = function (uid, size, st) {
    const mark = { approved: 'check', paid: 'check', soft: 'clock', answered: 'check', joined: 'clock', invited: '', out: 'x', organiser: '' }[st] || '';
    return '<span class="avs st-' + st + '">' + UI.av(uid, size) + (mark ? '<i class="avs-b">' + ic(mark, 9) + '</i>' : '') + '</span>';
  };
  UI.chip = function (label, o) {
    o = o || {};
    return '<button type="button" class="chip' + (o.active ? ' on' : '') + (o.disabled ? ' off' : '') + '" data-a="' + (o.act || 'noop') + '" data-p="' + E(o.p == null ? '' : o.p) + '" data-q="' + E(o.q == null ? '' : o.q) + '"' + (o.disabled ? ' disabled' : '') + '>' + (o.active && !o.noTick ? ic('check', 14) : '') + (o.icon ? ic(o.icon, 14) : '') + E(label) + '</button>';
  };
  UI.pill = function (text, kind, icon) {
    return '<span class="pill ' + (kind || '') + '">' + (icon ? ic(icon, 12) : '') + E(text) + '</span>';
  };
  UI.statusPill = function (st) {
    const m = {
      approved: ['Approved', 'ok'], soft: ['Soft yes', 'warn'], answered: ['Answered', 'ok'], joined: ['Opened', 'warn'],
      invited: ['Invited', ''], out: ['Out', 'err'], paid: ['Paid', 'ok'], organiser: ['Organiser', 'dark']
    }[st] || [st, ''];
    return UI.pill(m[0], m[1]);
  };
  UI.btn = function (label, act, p, o) {
    o = o || {};
    return '<button type="button" class="btn ' + (o.kind || 'sec') + (o.block ? ' block' : '') + '" data-a="' + act + '" data-p="' + E(p == null ? '' : p) + '" data-q="' + E(o.q == null ? '' : o.q) + '"' + (o.disabled ? ' disabled' : '') + '>' + (o.icon ? ic(o.icon, 16) : '') + E(label) + '</button>';
  };
  UI.top = function (o) {
    o = o || {};
    return '<div class="top">' +
      (o.back === false ? '<span class="rb ghost"></span>' : '<button type="button" class="rb" data-a="back" aria-label="Back">' + ic(o.close ? 'x' : 'back', 18) + '</button>') +
      '<div class="top-t">' + E(o.title || '') + '</div>' +
      (o.right ? o.right : '<span class="rb ghost"></span>') + '</div>';
  };
  UI.rbtn = function (icon, act, p, label, extra) {
    return '<button type="button" class="rb' + (extra ? ' ' + extra : '') + '" data-a="' + act + '" data-p="' + E(p == null ? '' : p) + '" aria-label="' + E(label || icon) + '">' + ic(icon, 18) + '</button>';
  };
  /* action dock: a "Next" cue above the primary button */
  UI.dock = function (o) {
    return '<div class="dock">' +
      (o.cue ? '<div class="cue"><span class="cue-i">' + ic('arrow', 9) + '</span><b>Next</b><span>' + E(o.cue) + '</span></div>' : '') +
      '<div class="dock-row">' + (o.left || '') +
      (o.slide ? o.slide : '<button type="button" class="cta' + (o.dark ? ' dark' : '') + '" data-a="' + o.act + '" data-p="' + E(o.p == null ? '' : o.p) + '" data-q="' + E(o.q == null ? '' : o.q) + '"' + (o.disabled ? ' disabled' : '') + '><span>' + E(o.label) + '</span><i class="cta-ar">' + ic(o.icon || 'arrow', 16) + '</i></button>') +
      '</div>' + (o.under ? '<div class="dock-under">' + o.under + '</div>' : '') + '</div>';
  };
  UI.slide = function (label, name) {
    return '<div class="slide" data-slide="' + name + '" role="slider" aria-label="' + E(label) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">' +
      '<div class="slide-fill"></div><div class="slide-knob">' + ic('arrow', 18) + '</div><div class="slide-t">' + E(label) + '</div><div class="slide-end">' + ic('check', 18) + '</div></div>';
  };
  UI.nav = function (items, active) {
    return '<nav class="nav">' + items.map(function (it) {
      return '<button type="button" class="nav-i' + (it.id === active ? ' on' : '') + '" data-a="' + it.act + '" data-p="' + E(it.p || '') + '" aria-label="' + E(it.label) + '">' + ic(it.icon, 20) + '</button>';
    }).join('') + '</nav>';
  };
  UI.ring = function (done, total, big, small, size) {
    const s = size || 104, r = s / 2 - 8, c = 2 * Math.PI * r, pct = total ? done / total : 0;
    return '<div class="ring" style="width:' + s + 'px;height:' + s + 'px"><svg viewBox="0 0 ' + s + ' ' + s + '" width="' + s + '" height="' + s + '"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" class="ring-bg"/><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" class="ring-fg" stroke-dasharray="' + (c * pct).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/></svg><div class="ring-t"><b>' + E(big) + '</b><span>' + E(small) + '</span></div></div>';
  };
  UI.bar = function (pct, cls) {
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, pct)).toFixed(1) + '%"></i></div>';
  };
  UI.sect = function (title, right) {
    return '<div class="sect"><h3>' + E(title) + '</h3>' + (right || '') + '</div>';
  };
  UI.empty = function (icon, title, text) {
    return '<div class="empty"><span class="empty-i">' + ic(icon, 22) + '</span><b>' + E(title) + '</b><p>' + E(text) + '</p></div>';
  };
  UI.note = function (icon, text, kind) {
    return '<div class="note ' + (kind || '') + '">' + ic(icon, 16) + '<span>' + text + '</span></div>';
  };
  /* decorative QR block; deterministic from a seed string */
  UI.qr = function (seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    const n = 25, cells = [];
    function rnd() { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; }
    function finder(x, y) { return (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8); }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on;
      if (finder(x, y)) {
        const fx = x < 7 ? x : x - (n - 7), fy = y < 7 ? y : y - (n - 7);
        on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else on = rnd() > 0.52;
      if (on) cells.push('<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>');
    }
    return '<svg class="qr" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" aria-label="QR code">' + cells.join('') + '</svg>';
  };
  UI.countdown = function (ms) {
    const m = Math.max(0, Math.floor(ms / 60000));
    return Math.floor(m / 60) + 'h ' + (m % 60 < 10 ? '0' : '') + (m % 60) + 'm';
  };
  T.UI = UI;

  /* ---------- the phone ---------- */
  function Phone(root, role, uid) {
    this.root = root;
    this.role = role;
    this.uid = uid;
    this.stacks = {};
    this.local = {};
    this.sheet = null;
    this.seen = {};
    this.lastKey = '';
    this.timers = {};
    this.build();
  }
  Phone.prototype.build = function () {
    const self = this;
    this.root.innerHTML =
      '<div class="phone"><div class="status"><span class="st-time">9:41</span><span class="st-r"><b>5G</b><i class="batt"><u></u></i></span></div>' +
      '<div class="screen" id="scr-' + this.role + '"></div><div class="layer"></div></div>';
    this.phone = this.root.querySelector('.phone');
    this.scr = this.root.querySelector('.screen');
    this.layer = this.root.querySelector('.layer');
    this.root.addEventListener('click', function (ev) {
      const el = ev.target.closest('[data-a]');
      if (!el || !self.root.contains(el) || el.disabled) return;
      const name = el.getAttribute('data-a');
      const fn = T.on[name];
      if (!fn) return;
      ev.preventDefault();
      fn(self, el.getAttribute('data-p'), el, ev);
    });
    this.root.addEventListener('input', function (ev) {
      const el = ev.target.closest('[data-in]');
      if (el && T.on['in:' + el.getAttribute('data-in')]) T.on['in:' + el.getAttribute('data-in')](self, el.value, el, ev);
    });
    this.root.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && self.sheet) { self.closeSheet(); }
    });
  };
  Phone.prototype.start = function () {
    return this.role === 'organiser' ? 'o.home' : 't.hub';
  };
  Phone.prototype.stack = function () {
    if (!this.stacks[this.uid]) this.stacks[this.uid] = [{ id: this.start(), params: {} }];
    return this.stacks[this.uid];
  };
  Phone.prototype.cur = function () { const s = this.stack(); return s[s.length - 1]; };
  Phone.prototype.go = function (id, params) {
    this.sheet = null;
    this.stack().push({ id: id, params: params || {} });
    this.dir = 'fwd';
    this.render(true);
  };
  Phone.prototype.replace = function (id, params) {
    this.sheet = null;
    const s = this.stack();
    s[s.length - 1] = { id: id, params: params || {} };
    this.dir = 'fwd';
    this.render(true);
  };
  Phone.prototype.root_ = function (id, params) {
    this.sheet = null;
    this.stacks[this.uid] = [{ id: id, params: params || {} }];
    this.dir = 'fwd';
    this.render(true);
  };
  Phone.prototype.back = function () {
    this.sheet = null;
    const s = this.stack();
    if (s.length > 1) { s.pop(); this.dir = 'back'; this.render(true); }
  };
  Phone.prototype.popTo = function (id) {
    const s = this.stack();
    while (s.length > 1 && s[s.length - 1].id !== id) s.pop();
    this.dir = 'back';
    this.render(true);
  };
  Phone.prototype.setUser = function (uid) {
    if (uid === this.uid) return;
    this.uid = uid;
    this.sheet = null;
    this.seen[uid] = this.maxNotif();
    this.render(true);
  };
  Phone.prototype.openSheet = function (id, params) { this.sheet = { id: id, params: params || {} }; this.renderLayer(); };
  Phone.prototype.closeSheet = function () { this.sheet = null; this.renderLayer(); };
  Phone.prototype.maxNotif = function () {
    const n = T.store.get().notifs; return n.length ? n[n.length - 1].id : 0;
  };
  Phone.prototype.toast = function (text, icon) {
    const self = this;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = ic(icon || 'check', 16) + '<span>' + E(text) + '</span>';
    this.phone.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2100);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  };
  Phone.prototype.notifBanner = function () {
    const self = this, notifs = T.store.get().notifs;
    if (this.seen[this.uid] === undefined) this.seen[this.uid] = 0;
    const fresh = notifs.filter(function (n) { return n.to === self.uid && n.id > self.seen[self.uid]; });
    this.seen[this.uid] = this.maxNotif();
    if (!fresh.length) return;
    const n = fresh[fresh.length - 1];
    const old = this.phone.querySelector('.banner');
    if (old) old.parentNode.removeChild(old);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'banner';
    b.innerHTML = '<span class="banner-i">' + ic(n.icon || 'bell', 16) + '</span><span class="banner-t"><b>' + (this.role === 'organiser' ? 'Trip Room' : 'WhatsApp') + '</b>' + E(n.text) + (fresh.length > 1 ? ' <em>+' + (fresh.length - 1) + ' more</em>' : '') + '</span><span class="banner-n">now</span>';
    b.addEventListener('click', function () {
      if (b.parentNode) b.parentNode.removeChild(b);
      if (n.go) self.openFromNotif(n.go);
    });
    const self2 = this;
    this.phone.appendChild(b);
    clearTimeout(this.timers.banner);
    this.timers.banner = setTimeout(function () { b.classList.add('out'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 300); }, 4600);
  };
  Phone.prototype.openFromNotif = function (go) {
    this.root_(go.screen, go.params || {});
  };
  Phone.prototype.renderLayer = function () {
    if (!this.sheet) { this.layer.innerHTML = ''; this.layer.classList.remove('on'); return; }
    const fn = T.sheets[this.sheet.id];
    this.layer.innerHTML = '<div class="scrim" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><i class="grab"></i>' + (fn ? fn(this, this.sheet.params) : '') + '</div>';
    this.layer.classList.add('on');
    const first = this.layer.querySelector('button, input, textarea');
    if (first && !this.sheetWasOpen) { /* keep focus on the sheet for keyboard users */ }
  };
  Phone.prototype.render = function (anim) {
    const cur = this.cur();
    const fn = T.screens[cur.id];
    const body = this.scr.querySelector('.body');
    const sameScreen = this.lastKey === cur.id + JSON.stringify(cur.params) + this.uid;
    const st = body && sameScreen ? body.scrollTop : 0;
    const active = document.activeElement;
    const keepId = active && this.root.contains(active) && active.id ? active.id : null;
    const keepSel = keepId && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
    let html;
    try { html = fn ? fn(this, cur.params) : '<div class="body"><p>Missing screen ' + E(cur.id) + '</p></div>'; }
    catch (e) { console.error('Screen error', cur.id, e); html = '<div class="body"><p class="err">Something went wrong on this screen.</p></div>'; }
    this.scr.innerHTML = '<div class="scr ' + (anim ? (this.dir === 'back' ? 'in-back' : 'in-fwd') : '') + '" data-screen="' + cur.id + '">' + html + '</div>';
    const nb = this.scr.querySelector('.body');
    if (nb && sameScreen && !anim) nb.scrollTop = st;
    this.lastKey = cur.id + JSON.stringify(cur.params) + this.uid;
    this.root.setAttribute('data-screen', cur.id);
    if (T.after[cur.id]) T.after[cur.id](this, this.scr);
    this.bindSlides();
    this.renderLayer();
    this.notifBanner();
    if (keepId) {
      const again = this.root.querySelector('#' + keepId);
      if (again) { again.focus(); if (keepSel && again.setSelectionRange) try { again.setSelectionRange(keepSel[0], keepSel[1]); } catch (e) { /* ignore */ } }
    }
  };
  Phone.prototype.bindSlides = function () {
    const self = this;
    Array.prototype.forEach.call(this.scr.querySelectorAll('[data-slide]'), function (el) {
      const knob = el.querySelector('.slide-knob'), fill = el.querySelector('.slide-fill');
      const name = el.getAttribute('data-slide');
      let drag = false, startX = 0, max = 0, done = false;
      function set(px) {
        const p = Math.max(0, Math.min(max, px));
        knob.style.transform = 'translateX(' + p + 'px)';
        fill.style.width = (p + 52) + 'px';
        el.setAttribute('aria-valuenow', String(Math.round(p / (max || 1) * 100)));
        el.classList.toggle('near', p / (max || 1) > 0.5);
        return p;
      }
      function finish() {
        done = true; el.classList.add('done');
        set(max);
        setTimeout(function () { const fn = T.on['slide:' + name]; if (fn) fn(self, null, el); }, 380);
      }
      knob.addEventListener('pointerdown', function (ev) {
        if (done) return;
        drag = true; startX = ev.clientX; max = el.clientWidth - 52 - 8;
        el.classList.add('drag');
        try { knob.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      });
      knob.addEventListener('pointermove', function (ev) {
        if (!drag) return;
        const scale = self.phone.getBoundingClientRect().width / 390 || 1;
        set((ev.clientX - startX) / scale);
      });
      function up(ev) {
        if (!drag) return;
        drag = false; el.classList.remove('drag');
        const cur = parseFloat((knob.style.transform.match(/translateX\(([-\d.]+)px/) || [0, 0])[1]);
        if (cur / (max || 1) >= 0.86) finish(); else set(0);
      }
      knob.addEventListener('pointerup', up);
      knob.addEventListener('pointercancel', up);
      el.addEventListener('keydown', function (ev) {
        if ((ev.key === 'Enter' || ev.key === ' ') && !done) { ev.preventDefault(); max = el.clientWidth - 52 - 8; finish(); }
      });
    });
  };
  T.Phone = Phone;

  /* ---------- common handlers ---------- */
  T.on.noop = function () {};
  T.on.back = function (ph) { ph.back(); };
  T.on.go = function (ph, arg, el) {
    let q = {};
    try { q = JSON.parse(el.getAttribute('data-q') || '{}') || {}; } catch (e) { q = {}; }
    ph.go(arg, q);
  };
  T.on.rootgo = function (ph, arg, el) {
    let q = {};
    try { q = JSON.parse(el.getAttribute('data-q') || '{}') || {}; } catch (e) { q = {}; }
    ph.root_(arg, q);
  };
  T.on.sheet = function (ph, arg, el) {
    let q = {};
    try { q = JSON.parse(el.getAttribute('data-q') || '{}') || {}; } catch (e) { q = {}; }
    ph.openSheet(arg, q);
  };
  T.on.closeSheet = function (ph) { ph.closeSheet(); };
  T.on.copy = function (ph, arg) {
    try { if (navigator.clipboard) navigator.clipboard.writeText(arg).catch(function () {}); } catch (e) { /* ignore */ }
    ph.toast('Link copied', 'link');
  };
  T.on.me = function (ph) { ph.openSheet('me'); };
  T.sheets.me = function (ph) {
    const u = T.PEOPLE[ph.uid];
    return '<div class="sh-me">' + UI.av(ph.uid, 56) + '<div><h3>' + E(u.name) + '</h3><p>' + E(ph.role === 'organiser' ? 'Group coordinator' : 'Travelling friend') + ' · ' + E(u.phone) + '</p></div></div>' +
      '<div class="sh-list">' +
      '<div class="sh-row">' + ic('shield', 18) + '<span>Only you see your budget and your own itinerary</span></div>' +
      '<div class="sh-row">' + ic('lock', 18) + '<span>Payments are simulated. No money moves in this demo</span></div></div>' +
      '<div class="sh-actions">' + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
  };
})();
