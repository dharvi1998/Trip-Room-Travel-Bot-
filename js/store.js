/* Shared trip state, pricing rules and actions. Both phones read from here. */
(function () {
  const T = window.TR;
  const KEY = 'tripRoom.v1';
  let state = fresh();
  const subs = [];

  function fresh() {
    return { v: 1, seq: 1, theme: 'forest', contacts: [], trip: null, messages: [], notifs: [], log: [] };
  }
  function nid() { return state.seq++; }

  /* ---------- persistence ---------- */
  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) { state = s; if (!state.contacts) state.contacts = []; } }
    } catch (e) { /* storage may be unavailable */ }
    register();
    return state;
  }
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function commit(silent) { save(); if (!silent) subs.forEach(function (f) { f(state); }); }
  function subscribe(f) { subs.push(f); }
  function reset() { const th = state.theme, cs = state.contacts; state = fresh(); state.theme = th; state.contacts = cs || []; commit(); }
  function replace(s) { state = s; if (!state.contacts) state.contacts = []; register(); subs.forEach(function (f) { f(state); }); }
  function get() { return state; }

  /* ---------- messages, notifications, log ---------- */
  function say(to, text, opt) {
    state.messages.push(Object.assign({ id: nid(), to: to, from: 'Trip Agent', text: text, ts: Date.now() }, opt || {}));
  }
  function ping(to, text, opt) {
    state.notifs.push(Object.assign({ id: nid(), to: to, text: text, icon: 'bell', ts: Date.now() }, opt || {}));
  }
  function log(text) { state.log.unshift({ id: nid(), text: text, ts: Date.now() }); if (state.log.length > 60) state.log.pop(); }

  /* ---------- derived trip data ---------- */
  function trip() { return state.trip; }
  function member(uid) { return state.trip && state.trip.members[uid]; }
  function members() { const t = state.trip; return t ? t.order.map(function (u) { return t.members[u]; }) : []; }
  function activeMembers() { return members().filter(function (m) { return !m.out; }); }
  function headcount() { return activeMembers().length; }
  function status(m) {
    if (m.out) return 'out';
    if (m.paid) return 'paid';
    if (m.vote) return m.vote;
    if (m.uid === 'ira') return 'organiser';
    if (m.answer) return 'answered';
    if (m.joined) return 'joined';
    return 'invited';
  }
  function hasReplied(m) { return m.out || !!m.answer; }
  function repliedCount() { return members().filter(hasReplied).length; }
  function ceiling() {
    const caps = members().filter(function (m) { return !m.out && m.answer; }).map(function (m) { return m.answer.cap; });
    return caps.length ? Math.min.apply(null, caps) : 16000;
  }
  function tripDateId() { const t = state.trip; return t.when === 'flexible' ? 'weekend' : t.when; }
  function datesInfo() { return T.DATES[tripDateId()]; }
  function datesFit() {
    const id = tripDateId();
    const rs = members().filter(function (m) { return !m.out && m.answer; });
    const ok = rs.filter(function (m) { return m.answer.dates === 'flexible' || m.answer.dates === id; });
    return { ok: ok.length, of: rs.length };
  }
  function dayLabel(idx) { return T.dayInfo(datesInfo().start, idx); }
  function dayCount() { return datesInfo().days; }

  /* flights: one list per departure city, derived from the destination's base list */
  function flightsFor(destId, city) {
    const d = T.DEST[destId];
    const delta = d.cityDelta[city] || 0;
    const shift = { BLR: 0, DEL: -90, BOM: -30 }[city] || 0;
    const extraDur = { BLR: 0, DEL: 75, BOM: -15 }[city] || 0;
    const numOff = { BLR: 0, DEL: 6068, BOM: 4563 }[city] || 0;
    return d.baseFlights.map(function (f) {
      if (city === 'BLR') return Object.assign({ from: 'BLR' }, f);
      const dur = T.mins(f.arr) - T.mins(f.out) + extraDur;
      const out = T.mins(f.out) + shift;
      const m = /^(.*\s)(\d+)$/.exec(f.carrier);
      const carrier = m ? m[1] + (parseInt(m[2], 10) + numOff) : f.carrier;
      return Object.assign({}, f, { id: f.id + '@' + city, from: city, carrier: carrier, out: T.hhmm(out), arr: T.hhmm(out + dur), fare: f.fare + delta });
    });
  }
  function pickedFlight(uid) {
    const t = state.trip, m = t.members[uid], plan = t.plan;
    const list = flightsFor(plan.destId, m.city);
    const id = plan.flightPick[m.city];
    return list.find(function (f) { return f.id === id; }) || list.find(function (f) { return f.pick; }) || list[0];
  }
  function stayOf(plan) { return T.DEST[plan.destId].stays.find(function (s) { return s.id === plan.stayId; }); }
  function extrasOf(plan) { return T.DEST[plan.destId].extras.filter(function (e) { return plan.extraIds.indexOf(e.id) >= 0; }); }
  function round10(n) { return Math.round(n / 10) * 10; }

  /* share = flight + stay / headcount + extras + buffer */
  function shareFor(uid, planOverride, nOverride) {
    const t = state.trip, plan = planOverride || t.plan;
    const m = t.members[uid];
    const locked = t.pool && t.pool.locked && t.pool.locked[uid];
    if (locked && !planOverride) return locked;
    const n = nOverride || headcount() || 1;
    const dest = T.DEST[plan.destId];
    const flights = flightsFor(plan.destId, m.city);
    const f = flights.find(function (x) { return x.id === plan.flightPick[m.city]; }) || flights.find(function (x) { return x.pick; }) || flights[0];
    const stay = dest.stays.find(function (s) { return s.id === plan.stayId; });
    const stayPP = Math.round(stay.price / n);
    const extrasPP = dest.extras.filter(function (e) { return plan.extraIds.indexOf(e.id) >= 0; }).reduce(function (a, e) { return a + e.price; }, 0);
    const sub = f.fare + stayPP + extrasPP;
    const buffer = round10(sub * T.BUFFER_RATE);
    return { flights: f.fare, stay: stayPP, extras: extrasPP, buffer: buffer, total: sub + buffer };
  }
  function defaultPlan(destId) {
    const d = T.DEST[destId];
    return {
      destId: destId,
      stayId: (d.stays.find(function (s) { return s.pick; }) || d.stays[0]).id,
      extraIds: d.extras.map(function (e) { return e.id; }),
      flightPick: {}, sentAt: null, holdEnds: null
    };
  }
  function poolTotal() {
    return activeMembers().reduce(function (a, m) { return a + shareFor(m.uid).total; }, 0);
  }
  function paidTotal() {
    const t = state.trip;
    return activeMembers().reduce(function (a, m) { return a + (m.paid ? m.paid.amount : 0); }, 0);
  }
  function paidCount() { return activeMembers().filter(function (m) { return m.paid; }).length; }

  /* destination options with fit tags, computed from the group's answers */
  function evalDest(id) {
    const dest = T.DEST[id];
    const plan = defaultPlan(id);
    const act = activeMembers();
    const shares = act.map(function (m) { return shareFor(m.uid, plan, act.length || 1).total; });
    const ira = shareFor('ira', plan, act.length || 1).total;
    const maxShare = shares.length ? Math.max.apply(null, shares) : ira;
    const fit = datesFit();
    const inBudget = maxShare <= ceiling();
    const vibe = state.trip && state.trip.vibe;
    const score = (inBudget ? 4 : 0) + (dest.direct ? 2 : 0) + (fit.ok === fit.of ? 2 : 0) + (dest.vibes && dest.vibes.indexOf(vibe) >= 0 ? 1.5 : 0) - ira / 100000;
    return { id: id, dest: dest, price: ira, maxShare: maxShare, inBudget: inBudget, datesOk: fit.ok === fit.of, fit: fit, score: score };
  }
  function destOptions() {
    const list = Object.keys(T.DEST).map(evalDest);
    const best = list.slice().sort(function (a, b) { return b.score - a.score; })[0].id;
    const cheapest = list.slice().sort(function (a, b) { return a.price - b.price; })[0].id;
    list.forEach(function (o) { o.best = o.id === best; o.cheapest = o.id === cheapest; });
    return list.sort(function (a, b) { return b.score - a.score; });
  }

  /* ---------- itinerary ---------- */
  function groupItems(uid) {
    const t = state.trip;
    if (!t || !t.plan || t.stage !== 'booked') return [];
    const plan = t.plan, dest = T.DEST[plan.destId], stay = stayOf(plan), road = dest.road || 0;
    const skips = (t.members[uid] && t.members[uid].skips) || [];
    const f = pickedFlight(uid), last = dayCount() - 1;
    const items = [];
    items.push({ id: 'g-out', day: 0, start: f.out, end: f.arr, title: 'Flight ' + f.from + ' to ' + dest.code, sub: f.carrier + ' · seats ' + f.seats, kind: 'flight', icon: 'plane', locked: true });
    const ci = Math.max(T.mins(f.arr) + 60 + road, 11 * 60);
    items.push({ id: 'g-in', day: 0, start: T.hhmm(ci), end: T.hhmm(ci + 60), title: 'Check in · ' + stay.name, sub: stay.area + (road ? ' · ' + dest.roadNote + ' from the airport' : ''), kind: 'stay', icon: 'bed', img: stay.img, locked: true });
    extrasOf(plan).forEach(function (e) {
      if (e.day <= last) items.push({ id: 'g-' + e.id, day: e.day, start: e.start, end: e.end, title: e.name, sub: e.sub, kind: 'group', icon: e.icon, img: e.img, price: e.price, locked: true, skippable: true, skipped: skips.indexOf('g-' + e.id) >= 0 });
    });
    items.push({ id: 'g-bf', day: 1, start: '09:00', end: '10:00', title: 'Breakfast at the stay', sub: stay.name, kind: 'stay', icon: 'utensils', locked: true });
    if (last >= 3) items.push({ id: 'g-br', day: 2, start: '10:00', end: '11:30', title: 'Brunch at the stay', sub: stay.name, kind: 'stay', icon: 'utensils', locked: true });
    const bm = /(\d\d:\d\d)/.exec(f.back || '10:30');
    const bt = T.mins(bm ? bm[1] : '10:30');
    items.push({ id: 'g-co', day: last, start: T.hhmm(Math.max(bt - 180 - road, 6 * 60)), end: T.hhmm(Math.max(bt - 120 - road, 7 * 60)), title: 'Check out and cab to airport', sub: stay.name, kind: 'stay', icon: 'pin', locked: true });
    items.push({ id: 'g-back', day: last, start: T.hhmm(bt), end: T.hhmm(bt + 90), title: 'Flight home', sub: f.back, kind: 'flight', icon: 'plane', locked: true });
    return items;
  }
  function personalVisible(it, uid) {
    if (it.owner === uid) return true;
    const j = it.joiners.find(function (x) { return x.uid === uid; });
    if (j && j.state === 'joined') return true;
    return false;
  }
  function itemsFor(uid) {
    const t = state.trip;
    if (!t) return [];
    const mine = (t.items || []).filter(function (it) { return personalVisible(it, uid); });
    return groupItems(uid).concat(mine).sort(function (a, b) { return a.day - b.day || T.mins(a.start) - T.mins(b.start); });
  }
  function groupVisibleOthers(uid) {
    const t = state.trip;
    return (t.items || []).filter(function (it) { return it.visibility === 'group' && it.owner !== uid && !personalVisible(it, uid); });
  }
  function clashFor(uid, day, start, end, ignoreId) {
    const s = T.mins(start), e = T.mins(end);
    return itemsFor(uid).find(function (it) {
      return !it.skipped && it.id !== ignoreId && it.day === day && T.mins(it.start) < e && T.mins(it.end) > s;
    }) || null;
  }
  function freeSlots(uid, day) {
    const items = itemsFor(uid).filter(function (i) { return i.day === day && !i.skipped; });
    const slots = [];
    let cursor = 8 * 60;
    items.forEach(function (it) {
      const s = T.mins(it.start);
      if (s - cursor >= 90) slots.push({ day: day, start: T.hhmm(cursor), end: T.hhmm(s) });
      cursor = Math.max(cursor, T.mins(it.end));
    });
    if (23 * 60 - cursor >= 90) slots.push({ day: day, start: T.hhmm(cursor), end: '23:00' });
    return slots;
  }
  function ideaStarts(idea, slot) {
    const out = [];
    const lo = Math.max(T.mins(idea.windowStart), slot ? T.mins(slot.start) : 0);
    const hi = Math.min(T.mins(idea.windowEnd), slot ? T.mins(slot.end) : 24 * 60) - idea.dur;
    for (let m = Math.ceil(lo / 30) * 30; m <= hi; m += 30) out.push(T.hhmm(m));
    return out;
  }

  /* ---------- actions ---------- */
  const A = {};

  A.createTrip = function (o) {
    const order = ['ira'].concat(o.invitees);
    const members = {};
    order.forEach(function (uid) { members[uid] = { uid: uid, city: 'BLR', joined: uid === 'ira', answer: null, out: false, vote: null, paid: null, invitedAt: null, skips: [] }; });
    const cap = T.BUDGETS[o.budget].cap;
    members.ira.answer = { dates: o.when, budget: o.budget, cap: cap, city: 'BLR', sure: true };
    state.trip = {
      id: 'dec-x7k2', name: 'December getaway', prompt: o.prompt, when: o.when, vibe: o.vibe, budget: o.budget,
      order: order, members: members, stage: 'draft', plan: null,
      pool: { open: false, locked: null, booked: false, bookedAt: null },
      items: [], ledger: [], closes: 'Wed 6 PM', createdAt: Date.now()
    };
    log('Ira created the Trip Room and picked ' + o.invitees.length + ' travellers');
    commit();
  };

  A.shareInvites = function () {
    const t = state.trip;
    if (t.stage !== 'draft') return;
    t.stage = 'invited';
    t.order.forEach(function (uid) {
      if (uid === 'ira') return;
      t.members[uid].invitedAt = Date.now();
      say(uid, 'Ira is planning December. Pick dates and a budget in 30 seconds.', { kind: 'invite', from: 'Ira · Trip Agent', cta: { label: 'Join Ira’s December trip', screen: 't.join' } });
      ping(uid, 'Ira invited you to a Trip Room', { icon: 'message', go: { screen: 't.wa' } });
    });
    log('Invites sent on WhatsApp to ' + (t.order.length - 1) + ' friends');
    commit();
  };

  A.remind = function (uid) {
    const t = state.trip, m = t.members[uid];
    if (!m) return;
    m.remindedAt = Date.now();
    let text, scr;
    if (t.stage === 'invited') { text = 'Ira is waiting on you. It takes 30 seconds to answer.'; scr = m.joined ? 't.answer' : 't.join'; }
    else if (t.stage === 'confirming') { text = 'The plan is ready. Approve it before the hold ends.'; scr = 't.approve'; }
    else if (t.stage === 'booked') { text = 'A friendly nudge: you still owe for a shared extra. Settle up takes a minute.'; scr = 'x.settle'; }
    else { text = 'The pool closes Tue 6 PM. Your share is ' + T.fmt(shareFor(uid).total) + '.'; scr = 't.pay'; }
    say(uid, text, { kind: 'reminder', from: 'Ira · Trip Agent', cta: { label: 'Open', screen: scr } });
    ping(uid, 'Reminder from Ira', { icon: 'bell', go: { screen: scr } });
    log('Ira nudged ' + T.PEOPLE[uid].name);
    commit();
  };

  A.join = function (uid) {
    const m = member(uid);
    if (!m || m.joined) return;
    m.joined = true;
    ping('ira', T.PEOPLE[uid].name + ' opened the invite', { icon: 'users', go: { screen: 'o.responses' } });
    log(T.PEOPLE[uid].name + ' opened the invite');
    commit();
  };

  A.answer = function (uid, a) {
    const t = state.trip, m = t.members[uid];
    m.joined = true; m.out = false;
    m.city = a.city;
    m.answer = { dates: a.dates, budget: a.budget, cap: T.ANSWER_BUDGETS[a.budget].cap, city: a.city, sure: a.sure !== false };
    ping('ira', T.PEOPLE[uid].name + ' answered' + (a.sure === false ? ' (not sure yet)' : ''), { icon: 'check', go: { screen: 'o.responses' } });
    const pending = members().filter(function (x) { return !hasReplied(x); }).length;
    if (!pending) ping('ira', 'Everyone has answered. You can plan now.', { icon: 'sparkles', go: { screen: 'o.responses' } });
    log(T.PEOPLE[uid].name + ' answered: ' + T.DATES[a.dates].label + ', ' + T.ANSWER_BUDGETS[a.budget].label + ', from ' + a.city);
    commit();
  };

  A.decline = function (uid) {
    const t = state.trip, m = t.members[uid];
    if (t.pool.open) return;
    m.joined = true; m.out = true; m.vote = null;
    ping('ira', T.PEOPLE[uid].name + ' can’t make it', { icon: 'alert', go: { screen: t.stage === 'confirming' ? 'o.confirm' : 'o.responses' } });
    if (t.plan) {
      activeMembers().forEach(function (x) {
        if (x.uid !== 'ira' && x.uid !== uid) ping(x.uid, T.PEOPLE[uid].name + ' dropped out. Your share is now ' + T.fmt(shareFor(x.uid).total) + '.', { icon: 'info', go: { screen: 't.hub' } });
      });
    }
    log(T.PEOPLE[uid].name + ' can’t make it');
    commit();
  };

  A.reopen = function (uid) {
    const m = member(uid);
    if (!m || state.trip.pool.open) return;
    m.out = false; m.answer = null; m.vote = null;
    log(T.PEOPLE[uid].name + ' is changing their answer');
    commit();
  };

  A.chooseDest = function (destId) {
    const t = state.trip;
    if (!t.plan || t.plan.destId !== destId) t.plan = defaultPlan(destId);
    if (t.stage === 'draft' || t.stage === 'invited') t.stage = 'planning';
    log('Ira chose ' + T.DEST[destId].name + ' and the agent built a plan');
    commit();
  };
  A.setStay = function (id) { state.trip.plan.stayId = id; commit(); };
  A.setFlight = function (city, id) { state.trip.plan.flightPick[city] = id; commit(); };
  A.toggleExtra = function (id) {
    const ex = state.trip.plan.extraIds, i = ex.indexOf(id);
    if (i >= 0) ex.splice(i, 1); else ex.push(id);
    commit();
  };

  A.sendPlan = function () {
    const t = state.trip;
    if (t.stage !== 'planning') return;
    t.stage = 'confirming';
    t.plan.sentAt = Date.now();
    t.plan.holdEnds = Date.now() + (21 * 60 + 40) * 60000;
    t.members.ira.vote = 'approved';
    activeMembers().forEach(function (m) {
      if (m.uid === 'ira') return;
      say(m.uid, 'Ira shared the ' + T.DEST[t.plan.destId].name + ' plan: ' + T.fmt(shareFor(m.uid).total) + ' each. Approve it before the hold ends.', { kind: 'plan', from: 'Ira · Trip Agent', cta: { label: 'Preview the plan', screen: 't.approve' } });
      ping(m.uid, 'Ira shared the plan. ' + T.fmt(shareFor(m.uid).total) + ' each.', { icon: 'sparkles', go: { screen: 't.approve' } });
    });
    log('Ira sent the plan to the group');
    commit();
  };

  A.vote = function (uid, v) {
    const t = state.trip, m = t.members[uid];
    if (v === 'out') { A.decline(uid); return; }
    m.vote = v; m.out = false;
    ping('ira', T.PEOPLE[uid].name + (v === 'soft' ? ' gave a soft yes' : ' approved the plan'), { icon: 'thumb', go: { screen: 'o.confirm' } });
    log(T.PEOPLE[uid].name + (v === 'soft' ? ' gave a soft yes' : ' approved'));
    commit();
  };

  function pendingVotes() {
    return activeMembers().filter(function (m) { return m.uid !== 'ira' && !m.vote; });
  }
  A.openPool = function () {
    const t = state.trip;
    if (t.stage !== 'confirming' || pendingVotes().length) return;
    const locked = {};
    activeMembers().forEach(function (m) { locked[m.uid] = shareFor(m.uid); });
    t.pool.locked = locked;
    t.pool.open = true;
    t.stage = 'pooling';
    activeMembers().forEach(function (m) {
      if (m.uid === 'ira') return;
      say(m.uid, 'The pool is open. Your share is ' + T.fmt(locked[m.uid].total) + '. It is held until everyone has paid.', { kind: 'pool', from: 'Ira · Trip Agent', cta: { label: 'Pay your share', screen: 't.pay' } });
      ping(m.uid, 'Pool is open. Your share is ' + T.fmt(locked[m.uid].total), { icon: 'wallet', go: { screen: 't.pay' } });
    });
    log('Ira opened the pool: ' + T.fmt(poolTotal()) + ' for ' + headcount() + ' travellers');
    commit();
  };

  A.pay = function (uid) {
    const t = state.trip, m = t.members[uid];
    if (t.stage !== 'pooling' || m.paid) return;
    const amount = t.pool.locked[uid].total;
    m.paid = { amount: amount, at: Date.now(), ref: 'UPI' + (7000 + state.seq * 13).toString().slice(-4) + 'K' + uid.slice(0, 2).toUpperCase() };
    if (uid !== 'ira') ping('ira', T.PEOPLE[uid].name + ' paid ' + T.fmt(amount) + '. ' + paidCount() + ' of ' + headcount() + ' in the pool.', { icon: 'wallet', go: { screen: 'o.pool' } });
    log(T.PEOPLE[uid].name + ' paid ' + T.fmt(amount) + ' (' + paidCount() + ' of ' + headcount() + ')');
    if (paidCount() === headcount()) { t.stage = 'booking'; t.pool.fullAt = Date.now(); log('Pool is full. The agent is booking.'); }
    commit();
  };

  A.finishBooking = function () {
    const t = state.trip;
    if (t.stage !== 'booking') return;
    t.stage = 'booked';
    t.pool.booked = true;
    t.pool.bookedAt = Date.now();
    activeMembers().forEach(function (m) {
      say(m.uid, 'You’re going. Flights, stay and extras are booked. ' + T.fmt(t.pool.locked[m.uid].buffer) + ' goes back to you.', { kind: 'booked', from: 'Trip Agent', cta: { label: 'Open your trip', screen: 'x.trip' } });
      if (m.uid !== 'ira') ping(m.uid, 'You’re going. Tickets are in your wallet.', { icon: 'ticket', go: { screen: 'x.trip' } });
    });
    ping('ira', 'Booked. Everything is in the Trip Wallet.', { icon: 'ticket', go: { screen: 'o.booked' } });
    log('Booked: flights, stay and extras for ' + headcount());
    commit();
  };

  /* wallet totals once booked */
  function wallet() {
    const t = state.trip, plan = t.plan, act = activeMembers();
    const flights = act.reduce(function (a, m) { return a + pickedFlight(m.uid).fare; }, 0);
    const stay = stayOf(plan).price;
    const extras = extrasOf(plan).reduce(function (a, e) { return a + e.price; }, 0) * act.length;
    const pool = paidTotal();
    const spent = flights + stay + extras;
    return { pool: pool, flights: flights, stay: stay, extras: extras, spent: spent, back: pool - spent, backEach: act.length ? Math.round((pool - spent) / act.length) : 0 };
  }

  /* ---------- itinerary actions ---------- */
  function dayText(day) { const d = T.dayInfo(datesInfo().start, day); return d.dow + ' ' + d.date + ' ' + d.mon; }
  function priceWords(it, owner) {
    if (!it.price) return 'free';
    if (it.payer === 'me') return 'on ' + T.PEOPLE[owner].name;
    if (it.payer === 'split') return T.fmt(it.price) + ' each, settle up later';
    return T.fmt(it.price) + ' each at the venue';
  }
  function invite(it, owner, uid) {
    say(uid, T.PEOPLE[owner].name + ' added ' + it.title + ' on ' + dayText(it.day) + ' ' + T.clock(it.start) + ' (' + priceWords(it, owner) + '). Want to join?', { kind: 'item', from: T.PEOPLE[owner].name, cta: { label: 'See it', screen: 'x.invite', params: { id: it.id } } });
    ping(uid, T.PEOPLE[owner].name + ' invited you to ' + it.title, { icon: 'userplus', go: { screen: 'x.invite', params: { id: it.id } } });
  }
  function ledgerFor(it, owner, uid) {
    if (it.payer === 'split' && it.price) state.trip.ledger.push({ id: 'l' + nid(), itemId: it.id, from: uid, to: owner, amount: it.price, note: it.title, settled: false, active: false });
  }
  function normVis(it) { if (it.joiners.length && it.visibility === 'me') it.visibility = 'joined'; if (!it.joiners.length && it.visibility === 'joined') it.visibility = 'me'; }
  /* spec: { ideaId } for a catalogue idea, or { title, icon, price, dur, sub, note, custom:true } for a plan the traveller made up */
  A.addItem = function (uid, o) {
    const t = state.trip;
    const idea = o.ideaId ? T.IDEAS.find(function (i) { return i.id === o.ideaId; }) : null;
    const src = idea || { name: (o.title || 'My plan').trim(), sub: o.sub || '', icon: o.icon || 'pin', img: null, price: o.price || 0, dur: o.dur || 60, cancel: 'Change or remove it any time' };
    const it = {
      id: 'p' + nid(), owner: uid, ideaId: idea ? idea.id : null, custom: !idea, day: o.day, start: o.start, end: T.hhmm(T.mins(o.start) + src.dur),
      title: src.name, sub: src.sub, icon: src.icon, img: src.img, price: src.price, kind: 'personal', note: o.note || '',
      visibility: o.visibility || 'me', payer: o.payer || 'me', joiners: (o.joiners || []).map(function (u) { return { uid: u, state: 'invited' }; }), cancel: src.cancel
    };
    normVis(it);
    t.items.push(it);
    it.joiners.forEach(function (j) { ledgerFor(it, uid, j.uid); invite(it, uid, j.uid); });
    log(T.PEOPLE[uid].name + ' added ' + it.title + ' to their own itinerary');
    commit();
    return it;
  };
  /* patch: { day, start, joinersAdd:[uid], joinersRemove:[uid], visibility, note, title, price } */
  A.updateItem = function (uid, id, patch) {
    const t = state.trip;
    const it = t.items.find(function (x) { return x.id === id; });
    if (!it || it.owner !== uid) return null;
    const dur = T.mins(it.end) - T.mins(it.start);
    if (patch.day != null) it.day = patch.day;
    if (patch.start) { it.start = patch.start; it.end = T.hhmm(T.mins(patch.start) + dur); }
    if (patch.title != null && it.custom && patch.title.trim()) it.title = patch.title.trim();
    if (patch.note != null) it.note = patch.note;
    if (patch.price != null && it.custom) it.price = patch.price;
    (patch.joinersRemove || []).forEach(function (u) {
      it.joiners = it.joiners.filter(function (j) { return j.uid !== u; });
      t.ledger = t.ledger.filter(function (l) { return !(l.itemId === id && l.from === u); });
      ping(u, T.PEOPLE[uid].name + ' removed you from ' + it.title, { icon: 'alert' });
    });
    (patch.joinersAdd || []).forEach(function (u) {
      if (it.joiners.some(function (j) { return j.uid === u; })) return;
      it.joiners.push({ uid: u, state: 'invited' });
      ledgerFor(it, uid, u);
    });
    if (patch.visibility) it.visibility = patch.visibility;
    normVis(it);
    (patch.joinersAdd || []).forEach(function (u) { invite(it, uid, u); });
    if (patch.start || patch.day != null) {
      it.joiners.forEach(function (j) { if ((patch.joinersAdd || []).indexOf(j.uid) < 0) ping(j.uid, T.PEOPLE[uid].name + ' moved ' + it.title + ' to ' + dayText(it.day) + ' ' + T.clock(it.start), { icon: 'clock', go: { screen: 'x.invite', params: { id: it.id } } }); });
    }
    log(T.PEOPLE[uid].name + ' updated ' + it.title);
    commit();
    return it;
  };
  A.removeItem = function (uid, id) {
    const t = state.trip;
    const it = t.items.find(function (x) { return x.id === id; });
    if (!it || it.owner !== uid) return;
    t.items = t.items.filter(function (x) { return x.id !== id; });
    t.ledger = t.ledger.filter(function (l) { return l.itemId !== id; });
    it.joiners.forEach(function (j) { ping(j.uid, T.PEOPLE[uid].name + ' cancelled ' + it.title, { icon: 'alert' }); });
    log(T.PEOPLE[uid].name + ' removed ' + it.title);
    commit();
  };
  /* skip one group extra: the booking for everyone else stays as it is */
  A.skipGroup = function (uid, gid, skip) {
    const m = member(uid), t = state.trip;
    if (!m) return;
    m.skips = m.skips || [];
    const i = m.skips.indexOf(gid);
    if (skip && i < 0) m.skips.push(gid);
    if (!skip && i >= 0) m.skips.splice(i, 1);
    const ex = extrasOf(t.plan).find(function (e) { return 'g-' + e.id === gid; });
    if (ex && uid !== 'ira') ping('ira', T.PEOPLE[uid].name + (skip ? ' is skipping ' : ' is back for ') + ex.name, { icon: skip ? 'x' : 'check' });
    log(T.PEOPLE[uid].name + (skip ? ' will skip ' : ' rejoined ') + (ex ? ex.name : 'a group plan'));
    commit();
  };
  A.respondItem = function (uid, id, yes) {
    const t = state.trip;
    const it = t.items.find(function (x) { return x.id === id; });
    if (!it) return;
    const j = it.joiners.find(function (x) { return x.uid === uid; });
    if (!j) return;
    j.state = yes ? 'joined' : 'passed';
    t.ledger.forEach(function (l) { if (l.itemId === id && l.from === uid) { l.active = yes; } });
    ping(it.owner, T.PEOPLE[uid].name + (yes ? ' is joining ' : ' passed on ') + it.title, { icon: yes ? 'check' : 'x', go: { screen: 'x.trip' } });
    log(T.PEOPLE[uid].name + (yes ? ' joined ' : ' passed on ') + it.title);
    commit();
  };
  A.settle = function (id) {
    const l = state.trip.ledger.find(function (x) { return x.id === id; });
    if (!l || l.settled) return;
    l.settled = true;
    ping(l.to, T.PEOPLE[l.from].name + ' paid you ' + T.fmt(l.amount) + ' for ' + l.note, { icon: 'wallet', go: { screen: 'x.settle' } });
    log(T.PEOPLE[l.from].name + ' settled ' + T.fmt(l.amount) + ' with ' + T.PEOPLE[l.to].name);
    commit();
  };
  A.addContact = function (name, phone) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + nid();
    const digits = phone.replace(/\D/g, '');
    const masked = '+91 ••••• ' + (digits.slice(-5) || '00000');
    state.contacts.push({ id: id, name: name, phone: masked, av: (state.contacts.length % 6) + 1 });
    register();
    commit();
    return id;
  };
  function register() {
    (state.contacts || []).forEach(function (c) {
      T.PEOPLE[c.id] = { id: c.id, name: c.name, av: c.av, phone: c.phone };
      if (T.CONTACTS.indexOf(c.id) < 0) T.CONTACTS.push(c.id);
    });
  }

  /* ---------- friend simulator (used by the director panel and presets) ---------- */
  const SIM = {};
  SIM.reply = function (uid) {
    const m = member(uid);
    if (!m || m.out || m.answer || state.trip.stage === 'draft') return;
    if (uid === 'dev') { A.decline(uid); return; }
    A.join(uid);
    A.answer(uid, { dates: 'weekend', budget: 'b16', city: 'BLR', sure: uid !== 'rhea' });
  };
  SIM.vote = function (uid) {
    const m = member(uid);
    if (!m || m.out || m.vote || state.trip.stage !== 'confirming') return;
    A.vote(uid, uid === 'rhea' ? 'soft' : 'approved');
  };
  SIM.pay = function (uid) { A.pay(uid); };
  SIM.next = function (uid) {
    const t = state.trip; if (!t) return;
    if (t.stage === 'invited') SIM.reply(uid);
    else if (t.stage === 'confirming') SIM.vote(uid);
    else if (t.stage === 'pooling') SIM.pay(uid);
  };
  SIM.all = function () {
    const t = state.trip; if (!t) return;
    t.order.forEach(function (uid) { if (uid !== 'ira' && !member(uid).out) SIM.next(uid); });
  };

  /* jump the demo to a stage so each screen can be explored */
  function preset(name) {
    reset();
    const keep = state.theme;
    if (name === 'start') return;
    A.createTrip({ prompt: '6 friends, somewhere warm in December. Bangalore, Delhi, Mumbai.', when: 'weekend', vibe: 'Beach', budget: 'mid', invitees: ['dev', 'rhea', 'kabir', 'naina', 'samar'] });
    if (name === 'room') return;
    A.shareInvites();
    if (name === 'invited') return;
    ['dev', 'rhea', 'kabir', 'naina'].forEach(SIM.reply);
    if (name === 'answers') return;
    SIM.reply('samar');
    A.chooseDest('goa');
    if (name === 'plan') return;
    A.sendPlan();
    if (name === 'confirm') return;
    ['rhea', 'kabir', 'naina', 'samar'].forEach(SIM.vote);
    A.openPool();
    if (name === 'pool') { A.pay('kabir'); A.pay('naina'); return; }
    ['kabir', 'naina', 'samar', 'rhea', 'ira'].forEach(A.pay);
    A.finishBooking();
      }

  window.TR.store = { load: load, save: save, commit: commit, subscribe: subscribe, reset: reset, replace: replace, get: get, preset: preset };
  window.TR.act = A;
  window.TR.sim = SIM;
  window.TR.q = {
    trip: trip, member: member, members: members, activeMembers: activeMembers, headcount: headcount, status: status,
    hasReplied: hasReplied, repliedCount: repliedCount, ceiling: ceiling, datesInfo: datesInfo, datesFit: datesFit,
    dayLabel: dayLabel, dayCount: dayCount, flightsFor: flightsFor, pickedFlight: pickedFlight, stayOf: stayOf, extrasOf: extrasOf,
    shareFor: shareFor, poolTotal: poolTotal, paidTotal: paidTotal, paidCount: paidCount, destOptions: destOptions, evalDest: evalDest,
    itemsFor: itemsFor, groupItems: groupItems, groupVisibleOthers: groupVisibleOthers, clashFor: clashFor, freeSlots: freeSlots,
    ideaStarts: ideaStarts, pendingVotes: pendingVotes, wallet: wallet, defaultPlan: defaultPlan
  };
})();
