/* Itinerary screens used by both roles: my trip, free time, ideas, add your own, edit, today, settle up.
   The group plan is locked. Everything else on the days is the traveller's to shape. */
(function () {
  const T = window.TR, UI = T.UI, E = UI.E, ic = window.icon, Q = T.q, A = T.act;
  const S = T.screens, H = T.on, P = T.PEOPLE;
  const q = function (o) { return E(JSON.stringify(o)); };

  function nav(ph, active) {
    if (ph.role === 'organiser') {
      return UI.nav([
        { id: 'home', icon: 'home', act: 'rootgo', p: 'o.home', label: 'Home' },
        { id: 'trip', icon: 'compass', act: 'orgTrip', label: 'Trip' },
        { id: 'wallet', icon: 'wallet', act: 'orgWallet', label: 'Wallet' },
        { id: 'me', icon: 'user', act: 'me', label: 'Profile' }], active);
    }
    return UI.nav([
      { id: 'home', icon: 'home', act: 'rootgo', p: 't.hub', label: 'Home' },
      { id: 'trip', icon: 'compass', act: 'travTrip', label: 'My trip' },
      { id: 'wallet', icon: 'wallet', act: 'travWallet', label: 'Wallet' },
      { id: 'me', icon: 'user', act: 'me', label: 'Profile' }], active);
  }
  function dlabel(i) { const d = Q.dayLabel(i); return d.dow + ' ' + d.date + ' ' + d.mon; }
  function range(a, b) { return T.clock(a).replace(':00', '') + ' – ' + T.clock(b).replace(':00', ''); }
  function hrs(a, b) { const m = T.mins(b) - T.mins(a); return m >= 60 ? (m % 60 ? (m / 60).toFixed(1).replace('.0', '') : m / 60) + ' h' : m + ' min'; }
  function mm(m) { return m >= 60 ? (m % 60 ? (m / 60).toFixed(1).replace('.0', '') : m / 60) + ' h' : m + ' min'; }
  function tshort(t) { return T.clock(t).replace(':00', '').replace(' ', ' '); }
  function pendingInvites(uid) {
    const t = T.store.get().trip;
    return (t.items || []).filter(function (it) { return it.owner !== uid && it.joiners.some(function (j) { return j.uid === uid && j.state === 'invited'; }); });
  }
  function ledgerFor(uid) {
    const t = T.store.get().trip;
    return (t.ledger || []).filter(function (l) { return l.active && (l.from === uid || l.to === uid); });
  }
  function destId() { return T.store.get().trip.plan.destId; }
  function friendsOf(uid) { return Q.activeMembers().filter(function (m) { return m.uid !== uid; }); }
  function firstFree(uid, day, dur, from) {
    for (let m = (from ? T.mins(from) : 8 * 60); m + dur <= 23 * 60; m += 30) {
      if (!Q.clashFor(uid, day, T.hhmm(m), T.hhmm(m + dur))) return T.hhmm(m);
    }
    return null;
  }
  const VIS = [['me', 'Only me'], ['joined', 'Friends in it'], ['group', 'Everyone']];

  /* ---------- My trip ---------- */
  S['x.trip'] = function (ph, p) {
    const t = T.store.get().trip, uid = ph.uid;
    if (!t || t.stage !== 'booked' || !Q.member(uid) || Q.member(uid).out) {
      return '<div class="body">' + UI.top({ title: 'My trip', back: false }) + UI.empty('compass', 'Your itinerary appears after booking', 'Once the pool is full and everything is booked, your days show up here.') + '</div>' + nav(ph, 'trip');
    }
    const key = 'day-' + uid;
    if (p && p.day != null) ph.local[key] = p.day;
    const day = ph.local[key] || 0;
    const f = Q.pickedFlight(uid), dest = T.DEST[t.plan.destId];
    const items = Q.itemsFor(uid).filter(function (i) { return i.day === day; });
    const others = Q.groupVisibleOthers(uid).filter(function (i) { return i.day === day; });
    const slots = Q.freeSlots(uid, day);
    const entries = items.map(function (i) { return { s: T.mins(i.start), k: 'item', i: i }; })
      .concat(slots.map(function (s) { return { s: T.mins(s.start), k: 'slot', i: s }; }))
      .concat(others.map(function (i) { return { s: T.mins(i.start), k: 'other', i: i }; }))
      .sort(function (a, b) { return a.s - b.s; });
    const invs = pendingInvites(uid), owed = ledgerFor(uid).filter(function (l) { return !l.settled && l.from === uid; });
    const nLocked = items.filter(function (i) { return i.locked && !i.skipped; }).length;
    const nMine = items.filter(function (i) { return i.kind === 'personal'; }).length;
    const freeMin = slots.reduce(function (a, s) { return a + T.mins(s.end) - T.mins(s.start); }, 0);
    return '<div class="body">' + UI.top({ title: 'My trip', back: false, right: UI.rbtn('cal', 'go', 'x.today', 'Today view') }) +
      '<button type="button" class="bpass" data-a="sheet" data-p="doc" data-q="' + q({ k: 'flight' }) + '"><span class="bp-l"><small>' + E(f.carrier) + '</small><b>' + f.from + '<i>' + ic('plane', 16) + '</i>' + E(dest.code) + '</b><em>' + E(dlabel(0)) + ' · ' + E(f.out) + ' · seats ' + E(f.seats.split('–')[0]) + '</em></span><span class="bp-r">' + ic('qr', 28) + '<small>Tap to open</small></span></button>' +
      (invs.length ? invs.map(function (it) { return '<button type="button" class="note inv" data-a="go" data-p="x.invite" data-q="' + q({ id: it.id }) + '">' + ic('userplus', 16) + '<span><b>' + E(P[it.owner].name) + '</b> invited you to ' + E(it.title) + '</span>' + ic('chevR', 16) + '</button>'; }).join('') : '') +
      '<div class="days scroll">' + Array.apply(null, Array(Q.dayCount())).map(function (_, i) { const d = Q.dayLabel(i); return '<button type="button" class="day' + (i === day ? ' on' : '') + '" data-a="setDay" data-p="' + i + '"><small>' + d.dow + '</small><b>' + d.date + '</b></button>'; }).join('') + '</div>' +
      '<div class="sumrow"><span>' + ic('lock', 13) + nLocked + ' group, locked</span><span class="m">' + ic('sparkles', 13) + nMine + ' mine</span><span class="f">' + ic('plus', 13) + (freeMin ? mm(freeMin) + ' free' : 'No free time') + '</span></div>' +
      '<div class="tl">' + entries.map(function (e) {
        if (e.k === 'slot') {
          const s = e.i;
          return '<button type="button" class="tl-r free" data-a="go" data-p="x.ideas" data-q="' + q({ day: s.day, start: s.start, end: s.end }) + '"><span class="tl-t">' + E(T.clock(s.start).replace(':00', '')) + '</span><span class="tl-c"><i>' + ic('plus', 16) + '</i><span class="tl-x"><b>Free time</b><small>' + E(range(s.start, s.end)) + ' · ' + hrs(s.start, s.end) + ' · add something</small></span></span></button>';
        }
        const i = e.i;
        if (e.k === 'other') return '<div class="tl-r other"><span class="tl-t">' + E(T.clock(i.start).replace(':00', '')) + '</span><span class="tl-c">' + UI.av(i.owner, 24) + '<b>' + E(P[i.owner].name) + ': ' + E(i.title) + '</b><small>Friends can see this</small></span></div>';
        const mine = i.kind === 'personal';
        const photo = i.img ? '<span class="thumb" style="background-image:' + UI.img(i.img) + '"></span>' : '<i class="pr-i sm">' + ic(i.icon || 'pin', 16) + '</i>';
        let tag;
        if (i.skipped) tag = ic('x', 14) + 'Skipping · tap to rejoin';
        else if (mine) tag = ic('edit', 14) + (i.owner === uid ? (i.visibility === 'group' ? 'Mine · everyone sees' : i.joiners.length ? 'Mine · with ' + i.joiners.filter(function (j) { return j.state !== 'passed'; }).length : 'Mine') : 'With ' + E(P[i.owner].name));
        else tag = ic('lock', 14) + (i.skippable ? 'Group · tap to skip' : 'Group');
        return '<button type="button" class="tl-r' + (mine ? ' mine' : '') + (i.skipped ? ' skipped' : '') + '" data-a="sheet" data-p="' + (mine ? 'editItem' : 'groupItem') + '" data-q="' + q({ id: i.id }) + '"><span class="tl-t">' + E(T.clock(i.start).replace(':00', '')) + '</span><span class="tl-c">' + photo + '<span class="tl-x"><b>' + E(i.title) + '</b><small>' + E(range(i.start, i.end)) + ' · ' + E(i.sub || '') + '</small></span><em>' + tag + '</em></span></button>';
      }).join('') + '</div>' +
      '<div class="actrow"><button type="button" class="mini big" data-a="go" data-p="x.ideas" data-q="' + q({ day: day }) + '">' + ic('sparkles', 14) + 'Ideas</button><button type="button" class="mini big" data-a="go" data-p="x.custom" data-q="' + q({ day: day }) + '">' + ic('plus', 14) + 'Add your own</button></div>' +
      '<div class="actrow tight"><button type="button" class="mini big" data-a="go" data-p="x.settle">' + ic('wallet', 14) + 'Settle up' + (owed.length ? ' <i class="cnt">' + owed.length + '</i>' : '') + '</button></div></div>' + nav(ph, 'trip');
  };
  H.setDay = function (ph, i) { ph.local['day-' + ph.uid] = parseInt(i, 10); ph.render(); };

  /* ---------- Group item sheet: details, and skip ---------- */
  T.sheets.groupItem = function (ph, p) {
    const it = Q.itemsFor(ph.uid).find(function (x) { return x.id === p.id; });
    if (!it) return '<h3>Not found</h3><div class="sh-actions">' + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
    const thumb = it.img ? '<span class="thumb lg" style="background-image:' + UI.img(it.img) + '"></span>' : '<i class="pr-i">' + ic(it.icon || 'pin', 20) + '</i>';
    let actions;
    if (it.skippable && !it.skipped) {
      actions = '<div class="note">' + ic('info', 16) + '<span>Skipping frees this slot for you. Your share stays in the pool and nothing changes for the others.</span></div>' +
        '<div class="sh-actions col">' + UI.btn('Skip this plan', 'skipGroup', it.id, { kind: 'danger', block: true, icon: 'x' }) + UI.btn('Keep it', 'closeSheet', '', { kind: 'pri', block: true }) + '</div>';
    } else if (it.skipped) {
      actions = '<div class="note warn">' + ic('alert', 16) + '<span>You are skipping this. Ira knows.</span></div><div class="sh-actions col">' + UI.btn('Rejoin the group plan', 'unskipGroup', it.id, { kind: 'pri', block: true, icon: 'check' }) + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
    } else {
      actions = '<div class="note">' + ic('lock', 16) + '<span>Booked for the whole group. The free time around it is yours.</span></div><div class="sh-actions col">' + UI.btn('Close', 'closeSheet', '', { kind: 'pri', block: true }) + '</div>';
    }
    return '<div class="sh-me">' + thumb + '<div><h3>' + E(it.title) + '</h3><p>' + E(dlabel(it.day)) + ' · ' + E(range(it.start, it.end)) + '</p></div></div>' +
      '<div class="chips tight"><span class="pill">' + ic('lock', 12) + 'Group</span>' + (it.price ? '<span class="pill">' + T.fmt(it.price) + ' each · paid from the pool</span>' : '<span class="pill">Nothing extra to pay</span>') + '</div>' +
      '<p class="sh-p">' + E(it.sub || '') + '</p>' + actions;
  };
  H.skipGroup = function (ph, id) { A.skipGroup(ph.uid, id, true); ph.closeSheet(); ph.render(); ph.toast('Skipped. Your slot is free', 'check'); };
  H.unskipGroup = function (ph, id) { A.skipGroup(ph.uid, id, false); ph.closeSheet(); ph.render(); ph.toast('Back on the group plan', 'check'); };

  /* ---------- Ideas for a free slot ---------- */
  const CATS = ['All', 'Adventure', 'Food', 'Culture', 'Chill'];
  S['x.ideas'] = function (ph, p) {
    const uid = ph.uid, day = p.day || 0;
    let slot = p.start ? { day: day, start: p.start, end: p.end } : null;
    if (!slot) { const sl = Q.freeSlots(uid, day).sort(function (a, b) { return (T.mins(b.end) - T.mins(b.start)) - (T.mins(a.end) - T.mins(a.start)); }); slot = sl[0] || null; }
    const cat = ph.local.ideacat || 'All', fit = !!ph.local.ideafit, free = !!ph.local.ideafree;
    let list = T.ideasFor(destId()).map(function (i) { return { i: i, starts: Q.ideaStarts(i, slot) }; });
    if (cat !== 'All') list = list.filter(function (x) { return x.i.cat === cat; });
    if (fit) list = list.filter(function (x) { return x.starts.length; });
    if (free) list = list.filter(function (x) { return !x.i.price; });
    return '<div class="body">' + UI.top({ title: 'Ideas for your free time' }) +
      '<div class="note ok">' + ic('clock', 16) + '<span>' + E(dlabel(day)) + (slot ? ' · ' + E(range(slot.start, slot.end)) + ' · ' + hrs(slot.start, slot.end) + ' free' : ' · pick any time') + '</span></div>' +
      '<div class="chips tight hscroll">' + CATS.map(function (c) { return UI.chip(c, { active: cat === c, act: 'ideacat', p: c }); }).join('') + '</div>' +
      '<div class="chips tight">' + UI.chip('Fits this slot', { active: fit, act: 'ideafit', p: '' }) + UI.chip('Free', { active: free, act: 'ideafree', p: '' }) + '</div>' +
      '<button type="button" class="idea own" data-a="go" data-p="x.custom" data-q="' + q({ day: day, start: slot ? slot.start : null }) + '"><i class="pr-i">' + ic('edit', 18) + '</i><span class="crow-t"><b>Add your own plan</b><small>A meal, a cab, a rest, a reminder or anything else</small></span>' + ic('chevR', 16) + '</button>' +
      (list.length ? list.map(function (x) {
        const i = x.i, ok = x.starts.length;
        return '<button type="button" class="idea" data-a="go" data-p="x.idea" data-q="' + q({ id: i.id, day: day, start: slot ? slot.start : null, end: slot ? slot.end : null }) + '"><span class="thumb lg" style="background-image:' + UI.img(i.img) + '"></span><span class="crow-t"><b>' + E(i.name) + '</b><small>' + E(i.sub) + '</small><em>' + (i.price ? T.fmt(i.price) + ' each' : 'Free') + ' · ' + mm(i.dur) + ' · ' + E(i.away) + '</em>' +
          (slot ? (ok ? '<span class="tg ok">' + ic('check', 11) + 'Fits · from ' + E(T.clock(x.starts[0])) + '</span>' : '<span class="tg warn">' + ic('alert', 11) + 'Tight for this slot</span>') : '') + '</span>' + ic('chevR', 16) + '</button>';
      }).join('') : UI.empty('search', 'Nothing matches', 'Try another category, or add your own plan.')) + '</div>';
  };
  H.ideacat = function (ph, v) { ph.local.ideacat = v; ph.render(); };
  H.ideafit = function (ph) { ph.local.ideafit = !ph.local.ideafit; ph.render(); };
  H.ideafree = function (ph) { ph.local.ideafree = !ph.local.ideafree; ph.render(); };

  /* ---------- shared add flow: clash check, then commit ---------- */
  function tryAdd(ph, spec, durMin, altFinder) {
    const end = T.hhmm(T.mins(spec.start) + durMin);
    const clash = Q.clashFor(ph.uid, spec.day, spec.start, end);
    ph.local.pending = { spec: spec, dur: durMin };
    if (clash) {
      ph.openSheet('clash', { withTitle: clash.title, withRange: range(clash.start, clash.end), alt: altFinder ? altFinder() : null });
      return;
    }
    commitAdd(ph);
  }
  function commitAdd(ph) {
    const it = A.addItem(ph.uid, ph.local.pending.spec);
    ph.local.pending = null;
    ph.local.idea = null; ph.local.cust = null;
    ph.closeSheet();
    ph.go('x.added', { id: it.id });
  }
  T.sheets.clash = function (ph, p) {
    return '<div class="clash"><span class="big-check warn">' + ic('alert', 24) + '</span><h3>This overlaps your plan</h3><p class="sh-p">' + E(p.withTitle) + ' runs ' + E(p.withRange) + '. Pick what you want to do.</p></div>' +
      '<div class="sh-actions col">' + (p.alt ? UI.btn('Move to ' + T.clock(p.alt).replace(':00', ''), 'clashMove', p.alt, { kind: 'pri', block: true, icon: 'clock' }) : '') +
      UI.btn('Keep both anyway', 'clashKeep', '', { kind: 'sec', block: true }) + UI.btn('Change my plan', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
  };
  H.clashMove = function (ph, alt) { ph.local.pending.spec.start = alt; commitAdd(ph); };
  H.clashKeep = function (ph) { commitAdd(ph); };

  /* ---------- Idea detail ---------- */
  function ideaLocal(ph, p) {
    const key = 'idea:' + p.id + ':' + p.day;
    if (!ph.local.idea || ph.local.idea.key !== key) {
      const idea = T.IDEAS.find(function (i) { return i.id === p.id; });
      const slot = p.start ? { day: p.day, start: p.start, end: p.end } : null;
      const fits = Q.ideaStarts(idea, slot), all = Q.ideaStarts(idea, null);
      ph.local.idea = { key: key, start: fits[0] || all[0], joiners: [], payer: 'split', vis: 'me' };
    }
    return ph.local.idea;
  }
  function visSeg(cur, hasJoiners, act) {
    return '<div class="seg">' + VIS.map(function (o) { const dis = o[0] === 'me' && hasJoiners; return '<button type="button" class="' + (cur === o[0] || (o[0] === 'joined' && cur === 'me' && hasJoiners) ? 'on' : '') + '"' + (dis ? ' disabled' : '') + ' data-a="' + act + '" data-p="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  S['x.idea'] = function (ph, p) {
    const uid = ph.uid, idea = T.IDEAS.find(function (i) { return i.id === p.id; }), L = ideaLocal(ph, p);
    const starts = Q.ideaStarts(idea, null);
    const end = T.hhmm(T.mins(L.start) + idea.dur);
    const clash = Q.clashFor(uid, p.day, L.start, end);
    const friends = friendsOf(uid);
    const n = L.joiners.length;
    let pay = idea.price ? T.fmt(idea.price) : 'Free', payNote = '';
    if (n && idea.price) {
      if (L.payer === 'me') { pay = T.fmt(idea.price * (n + 1)); payNote = 'You pay for ' + (n + 1) + ', no settle up'; }
      else if (L.payer === 'split') { pay = T.fmt(idea.price * (n + 1)); payNote = 'You pay now, ' + n + ' friend' + (n > 1 ? 's' : '') + ' pay you back ' + T.fmt(idea.price) + ' each'; }
      else { payNote = 'Everyone pays ' + T.fmt(idea.price) + ' at the venue'; pay = T.fmt(idea.price); }
    }
    return '<div class="body nopad"><div class="ideahero" style="background-image:' + UI.img(idea.img) + '"><div class="sh-top">' + UI.rbtn('back', 'back', '', 'Back', 'glass') + '</div><div class="sh-b"><span class="pill lime">' + (idea.price ? T.fmt(idea.price) + ' per person' : 'Free') + '</span><h1>' + E(idea.name) + '</h1><p>' + E(idea.sub) + ' · ' + E(idea.away) + '</p></div></div>' +
      '<div class="pad16"><div class="fl">START TIME · ' + E(dlabel(p.day)).toUpperCase() + '</div><div class="chips">' + starts.map(function (s) {
        const c = Q.clashFor(uid, p.day, s, T.hhmm(T.mins(s) + idea.dur));
        return UI.chip(tshort(s) + (c ? ' !' : ''), { active: L.start === s, act: 'ideaStart', p: s, noTick: true });
      }).join('') + '</div>' +
      (clash ? '<div class="note warn">' + ic('alert', 16) + '<span>Overlaps ' + E(clash.title) + ' (' + E(range(clash.start, clash.end)) + ')</span></div>' : '<div class="note ok">' + ic('check', 16) + '<span>' + E(range(L.start, end)) + ' · nothing else planned</span></div>') +
      '<div class="fl">WHO JOINS?</div><div class="chips">' + (friends.length ? friends.map(function (m) { return UI.chip(P[m.uid].name, { active: L.joiners.indexOf(m.uid) >= 0, act: 'ideaJoin', p: m.uid }); }).join('') : '<span class="muted">Nobody else is travelling yet</span>') + '</div>' +
      (n && idea.price ? '<div class="fl">WHO PAYS?</div><div class="seg">' + [['me', 'I pay for all'], ['split', 'Split'], ['own', 'Pay own']].map(function (o) { return '<button type="button" class="' + (L.payer === o[0] ? 'on' : '') + '" data-a="ideaPayer" data-p="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' : '') +
      '<div class="fl">WHO SEES IT?</div>' + visSeg(L.vis, n > 0, 'ideaVis') +
      '<div class="card share tot2"><div class="yr"><span>You pay</span><b>' + pay + '</b></div>' + (payNote ? '<p class="fine">' + ic('info', 12) + ' ' + E(payNote) + '</p>' : '') + '<p class="fine">' + ic('refresh', 12) + ' ' + E(idea.cancel) + '</p></div></div></div>' +
      UI.dock({ cue: 'It joins your itinerary', label: clash ? 'Check the clash' : 'Add to my itinerary', act: 'ideaAdd', p: JSON.stringify(p) });
  };
  H.ideaStart = function (ph, s) { ph.local.idea.start = s; ph.render(); };
  H.ideaJoin = function (ph, u) { const L = ph.local.idea, i = L.joiners.indexOf(u); if (i >= 0) L.joiners.splice(i, 1); else L.joiners.push(u); if (L.joiners.length && L.vis === 'me') L.vis = 'joined'; if (!L.joiners.length && L.vis === 'joined') L.vis = 'me'; ph.render(); };
  H.ideaPayer = function (ph, v) { ph.local.idea.payer = v; ph.render(); };
  H.ideaVis = function (ph, v) { ph.local.idea.vis = v; ph.render(); };
  H.ideaAdd = function (ph, arg) {
    const p = JSON.parse(arg), L = ph.local.idea, idea = T.IDEAS.find(function (i) { return i.id === p.id; });
    const spec = { ideaId: idea.id, day: p.day, start: L.start, joiners: L.joiners.slice(), payer: L.payer, visibility: L.vis };
    tryAdd(ph, spec, idea.dur, function () {
      return Q.ideaStarts(idea, null).filter(function (s) { return !Q.clashFor(ph.uid, p.day, s, T.hhmm(T.mins(s) + idea.dur)); })[0] || null;
    });
  };

  /* ---------- Add your own plan ---------- */
  const DURS = [[30, '30 min'], [60, '1 h'], [90, '1.5 h'], [120, '2 h'], [180, '3 h']];
  function custLocal(ph, p) {
    if (!ph.local.cust) {
      const day = p.day || 0, k = T.CUSTOM_KINDS[0];
      const start = p.start && Q.clashFor(ph.uid, day, p.start, T.hhmm(T.mins(p.start) + 60)) === null ? p.start : (firstFree(ph.uid, day, k.dur, p.start || k.start) || k.start);
      ph.local.cust = { kind: k.id, title: k.title, day: day, start: start, dur: k.dur, price: '', joiners: [], payer: 'split', vis: 'me', note: '', touched: false };
    }
    return ph.local.cust;
  }
  S['x.custom'] = function (ph, p) {
    const uid = ph.uid, L = custLocal(ph, p), n = L.joiners.length, price = parseInt(L.price, 10) || 0;
    const clash = Q.clashFor(uid, L.day, L.start, T.hhmm(T.mins(L.start) + L.dur));
    const times = [];
    for (let m = 7 * 60; m <= 22 * 60 + 30; m += 30) times.push(T.hhmm(m));
    const friends = friendsOf(uid);
    return '<div class="body">' + UI.top({ title: 'Add your own plan' }) +
      '<p class="sub">The group bookings stay locked. This part of your days is yours.</p>' +
      '<div class="kinds">' + T.CUSTOM_KINDS.map(function (k) { return '<button type="button" class="kind' + (L.kind === k.id ? ' on' : '') + '" data-a="custKind" data-p="' + k.id + '" aria-pressed="' + (L.kind === k.id) + '"><i>' + ic(k.icon, 18) + '</i><span>' + k.label + '</span></button>'; }).join('') + '</div>' +
      '<label class="lab">What is the plan?<input id="custTitle" class="inp" data-in="custtitle" type="text" maxlength="48" placeholder="e.g. Dinner at the lighthouse café" value="' + E(L.title) + '" autocomplete="off"></label>' +
      '<div class="fl">DAY</div><div class="chips">' + Array.apply(null, Array(Q.dayCount())).map(function (_, i) { const d = Q.dayLabel(i); return UI.chip(d.dow + ' ' + d.date, { active: L.day === i, act: 'custDay', p: i, noTick: true }); }).join('') + '</div>' +
      '<div class="fl">STARTS</div><div class="chips hscroll tight">' + times.map(function (s) { const c = Q.clashFor(uid, L.day, s, T.hhmm(T.mins(s) + L.dur)); return UI.chip(tshort(s) + (c ? ' !' : ''), { active: L.start === s, act: 'custStart', p: s, noTick: true }); }).join('') + '</div>' +
      '<div class="fl">HOW LONG</div><div class="chips">' + DURS.map(function (d) { return UI.chip(d[1], { active: L.dur === d[0], act: 'custDur', p: d[0], noTick: true }); }).join('') + '</div>' +
      (clash ? '<div class="note warn">' + ic('alert', 16) + '<span>Overlaps ' + E(clash.title) + ' (' + E(range(clash.start, clash.end)) + ')</span></div>' : '<div class="note ok">' + ic('check', 16) + '<span>' + E(range(L.start, T.hhmm(T.mins(L.start) + L.dur))) + ' · nothing else planned</span></div>') +
      '<label class="lab">Cost per person, if any<span class="rup"><b>₹</b><input id="custPrice" class="inp" data-in="custprice" type="number" inputmode="numeric" min="0" max="50000" placeholder="0" value="' + E(L.price) + '"></span></label>' +
      '<div class="fl">WHO JOINS?</div><div class="chips">' + (friends.length ? friends.map(function (m) { return UI.chip(P[m.uid].name, { active: L.joiners.indexOf(m.uid) >= 0, act: 'custJoin', p: m.uid }); }).join('') : '<span class="muted">Nobody else is travelling yet</span>') + '</div>' +
      (n && price ? '<div class="fl">WHO PAYS?</div><div class="seg">' + [['me', 'I pay for all'], ['split', 'Split'], ['own', 'Pay own']].map(function (o) { return '<button type="button" class="' + (L.payer === o[0] ? 'on' : '') + '" data-a="custPayer" data-p="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' : '') +
      '<div class="fl">WHO SEES IT?</div>' + visSeg(L.vis, n > 0, 'custVis') +
      '<label class="lab">Note to yourself<textarea id="custNote" class="inp ta" data-in="custnote" rows="2" maxlength="140" placeholder="Booking name, address, what to carry">' + E(L.note) + '</textarea></label></div>' +
      UI.dock({ cue: 'It joins your itinerary', label: clash ? 'Check the clash' : 'Add to my itinerary', act: 'custAdd', disabled: !L.title.trim() });
  };
  H.custKind = function (ph, id) {
    const L = ph.local.cust, k = T.CUSTOM_KINDS.find(function (x) { return x.id === id; });
    const prevKind = T.CUSTOM_KINDS.find(function (x) { return x.id === L.kind; });
    if (!L.touched || L.title === prevKind.title) L.title = k.title;
    L.kind = id; L.dur = k.dur;
    const f = firstFree(ph.uid, L.day, L.dur, k.start);
    L.start = f || L.start;
    ph.render();
  };
  H['in:custtitle'] = function (ph, v) { const L = ph.local.cust; L.title = v; L.touched = true; const b = ph.scr.querySelector('.cta'); if (b) b.disabled = !v.trim(); };
  H['in:custprice'] = function (ph, v) { ph.local.cust.price = v; };
  H['in:custnote'] = function (ph, v) { ph.local.cust.note = v; };
  H.custDay = function (ph, i) { const L = ph.local.cust; L.day = parseInt(i, 10); const f = firstFree(ph.uid, L.day, L.dur, L.start); L.start = f || L.start; ph.render(); };
  H.custStart = function (ph, s) { ph.local.cust.start = s; ph.render(); };
  H.custDur = function (ph, d) { ph.local.cust.dur = parseInt(d, 10); ph.render(); };
  H.custJoin = function (ph, u) { const L = ph.local.cust, i = L.joiners.indexOf(u); if (i >= 0) L.joiners.splice(i, 1); else L.joiners.push(u); if (L.joiners.length && L.vis === 'me') L.vis = 'joined'; if (!L.joiners.length && L.vis === 'joined') L.vis = 'me'; ph.render(); };
  H.custPayer = function (ph, v) { ph.local.cust.payer = v; ph.render(); };
  H.custVis = function (ph, v) { ph.local.cust.vis = v; ph.render(); };
  H.custAdd = function (ph) {
    const L = ph.local.cust, k = T.CUSTOM_KINDS.find(function (x) { return x.id === L.kind; });
    if (!L.title.trim()) { ph.toast('Give the plan a name first', 'info'); return; }
    const spec = { title: L.title, icon: k.icon, price: parseInt(L.price, 10) || 0, dur: L.dur, sub: L.note ? L.note : k.label, note: L.note, day: L.day, start: L.start, joiners: L.joiners.slice(), payer: L.payer, visibility: L.vis };
    tryAdd(ph, spec, L.dur, function () { return firstFree(ph.uid, L.day, L.dur, L.start); });
  };

  /* ---------- Added ---------- */
  S['x.added'] = function (ph, p) {
    const t = T.store.get().trip, it = t.items.find(function (x) { return x.id === p.id; });
    if (!it) return '<div class="body">' + UI.empty('info', 'Already removed', 'This item is no longer on your itinerary.') + '</div>' + UI.dock({ cue: 'Back to your trip', label: 'My itinerary', act: 'rootgo', p: 'x.trip' });
    const you = it.price ? (it.payer === 'me' || it.payer === 'split' ? it.price * (it.joiners.length + 1) : it.price) : 0;
    return '<div class="body center-col"><span class="big-check">' + ic('check', 28) + '</span><h1 class="big c">' + E(it.title) + ' is in your day</h1><p class="sub c">' + E(dlabel(it.day)) + ' · ' + E(range(it.start, it.end)) + '</p>' +
      '<div class="card rows"><div class="prow static"><i class="pr-i">' + ic('wallet', 18) + '</i><span class="pr-t"><b>You pay</b><small>' + (it.price ? (it.payer === 'own' || !it.joiners.length ? 'At the venue' : it.payer === 'me' ? 'For ' + (it.joiners.length + 1) + ' people' : 'Friends settle up with you') : 'Nothing to pay') + '</small></span><b class="pr-r">' + (you ? T.fmt(you) : 'Free') + '</b></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('users', 18) + '</i><span class="pr-t"><b>' + (it.joiners.length ? 'Invited ' + it.joiners.map(function (j) { return P[j.uid].name; }).join(', ') : 'Just you') + '</b><small>' + (it.visibility === 'group' ? 'Everyone can see it' : it.visibility === 'joined' ? 'Only the friends in it' : 'Only you') + '</small></span></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('refresh', 18) + '</i><span class="pr-t"><b>' + E(it.cancel) + '</b><small>Change or remove it any time</small></span></div></div></div>' +
      UI.dock({ cue: 'Back to your itinerary', label: 'See my itinerary', act: 'rootgo', p: 'x.trip', q: JSON.stringify({ day: it.day }), under: '<button type="button" class="under-btn" data-a="go" data-p="x.ideas" data-q="' + q({ day: it.day }) + '">Add another</button>' });
  };

  /* ---------- Edit sheet (time, day, who joins, who sees it, note) ---------- */
  function editDraft(ph, id) {
    const it = T.store.get().trip.items.find(function (x) { return x.id === id; });
    if (!it) return null;
    if (!ph.local.edit || ph.local.edit.id !== id) ph.local.edit = { id: id, day: it.day, start: it.start, base: it.start, joiners: it.joiners.map(function (j) { return j.uid; }), vis: it.visibility, note: it.note || '', title: it.title, price: it.price };
    return ph.local.edit;
  }
  T.sheets.editItem = function (ph, p) {
    const t = T.store.get().trip, it = t.items.find(function (x) { return x.id === p.id; });
    if (!it) return '<h3>Already removed</h3><div class="sh-actions">' + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
    const mine = it.owner === ph.uid;
    if (!mine) {
      return '<div class="sh-me">' + (it.img ? '<span class="thumb lg" style="background-image:' + UI.img(it.img) + '"></span>' : '<i class="pr-i">' + ic(it.icon || 'pin', 20) + '</i>') + '<div><h3>' + E(it.title) + '</h3><p>' + E(dlabel(it.day)) + ' · ' + E(range(it.start, it.end)) + '</p></div></div>' +
        '<p class="sh-p">' + E(P[it.owner].name) + ' added this. You can leave it any time.</p><div class="sh-actions col">' + UI.btn('Leave this plan', 'itemLeave', it.id, { kind: 'danger', block: true }) + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
    }
    const D = editDraft(ph, it.id), dur = T.mins(it.end) - T.mins(it.start);
    const offsets = [-60, -30, 0, 30, 60];
    const starts = offsets.map(function (o) { return T.mins(D.base) + o; }).filter(function (m) { return m >= 6 * 60 && m + dur <= 23.5 * 60; }).map(T.hhmm);
    const friends = friendsOf(ph.uid);
    const st = {};
    it.joiners.forEach(function (j) { st[j.uid] = j.state; });
    const hasJ = D.joiners.length > 0;
    return '<div class="sh-me">' + (it.img ? '<span class="thumb lg" style="background-image:' + UI.img(it.img) + '"></span>' : '<i class="pr-i">' + ic(it.icon || 'pin', 20) + '</i>') + '<div class="grow"><h3>' + E(D.title) + '</h3><p>' + E(mm(dur)) + (it.price ? ' · ' + T.fmt(it.price) + ' each' : '') + '</p></div><span class="pill lime">Mine</span></div>' +
      (it.custom ? '<label class="lab">Name<input id="editTitle" class="inp" data-in="edittitle" type="text" maxlength="48" value="' + E(D.title) + '" autocomplete="off"></label>' : '') +
      '<div class="fl">DAY</div><div class="chips tight">' + Array.apply(null, Array(Q.dayCount())).map(function (_, i) { const d = Q.dayLabel(i); return UI.chip(d.dow + ' ' + d.date, { active: D.day === i, act: 'editDay', p: i, noTick: true }); }).join('') + '</div>' +
      '<div class="fl">TIME</div><div class="chips tight hscroll">' + starts.map(function (s) {
        const c = Q.clashFor(ph.uid, D.day, s, T.hhmm(T.mins(s) + dur), it.id);
        return UI.chip(tshort(s) + (c ? ' !' : ''), { active: D.start === s, act: 'editStart', p: s, disabled: !!c && D.start !== s });
      }).join('') + '</div>' +
      '<div class="fl">WHO IS JOINING</div><div class="chips tight">' + (friends.length ? friends.map(function (m) {
        const on = D.joiners.indexOf(m.uid) >= 0, s = st[m.uid];
        return '<button type="button" class="chip fr' + (on ? ' on' : '') + '" data-a="editJoin" data-p="' + m.uid + '" aria-pressed="' + on + '">' + UI.av(m.uid, 22) + E(P[m.uid].name) + (on && s === 'joined' ? ' · in' : on && s === 'passed' ? ' · passed' : on && s === 'invited' ? ' · invited' : '') + '</button>';
      }).join('') : '<span class="muted">Nobody else is travelling</span>') + '</div>' +
      '<div class="fl">WHO CAN SEE THIS</div>' + visSeg(D.vis, hasJ, 'editVis') +
      '<label class="lab">Note<textarea id="editNote" class="inp ta" data-in="editnote" rows="2" maxlength="140" placeholder="Booking name, address, what to carry">' + E(D.note) + '</textarea></label>' +
      '<div class="note ok">' + ic('refresh', 16) + '<span>' + E(it.cancel) + '</span></div>' +
      '<div class="sh-actions col">' + UI.btn('Save changes', 'editSave', it.id, { kind: 'pri', block: true, icon: 'check' }) + UI.btn('Remove from itinerary', 'itemRemove', it.id, { kind: 'danger', block: true, icon: 'x' }) + '</div>';
  };
  function redrawSheet(ph) { ph.renderLayer(); }
  H.editDay = function (ph, i) {
    const D = ph.local.edit, it = T.store.get().trip.items.find(function (x) { return x.id === D.id; });
    D.day = parseInt(i, 10);
    const dur = T.mins(it.end) - T.mins(it.start);
    if (Q.clashFor(ph.uid, D.day, D.start, T.hhmm(T.mins(D.start) + dur), it.id)) { D.start = firstFree(ph.uid, D.day, dur, D.base) || D.start; D.base = D.start; }
    redrawSheet(ph);
  };
  H.editStart = function (ph, s) { ph.local.edit.start = s; redrawSheet(ph); };
  H.editJoin = function (ph, u) { const D = ph.local.edit, i = D.joiners.indexOf(u); if (i >= 0) D.joiners.splice(i, 1); else D.joiners.push(u); if (D.joiners.length && D.vis === 'me') D.vis = 'joined'; if (!D.joiners.length && D.vis === 'joined') D.vis = 'me'; redrawSheet(ph); };
  H.editVis = function (ph, v) { ph.local.edit.vis = v; redrawSheet(ph); };
  H['in:editnote'] = function (ph, v) { if (ph.local.edit) ph.local.edit.note = v; };
  H['in:edittitle'] = function (ph, v) { if (ph.local.edit) ph.local.edit.title = v; };
  H.editSave = function (ph, id) {
    const D = ph.local.edit, it = T.store.get().trip.items.find(function (x) { return x.id === id; });
    const had = it.joiners.map(function (j) { return j.uid; });
    A.updateItem(ph.uid, id, {
      day: D.day, start: D.start !== it.start ? D.start : null, title: D.title, note: D.note, visibility: D.vis,
      joinersAdd: D.joiners.filter(function (u) { return had.indexOf(u) < 0; }), joinersRemove: had.filter(function (u) { return D.joiners.indexOf(u) < 0; })
    });
    ph.local.edit = null;
    ph.closeSheet(); ph.render(); ph.toast('Changes saved', 'check');
  };
  H.itemRemove = function (ph, id) { A.removeItem(ph.uid, id); ph.local.edit = null; ph.closeSheet(); ph.render(); ph.toast('Removed from your itinerary', 'check'); };
  H.itemLeave = function (ph, id) { A.respondItem(ph.uid, id, false); ph.closeSheet(); ph.render(); ph.toast('You left this plan', 'check'); };
  // closing the sheet drops an unsaved draft
  const oldClose = T.on.closeSheet;
  H.closeSheet = function (ph) { if (ph.sheet && ph.sheet.id === 'editItem') ph.local.edit = null; oldClose(ph); };

  /* ---------- Friend invite to an item ---------- */
  S['x.invite'] = function (ph, p) {
    const t = T.store.get().trip, it = t.items.find(function (x) { return x.id === p.id; });
    if (!it) return '<div class="body">' + UI.top({ title: 'Invite' }) + UI.empty('info', 'This plan was cancelled', 'The person who added it removed it.') + '</div>';
    const me = it.joiners.find(function (j) { return j.uid === ph.uid; });
    const clash = Q.clashFor(ph.uid, it.day, it.start, it.end, it.id);
    const cost = !it.price ? 'Free' : it.payer === 'me' ? 'On ' + P[it.owner].name : T.fmt(it.price) + (it.payer === 'split' ? ', settle up later' : ' at the venue');
    const done = me && me.state !== 'invited';
    return '<div class="body nopad"><div class="ideahero short" style="background-image:' + UI.img(it.img || 'getaway') + '"><div class="sh-top">' + UI.rbtn('back', 'back', '', 'Back', 'glass') + '</div><div class="sh-b"><span class="pill lime">' + UI.E(P[it.owner].name) + ' invited you</span><h1>' + E(it.title) + '</h1><p>' + E(dlabel(it.day)) + ' · ' + E(range(it.start, it.end)) + '</p></div></div>' +
      '<div class="pad16"><div class="card rows"><div class="prow static"><i class="pr-i">' + ic('wallet', 18) + '</i><span class="pr-t"><b>Your cost</b><small>' + E(cost) + '</small></span></div><div class="prow static"><i class="pr-i">' + ic('users', 18) + '</i><span class="pr-t"><b>With ' + E(P[it.owner].name) + (it.joiners.length > 1 ? ' and ' + (it.joiners.length - 1) + ' more' : '') + '</b><small>' + E(it.cancel) + '</small></span></div></div>' +
      (it.note ? '<div class="note">' + ic('info', 16) + '<span>' + E(it.note) + '</span></div>' : '') +
      (clash ? '<div class="note warn">' + ic('alert', 16) + '<span>Overlaps ' + E(clash.title) + ' on your day</span></div>' : '<div class="note ok">' + ic('check', 16) + '<span>Fits your day</span></div>') + '</div></div>' +
      (done ? UI.dock({ cue: 'Back to your itinerary', label: me.state === 'joined' ? 'You’re in' : 'You passed', act: 'rootgo', p: 'x.trip', icon: 'check' }) :
        UI.dock({ cue: 'It joins your itinerary', label: 'Join', act: 'respond', p: it.id + '|1', under: '<button type="button" class="under-btn" data-a="respond" data-p="' + it.id + '|0">Pass</button>' }));
  };
  H.respond = function (ph, arg) {
    const a = arg.split('|');
    A.respondItem(ph.uid, a[0], a[1] === '1');
    ph.toast(a[1] === '1' ? 'You’re in' : 'Passed', a[1] === '1' ? 'check' : 'x');
    ph.root_('x.trip');
  };

  /* ---------- Today ---------- */
  S['x.today'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid;
    if (!t || t.stage !== 'booked') return '<div class="body">' + UI.top({ title: 'Today' }) + UI.empty('cal', 'Nothing today yet', 'The day view appears once your trip is booked.') + '</div>';
    const L = ph.local.today = ph.local.today || { day: Math.min(1, Q.dayCount() - 1), now: '12:00' };
    const items = Q.itemsFor(uid).filter(function (i) { return i.day === L.day; });
    const nowM = T.mins(L.now);
    const next = items.find(function (i) { return !i.skipped && T.mins(i.end) > nowM; });
    const hero = next && next.img ? next.img : T.DEST[t.plan.destId].img;
    const d = Q.dayLabel(L.day);
    const slot = Q.freeSlots(uid, L.day).find(function (s) { return T.mins(s.end) > nowM; });
    const slotFrom = slot ? (T.mins(slot.start) < nowM ? T.hhmm(Math.ceil(nowM / 30) * 30) : slot.start) : null;
    return '<div class="body nopad"><div class="todayhero" style="background-image:' + UI.img(hero) + '"><div class="sh-top">' + UI.rbtn('back', 'back', '', 'Back', 'glass') + '<span class="pill white">' + ic('clock', 12) + 'Simulated ' + E(T.clock(L.now)) + '</span></div><div class="sh-b"><small>' + E(d.dowFull) + ' · ' + E(T.DEST[t.plan.destId].name) + ' day ' + (L.day + 1) + ' of ' + Q.dayCount() + '</small><h1>' + d.date + ' ' + d.mon + '</h1>' + (next ? '<p>' + (T.mins(next.start) <= nowM ? 'Now' : 'Next up') + ': ' + E(next.title) + '</p>' : '<p>Nothing left today</p>') + '</div></div>' +
      '<div class="pad16"><div class="chips tight">' + Array.apply(null, Array(Q.dayCount())).map(function (_, i) { return UI.chip(Q.dayLabel(i).dow, { active: L.day === i, act: 'todayDay', p: i, noTick: true }); }).join('') + '</div>' +
      '<div class="chips tight">' + ['08:00', '12:00', '16:00', '20:00'].map(function (s) { return UI.chip(T.clock(s).replace(':00', ''), { active: L.now === s, act: 'todayNow', p: s, noTick: true }); }).join('') + '</div>' +
      (slot ? '<button type="button" class="note inv" data-a="go" data-p="x.ideas" data-q="' + q({ day: L.day, start: slotFrom, end: slot.end }) + '">' + ic('sparkles', 16) + '<span><b>Free from ' + E(T.clock(slotFrom).replace(':00', '')) + '</b> · add something</span>' + ic('chevR', 16) + '</button>' : '') +
      '<div class="card list">' + (items.length ? items.map(function (i) {
        const past = T.mins(i.end) <= nowM, live = T.mins(i.start) <= nowM && T.mins(i.end) > nowM;
        const mine = i.kind === 'personal';
        return '<div class="mrow' + (past || i.skipped ? ' past' : '') + '"><i class="ckd ' + (past ? 'ok' : live ? 'run' : '') + '">' + (past ? ic('check', 14) : '') + '</i><span class="crow-t"><b' + (i.skipped ? ' class="strike"' : '') + '>' + E(i.title) + '</b><small>' + E(range(i.start, i.end)) + ' · ' + E(i.skipped ? 'Skipping' : i.sub || '') + '</small></span>' + (i.skipped ? '' : live ? '<span class="pill lime">Now</span>' : next && next.id === i.id ? '<span class="pill dark">Next</span>' : mine ? '<span class="pill lime">Mine</span>' : '') + '</div>';
      }).join('') : UI.empty('cal', 'A free day', 'Nothing planned. Add something from My trip.')) + '</div></div></div>';
  };
  H.todayDay = function (ph, i) { ph.local.today.day = parseInt(i, 10); ph.render(); };
  H.todayNow = function (ph, s) { ph.local.today.now = s; ph.render(); };

  /* ---------- Settle up ---------- */
  S['x.settle'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid;
    const all = t ? ledgerFor(uid) : [];
    const owe = all.filter(function (l) { return l.from === uid; }), due = all.filter(function (l) { return l.to === uid; });
    const oweOpen = owe.filter(function (l) { return !l.settled; }), dueOpen = due.filter(function (l) { return !l.settled; });
    const sum = function (a) { return a.reduce(function (x, l) { return x + l.amount; }, 0); };
    const net = sum(dueOpen) - sum(oweOpen);
    const w = t && t.stage === 'booked' ? Q.wallet() : null;
    function row(l, mine) {
      const other = mine ? l.to : l.from;
      return '<div class="mrow">' + UI.av(other, 36) + '<span class="crow-t"><b>' + (mine ? 'You owe ' : '') + E(P[other].name) + (mine ? '' : ' owes you') + '</b><small>' + E(l.note) + ' · ' + T.fmt(l.amount) + '</small></span>' + (l.settled ? UI.pill('Settled', 'ok', 'check') : mine ? '<button type="button" class="mini dark" data-a="settlePay" data-p="' + l.id + '">Pay ' + T.fmt(l.amount) + '</button>' : UI.pill('Waiting', 'warn')) + '</div>';
    }
    const closed = all.length > 0 && !oweOpen.length && !dueOpen.length;
    return '<div class="body">' + UI.top({ title: 'Settle up' }) +
      '<div class="hero-lime center"><small>' + E((t ? T.DEST[t.plan.destId].name : 'Trip').toUpperCase()) + ' · ' + Q.headcount() + ' TRAVELLED</small><h2 class="amt">' + T.fmt(Math.abs(net)) + '</h2><p>' + (net > 0 ? 'owed to you' : net < 0 ? 'you owe' : 'nothing owed') + '. Only for extras you booked together.</p></div>' +
      (w ? '<div class="card rows"><div class="prow static"><i class="pr-i">' + ic('refresh', 18) + '</i><span class="pr-t"><b>Back from the pool</b><small>' + T.fmt(w.backEach) + ' each · the trip pool is separate</small></span>' + UI.pill('Sent', 'ok') + '</div></div>' : '') +
      (all.length ? (owe.length ? UI.sect('You owe') + '<div class="card list">' + owe.map(function (l) { return row(l, true); }).join('') + '</div>' : '') + (due.length ? UI.sect('Owed to you') + '<div class="card list">' + due.map(function (l) { return row(l, false); }).join('') + '</div>' : '') :
        UI.empty('wallet', 'All square', 'When you split an extra with friends, the amounts show here.')) +
      (closed ? '<div class="note ok">' + ic('check', 16) + '<span>Trip closes once settled. You are all square.</span></div>' : '') + '</div>' +
      (oweOpen.length ? UI.dock({ cue: 'Trip closes once settled', label: 'Settle via UPI · ' + T.fmt(sum(oweOpen)), act: 'settleAll', under: '<button type="button" class="under-btn" data-a="splitwise">Export to Splitwise</button>' }) :
        dueOpen.length ? UI.dock({ cue: 'Friends pay you directly', label: 'Remind friends', act: 'remindDebtors', under: '<button type="button" class="under-btn" data-a="splitwise">Export to Splitwise</button>' }) :
        all.length ? UI.dock({ cue: 'Nothing left to do', label: 'Back to my trip', act: 'rootgo', p: 'x.trip', under: '<button type="button" class="under-btn" data-a="splitwise">Export to Splitwise</button>' }) : '');
  };
  H.settlePay = function (ph, id) { A.settle(id); ph.toast('Paid, simulated', 'check'); ph.render(); };
  H.settleAll = function (ph) {
    const open = ledgerFor(ph.uid).filter(function (l) { return l.from === ph.uid && !l.settled; });
    open.forEach(function (l) { A.settle(l.id); });
    ph.toast('Settled ' + open.length + (open.length > 1 ? ' payments' : ' payment') + ', simulated', 'check');
  };
  H.remindDebtors = function (ph) {
    const open = ledgerFor(ph.uid).filter(function (l) { return l.to === ph.uid && !l.settled; });
    const seen = {};
    open.forEach(function (l) { if (!seen[l.from]) { seen[l.from] = 1; A.remind(l.from); } });
    ph.toast('Reminded ' + Object.keys(seen).length + (Object.keys(seen).length > 1 ? ' friends' : ' friend'), 'bell');
  };
  H.splitwise = function (ph) { ph.toast('Export to Splitwise is simulated here', 'info'); };
})();
