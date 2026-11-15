/* Boot: builds the page shell, two phones that share one trip, and a director panel. */
(function () {
  const T = window.TR, UI = T.UI, E = UI.E, ic = window.icon, Q = T.q, P = T.PEOPLE;
  const params = new URLSearchParams(window.location.search);
  const STAGE_NAMES = ['Ask', 'Invite', 'Choose', 'Confirm', 'Pay', 'Booked'];
  let view = ['organiser', 'traveller', 'both'].indexOf(params.get('view')) >= 0 ? params.get('view') : 'both';
  let org, trav, bookingTimer = null;

  T.store.load();
  if (params.get('preset')) { T.store.preset(params.get('preset')); }
  if (params.get('focus') === '1') document.body.classList.add('focus');
  if (window.innerWidth < 1380) document.body.classList.add('no-dir');

  /* ---------- shell markup ---------- */
  function shell() {
    const app = document.getElementById('app');
    app.innerHTML =
      '<header class="bar-top"><div class="brand"><span class="brand-m">' + ic('compass', 18) + '</span><div><h1>Trip Room</h1><small>AI travel agent for Cleartrip · prototype · build 5</small></div></div>' +
      '<div class="segc" role="group" aria-label="Which phones to show"><button type="button" data-v="both">' + ic('users', 14) + 'Both</button><button type="button" data-v="organiser">Organiser</button><button type="button" data-v="traveller">Traveller</button></div>' +
      '<button type="button" class="tbtn focus-btn" id="focusBtn">' + ic('search', 14) + 'Focus</button>' +
      '<button type="button" class="tbtn" id="dirBtn">' + ic('sliders', 14) + 'Demo controls</button></header>' +
      '<button type="button" class="tbtn exit-focus" id="exitFocus">' + ic('x', 14) + 'Exit focus</button>' +
      '<main class="stage"><div class="phones">' +
      '<section class="pcol org" aria-label="Organiser phone"><div class="plrow"><span class="plabel"><i></i>Organiser · Ira</span></div><div class="pwrap"><div class="phone-host" id="orgHost"></div></div></section>' +
      '<section class="pcol trav" aria-label="Traveller phone"><div class="plrow"><span class="plabel"><i></i>Traveller · <span id="travName">Rhea</span></span><div class="persona" id="persona" role="group" aria-label="View as friend"></div></div><div class="pwrap"><div class="phone-host" id="travHost"></div></div></section>' +
      '</div><aside class="dir" id="dir" aria-label="Demo controls"></aside></main>';
    app.querySelector('.bar-top').addEventListener('click', function (ev) {
      const v = ev.target.closest('[data-v]');
      if (v) { view = v.getAttribute('data-v'); layout(); }
    });
    document.getElementById('focusBtn').addEventListener('click', function () { setFocus(true); });
    document.getElementById('exitFocus').addEventListener('click', function () { setFocus(false); });
    document.getElementById('dirBtn').addEventListener('click', function () { document.body.classList.toggle('no-dir'); syncBtns(); fit(); });
  }
  function setFocus(on) { document.body.classList.toggle('focus', on); fit(); }
  function syncBtns() {
    const b = document.getElementById('dirBtn');
    if (b) b.classList.toggle('on', !document.body.classList.contains('no-dir'));
  }

  /* ---------- layout and scaling: the phones take as much of the window as they can ---------- */
  function layout() {
    const app = document.getElementById('app');
    app.querySelector('.pcol.org').style.display = view === 'traveller' ? 'none' : '';
    app.querySelector('.pcol.trav').style.display = view === 'organiser' ? 'none' : '';
    Array.prototype.forEach.call(app.querySelectorAll('[data-v]'), function (b) { b.classList.toggle('on', b.getAttribute('data-v') === view); });
    syncBtns();
    fit();
  }
  function fit() {
    const w = window.innerWidth, h = window.innerHeight, focus = document.body.classList.contains('focus');
    const n = view === 'both' ? 2 : 1;
    const dockedDir = w >= 1380 && !document.body.classList.contains('no-dir') && !focus;
    const chrome = (focus ? 0 : 52) + 40 + 8 + 32;           // header, label row, gap, stage padding
    const availH = h - chrome;
    const availW = w - 48 - (dockedDir ? 344 : 0) - (n - 1) * 36;
    let sc = Math.min(availH / 868, availW / n / 414);
    if (w <= 560) sc = (w - 8) / 414;
    sc = Math.max(0.55, Math.min(1.6, sc));
    document.documentElement.style.setProperty('--sc', sc.toFixed(3));
  }

  /* ---------- persona chips ---------- */
  function personaState(uid) {
    const t = T.store.get().trip, m = t && t.members[uid];
    if (!t || !m || uid === 'ira' || t.stage === 'draft') return '';
    if (m.out) return 'out';
    if (m.paid) return 'done';
    return 'act';
  }
  function renderPersona() {
    const el = document.getElementById('persona');
    el.innerHTML = T.CONTACTS.map(function (u) {
      return '<button type="button" data-u="' + u + '" class="' + (trav.uid === u ? 'on' : '') + '" aria-pressed="' + (trav.uid === u) + '" aria-label="View as ' + E(P[u].name) + '" title="' + E(P[u].name) + '">' + UI.av(u, 24) + '<span class="st ' + personaState(u) + '"></span></button>';
    }).join('');
    document.getElementById('travName').textContent = P[trav.uid].name;
  }

  /* ---------- director panel ---------- */
  function ago(ts) { const s = Math.max(0, Math.round((Date.now() - ts) / 1000)); return s < 5 ? 'now' : s < 60 ? s + 's' : Math.round(s / 60) + 'm'; }
  function nextAction(m, t) {
    if (m.out) return null;
    if (t.stage === 'invited' && !m.answer) return 'Reply';
    if (t.stage === 'confirming' && !m.vote) return 'Approve';
    if (t.stage === 'pooling' && !m.paid) return 'Pay';
    return null;
  }
  function renderDir() {
    const t = T.store.get().trip, st = T.store.get();
    const idx = t ? T.orgHelpers.stageIndex(t) : 0;
    let h = '<h2>Demo controls</h2><p class="lead">Both phones share one live trip. Act as the friends here, or switch the traveller phone to be one of them.</p>';
    h += '<h3>Where the trip is</h3><div class="trk">' + STAGE_NAMES.map(function (n, i) { return '<i class="' + (t && i <= idx ? 'on' : '') + '" title="' + n + '"></i>'; }).join('') + '</div><div class="trk-l">' + (t ? E(T.orgHelpers.stageLabel(t)) : 'No trip yet. Start one on the organiser phone.') + '</div>';
    if (t) {
      h += '<h3>Friends</h3>';
      t.order.filter(function (u) { return u !== 'ira'; }).map(function (u) { return t.members[u]; }).forEach(function (m) {
        const act = nextAction(m, t), stt = Q.status(m);
        const sub = { invited: 'Invited', joined: 'Opened the invite', answered: 'Answered', approved: 'Approved', soft: 'Soft yes', paid: 'Paid', out: 'Out' }[stt] || stt;
        h += '<div class="dfr">' + UI.av(m.uid, 28) + '<span class="nm">' + E(P[m.uid].name) + '<small>' + sub + '</small></span>' +
          (act ? '<button type="button" class="dbtn" data-sim="' + m.uid + '">' + act + '</button>' : '') +
          '<button type="button" class="dbtn ghost" data-as="' + m.uid + '" title="Show this friend on the traveller phone">View</button></div>';
      });
      const any = t.order.some(function (u) { return u !== 'ira' && nextAction(t.members[u], t); });
      h += '<div style="margin-top:10px"><button type="button" class="dbtn block" data-simall ' + (any ? '' : 'disabled') + '>Everyone does the next step</button></div>';
    }
    h += '<h3>Jump to a moment</h3><div class="dchips">' + [['start', 'Fresh start'], ['room', 'Room ready'], ['invited', 'Invites sent'], ['answers', 'Answers in'], ['plan', 'Plan drafted'], ['confirm', 'Group confirming'], ['pool', 'Pool open'], ['booked', 'Booked']].map(function (p) { return '<button type="button" data-preset="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>';
    h += '<p class="hint">Jumping replays the steps with simulated friends and a Goa plan. Dev can’t make it in this script.</p>';
    h += '<h3>Activity</h3>' + (st.log.length ? '<ul class="alog">' + st.log.slice(0, 8).map(function (l) { return '<li><time>' + ago(l.ts) + '</time><span>' + E(l.text) + '</span></li>'; }).join('') + '</ul>' : '<p class="hint">Nothing yet.</p>');
    h += '<div style="margin-top:16px;display:flex;gap:8px"><button type="button" class="dbtn ghost block" data-reset>Reset the demo</button></div>';
    h += '<p class="hint">Payments, flights and prices are simulated. State is kept in this browser; open the page in two tabs to use one as each person.</p>';
    document.getElementById('dir').innerHTML = h;
  }
  function bindDir() {
    document.getElementById('dir').addEventListener('click', function (ev) {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-sim')) { T.sim.next(b.getAttribute('data-sim')); T.store.commit(); }
      else if (b.hasAttribute('data-simall')) { T.sim.all(); T.store.commit(); }
      else if (b.hasAttribute('data-as')) { trav.setUser(b.getAttribute('data-as')); renderPersona(); renderDir(); }
      else if (b.hasAttribute('data-preset')) { resetPhones(); T.store.preset(b.getAttribute('data-preset')); T.store.commit(); }
      else if (b.hasAttribute('data-reset')) { resetPhones(); T.store.reset(); }
    });
    document.getElementById('persona').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-u]'); if (!b) return;
      trav.setUser(b.getAttribute('data-u'));
      renderPersona();
    });
  }
  function resetPhones() {
    [org, trav].forEach(function (ph) { ph.stacks = {}; ph.local = {}; ph.sheet = null; });
  }

  /* ---------- booking runs by itself ---------- */
  function watchBooking() {
    const t = T.store.get().trip;
    if (t && t.stage === 'booking' && !bookingTimer) {
      bookingTimer = setTimeout(function () { bookingTimer = null; const tt = T.store.get().trip; if (tt && tt.stage === 'booking') { T.act.finishBooking(); } }, 3700);
    }
    if ((!t || t.stage !== 'booking') && bookingTimer) { clearTimeout(bookingTimer); bookingTimer = null; }
  }

  /* ---------- re-render everything when the state changes ---------- */
  function refresh() {
    [org, trav].forEach(function (ph) {
      // do not rebuild a sheet that holds typed text; the draft lives in the sheet
      if (ph.sheet && (ph.sheet.id === 'addContact' || ph.sheet.id === 'editItem')) { ph.renderBehindSheet = true; }
      if (ph.sheet && ph.sheet.id === 'addContact') return;
      ph.render();
    });
    renderPersona();
    renderDir();
    watchBooking();
  }

  function boot() {
    document.documentElement.removeAttribute('data-theme');
    shell();
    org = new T.Phone(document.getElementById('orgHost'), 'organiser', 'ira');
    const as = params.get('as');
    trav = new T.Phone(document.getElementById('travHost'), 'traveller', as && P[as] && as !== 'ira' ? as : 'rhea');
    org.seen.ira = org.maxNotif();
    trav.seen[trav.uid] = trav.maxNotif();
    bindDir();
    layout();
    org.render(); trav.render();
    renderPersona(); renderDir(); watchBooking();
    T.store.subscribe(refresh);
    window.addEventListener('resize', fit);
    window.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && document.body.classList.contains('focus')) setFocus(false);
      if ((ev.key === 'f' || ev.key === 'F') && !ev.metaKey && !ev.ctrlKey && !/INPUT|TEXTAREA|SELECT/.test((ev.target.tagName || ''))) setFocus(!document.body.classList.contains('focus'));
    });
    window.addEventListener('storage', function (ev) {
      if (ev.key !== 'tripRoom.v1' || !ev.newValue) return;
      try { T.store.replace(JSON.parse(ev.newValue)); } catch (e) { /* ignore */ }
    });
    setInterval(renderDir, 20000);
    window.TRIP = { org: org, trav: trav, store: T.store };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
