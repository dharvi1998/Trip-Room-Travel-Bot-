/* Traveller screens: a friend who is invited, answers, approves, pays and travels. */
(function () {
  const T = window.TR, UI = T.UI, E = UI.E, ic = window.icon, Q = T.q, A = T.act;
  const S = T.screens, H = T.on, P = T.PEOPLE;

  function tState(uid) {
    const t = T.store.get().trip;
    const m = t && t.members[uid];
    if (!t || !m || uid === 'ira' || t.stage === 'draft') return 'none';
    if (m.out) return 'out';
    if (t.stage === 'booked') return m.paid ? 'booked' : 'none';
    if (t.stage === 'pooling' || t.stage === 'booking') return m.paid ? 'paid' : (m.vote || m.answer ? 'pay' : 'answer');
    if (t.stage === 'confirming') return m.vote ? 'voted' : (m.answer ? 'plan' : (m.joined ? 'answer' : 'invite'));
    return m.answer ? 'waiting' : (m.joined ? 'answer' : 'invite');
  }
  T.tState = tState;

  const nav = function (active) {
    return UI.nav([
      { id: 'home', icon: 'home', act: 'rootgo', p: 't.hub', label: 'Home' },
      { id: 'trip', icon: 'compass', act: 'travTrip', label: 'My trip' },
      { id: 'wallet', icon: 'wallet', act: 'travWallet', label: 'Wallet' },
      { id: 'me', icon: 'user', act: 'me', label: 'Profile' }
    ], active);
  };
  H.travTrip = function (ph) {
    const t = T.store.get().trip;
    if (t && t.stage === 'booked' && Q.member(ph.uid) && !Q.member(ph.uid).out) ph.root_('x.trip'); else ph.toast('Your trip appears once it is booked', 'info');
  };
  H.travWallet = function (ph) {
    const s = tState(ph.uid);
    if (s === 'paid' || s === 'booked') ph.root_('t.receipt'); else ph.toast('Your receipt appears after you pay', 'info');
  };

  /* progress dots across the traveller journey */
  function journey(s) {
    const steps = [['Answer', ['invite', 'answer']], ['Plan', ['waiting', 'plan']], ['Approve', ['plan', 'voted']], ['Pay', ['pay']], ['Travel', ['paid', 'booked']]];
    const order = { invite: 0, answer: 0, waiting: 1, plan: 2, voted: 3, pay: 3, paid: 4, booked: 4 }[s];
    return '<div class="journey">' + ['Answer', 'Plan', 'Approve', 'Pay', 'Travel'].map(function (l, i) {
      return '<span class="j' + (i < order ? ' done' : i === order ? ' now' : '') + '"><i>' + (i < order ? ic('check', 11) : (i + 1)) + '</i><small>' + l + '</small></span>';
    }).join('<b></b>') + '</div>';
  }

  /* ---------- Hub ---------- */
  S['t.hub'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid, u = P[uid], s = tState(uid), m = t && t.members[uid];
    const hello = '<div class="hello"><div class="hello-l">' + UI.av(uid, 40) + '<div><small>Hi there</small><h1>' + E(u.name) + '</h1></div></div><button type="button" class="rb" data-a="sheet" data-p="notifs" aria-label="Notifications">' + ic('bell', 18) + (T.store.get().notifs.some(function (n) { return n.to === uid; }) ? '<i class="dot"></i>' : '') + '</button></div>';
    let hero = '', dock = '';
    if (s === 'none') {
      hero = UI.empty('message', 'No trip yet', 'When a friend adds you to a Trip Room, the invite lands on WhatsApp and shows up here.');
      dock = UI.dock({ cue: 'Check your messages', label: 'Open WhatsApp', act: 'go', p: 't.wa' });
    } else if (s === 'out') {
      hero = '<div class="hero-lime center"><span class="big-check dim">' + ic('user', 26) + '</span><h2>You’re out of this trip</h2><p>Ira has been told. You can change your answer until the pool opens.</p></div>';
      dock = UI.dock({ cue: 'You can still join', label: 'Change my answer', act: 'changeAnswer', dark: true, disabled: t.pool.open });
    } else {
      const bits = ({
        invite: function () { return ['Ira invited you', 'Answer in 30 seconds. No payment yet.', 'Open the invite', 'go', 't.wa', 'Takes 30 seconds']; },
        answer: function () { return ['Answer in 30 seconds', 'Dates, budget and where you fly from.', 'Answer now', 'go', 't.answer', 'Your budget stays private']; },
        waiting: function () { return ['Got it', 'Ira is picking a destination. You get a message when the plan is ready.', 'See the messages', 'go', 't.wa', 'Ira plans next']; },
        plan: function () { return ['Ira shared the plan', T.DEST[t.plan.destId].name + ' · ' + T.fmt(Q.shareFor(uid).total) + ' each. Approve it before the hold ends.', 'Preview the plan', 'go', 't.approve', 'Then pay once the pool opens']; },
        voted: function () { return ['You ' + (m.vote === 'soft' ? 'gave a soft yes' : 'approved') + '', Q.pendingVotes().length ? 'Waiting for ' + Q.pendingVotes().length + ' more ' + (Q.pendingVotes().length > 1 ? 'friends' : 'friend') + '. Ira opens the pool next.' : 'Ira opens the pool next.', 'View the plan', 'go', 't.approve', 'Pool opens after everyone replies']; },
        pay: function () { return ['The pool is open', 'Your share is ' + (t.pool.locked && t.pool.locked[uid] ? T.fmt(t.pool.locked[uid].total) : '') + '. It is held until everyone has paid.', 'Pay your share', 'go', 't.pay', 'I book once the pool is full']; },
        paid: function () { return ['You’re in', Q.paidCount() + ' of ' + Q.headcount() + ' have paid. Booking starts once the pool is full.', 'See my receipt', 'go', 't.receipt', 'Tickets arrive on WhatsApp']; },
        booked: function () { return ['You’re going', 'Flights, stay and extras are booked for ' + Q.headcount() + ' friends.', 'Open my trip', 'rootgo', 'x.trip', 'Tickets are in your wallet']; }
      })[s]();
      const lime = s === 'plan' || s === 'pay' || s === 'booked' || s === 'paid';
      hero = '<div class="hero-lime' + (lime ? '' : ' soft') + '"><div class="hl-top"><span class="pill dark">' + ic('users', 12) + E((t.name || 'Trip Room').toUpperCase()) + '</span><span class="stack">' + t.order.filter(function (x) { return !t.members[x].out; }).slice(0, 5).map(function (x) { return UI.av(x, 24); }).join('') + '</span></div><h2>' + E(bits[0]) + '</h2><p>' + E(bits[1]) + '</p></div>' +
        journey(s) +
        '<div class="card checks">' + checkRows(s, t, m) + '</div>';
      dock = UI.dock({ cue: bits[5], label: bits[2], act: bits[3], p: bits[4] });
    }
    return '<div class="body">' + hello + hero + '</div>' + dock;
  };
  function checkRows(s, t, m) {
    const rows = [
      ['Invite opened', m.joined, 'Ira added you on WhatsApp'],
      ['You answered', !!m.answer, m.answer ? T.DATES[m.answer.dates].label + ' · from ' + m.answer.city : 'Dates, budget and city'],
      ['Plan approved', !!m.vote, m.vote ? (m.vote === 'soft' ? 'Soft yes' : 'Approved') : 'Ira shares the plan next'],
      ['Share paid', !!m.paid, m.paid ? T.fmt(m.paid.amount) : 'Opens after everyone approves']
    ];
    return rows.map(function (r) { return '<div class="mrow"><i class="ckd ' + (r[1] ? 'ok' : '') + '">' + (r[1] ? ic('check', 14) : '') + '</i><span class="crow-t"><b>' + E(r[0]) + '</b><small>' + E(r[2]) + '</small></span></div>'; }).join('');
  }
  H.changeAnswer = function (ph) { A.reopen(ph.uid); ph.replace('t.answer'); };

  /* ---------- WhatsApp ---------- */
  S['t.wa'] = function (ph) {
    const msgs = T.store.get().messages.filter(function (m) { return m.to === ph.uid; });
    const body = msgs.length ? msgs.map(function (m) {
      const tm = new Date(m.ts);
      const time = (tm.getHours() % 12 || 12) + ':' + (tm.getMinutes() < 10 ? '0' : '') + tm.getMinutes() + ' ' + (tm.getHours() >= 12 ? 'pm' : 'am');
      const link = m.kind === 'invite' ? '<button type="button" class="wa-card" data-a="go" data-p="t.join"><span class="wa-img" style="background-image:' + UI.img('getaway.svg') + '"></span><span class="wa-c"><b>Join Ira’s December trip</b><small>cleartrip.com/room/dec-x7k2</small></span></button>' : '';
      const cta = m.cta && m.kind !== 'invite' ? '<button type="button" class="wa-cta" data-a="waGo" data-p="' + E(m.cta.screen) + '" data-q="' + E(JSON.stringify(m.cta.params || {})) + '">' + E(m.cta.label) + '</button>' : '';
      return '<div class="wa-b">' + link + '<p>' + E(m.text) + '</p>' + cta + '<span class="wa-tm">' + time + '</span></div>';
    }).join('') : '<div class="wa-empty">' + ic('message', 22) + '<b>No messages yet</b><p>When Ira shares the Trip Room, the invite arrives here.</p></div>';
    return '<div class="wa"><div class="wa-h">' + UI.rbtn('back', 'back', '', 'Back', 'glass') + UI.av('ira', 36) + '<span class="wa-n"><b>Ira · Trip Agent</b><small>Business account</small></span></div>' +
      '<div class="wa-body body">' + '<div class="wa-day">Today</div>' + body + '</div><div class="wa-comp"><span>Message</span><i>' + ic('send', 16) + '</i></div></div>';
  };
  H.waGo = function (ph, arg, el) {
    let q = {}; try { q = JSON.parse(el.getAttribute('data-q') || '{}'); } catch (e) { q = {}; }
    ph.go(arg, q);
  };

  /* ---------- Join ---------- */
  S['t.join'] = function (ph) {
    const t = T.store.get().trip;
    const going = t.order.filter(function (x) { return !t.members[x].out; });
    return '<div class="body">' + UI.top({ title: '', close: true }) +
      '<div class="joinhero" style="background-image:' + UI.img('getaway.svg') + '"><span class="stack">' + going.slice(0, 5).map(function (x) { return UI.av(x, 34, 'ring'); }).join('') + '</span></div>' +
      '<h1 class="big c">Join Ira’s December trip</h1><p class="sub c">' + going.length + ' friends are planning ' + E(Q.datesInfo().short) + '</p>' +
      '<div class="card list">' +
      '<div class="mrow"><i class="pr-i">' + ic('clock', 18) + '</i><span class="crow-t"><b>Takes 30 seconds</b><small>Dates, budget and where you fly from</small></span></div>' +
      '<div class="mrow"><i class="pr-i">' + ic('wallet', 18) + '</i><span class="crow-t"><b>No payment yet</b><small>You approve the plan before anything is charged</small></span></div>' +
      '<div class="mrow"><i class="pr-i">' + ic('eyeoff', 18) + '</i><span class="crow-t"><b>Your budget stays private</b><small>Ira only sees the group ceiling</small></span></div></div></div>' +
      UI.dock({ cue: 'Two taps and a city', label: 'Join the trip', act: 'joinTrip' });
  };
  H.joinTrip = function (ph) { A.join(ph.uid); ph.replace('t.answer'); };

  /* ---------- Answer ---------- */
  function ansState(ph) {
    const key = 'ans-' + ph.uid;
    if (!ph.local[key]) { const m = Q.member(ph.uid); ph.local[key] = { dates: 'weekend', budget: 'b16', city: (m && m.city) || 'BLR', sure: true }; }
    return ph.local[key];
  }
  S['t.answer'] = function (ph) {
    const a = ansState(ph), pooled = Q.trip().pool.open;
    return '<div class="body">' + UI.top({ title: '', back: true }) +
      '<h1 class="big">Your dates and budget</h1><p class="sub">Only you see your budget. Ira sees the group ceiling.</p>' +
      '<div class="card form"><div class="fl">Dates</div><div class="chips">' + Object.keys(T.DATES).map(function (k) { return UI.chip(T.DATES[k].id === 'weekend' ? 'Fri 18–Mon 21 Dec' : T.DATES[k].label, { active: a.dates === k, act: 'ans', p: 'dates:' + k }); }).join('') + '</div>' +
      '<div class="fl">Budget per person</div><div class="chips">' + Object.keys(T.ANSWER_BUDGETS).map(function (k) { return UI.chip(T.ANSWER_BUDGETS[k].label, { active: a.budget === k, act: 'ans', p: 'budget:' + k }); }).join('') + '</div>' +
      '<div class="fl">Flying from</div><div class="chips">' + Object.keys(T.CITIES).map(function (k) { return UI.chip(T.CITIES[k], { active: a.city === k, act: 'ans', p: 'city:' + k }); }).join('') + '</div>' +
      '<div class="fl">How sure are you?</div><div class="chips">' + UI.chip('I’m in', { active: a.sure, act: 'ans', p: 'sure:1' }) + UI.chip('Maybe', { active: !a.sure, act: 'ans', p: 'sure:0' }) + '</div></div>' +
      '<div class="note">' + ic('eyeoff', 16) + '<span>Your budget is never shown to other friends.</span></div></div>' +
      UI.dock({ cue: 'Ira picks a destination next', label: 'Send my answer', act: 'sendAnswer', left: '', under: pooled ? '' : '<button type="button" class="under-btn" data-a="cantGo">Can’t make it</button>' });
  };
  H.ans = function (ph, arg) {
    const kv = arg.split(':'), a = ansState(ph);
    a[kv[0]] = kv[0] === 'sure' ? kv[1] === '1' : kv[1];
    ph.render();
  };
  H.sendAnswer = function (ph) {
    A.answer(ph.uid, ansState(ph));
    ph.toast('Answer sent to Ira', 'send');
    ph.replace('t.hub');
  };
  H.cantGo = function (ph) { A.decline(ph.uid); ph.replace('t.out'); };

  /* ---------- Out ---------- */
  S['t.out'] = function (ph) {
    const t = T.store.get().trip;
    return '<div class="body center-col"><span class="big-check dim">' + ic('user', 26) + '</span><h1 class="big c">You’re out of this trip</h1><p class="sub c">Ira has been told. You can change your answer until the pool opens.</p>' +
      '<div class="note ok">' + ic('check', 16) + '<span>Your answer is saved, nothing was charged.</span></div></div>' +
      UI.dock({ cue: 'You can still join', label: 'Change my answer', act: 'changeAnswer', dark: true, disabled: t.pool.open, under: '<button type="button" class="under-btn" data-a="rootgo" data-p="t.hub">Back to home</button>' });
  };

  /* ---------- Approve the plan ---------- */
  S['t.approve'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid, m = Q.member(uid), plan = t.plan, dest = T.DEST[plan.destId];
    if (!plan || t.stage === 'draft' || t.stage === 'invited') return '<div class="body">' + UI.top({ title: 'The plan' }) + UI.empty('clock', 'No plan yet', 'Ira is still choosing a destination.') + '</div>';
    const sh = Q.shareFor(uid), f = Q.pickedFlight(uid), stay = Q.stayOf(plan), ex = Q.extrasOf(plan);
    const open = t.stage === 'confirming' && !m.vote;
    const hold = plan.holdEnds ? UI.countdown(plan.holdEnds - Date.now()) : '';
    return '<div class="body">' + UI.top({ title: dest.name + ' plan' }) +
      '<div class="planhero" style="background-image:' + UI.img(dest.img) + '"><span class="pill dark">' + ic('sparkles', 12) + 'Planned by Trip Agent</span><div class="ph-p"><b>' + T.fmt(sh.total) + '</b><span>your share · ' + Q.headcount() + ' travelling</span></div></div>' +
      (hold ? '<div class="note warn">' + ic('clock', 16) + '<span>Held for the group · ends in ' + hold + '</span></div>' : '') +
      '<div class="card rows"><div class="prow static"><i class="pr-i">' + ic('plane', 18) + '</i><span class="pr-t"><b>Your flight · ' + E(Q.dayLabel(0).dow + ' ' + Q.dayLabel(0).date + ' ' + Q.dayLabel(0).mon) + '</b><small>' + E(f.from) + ' ' + E(f.out) + ' to ' + E(dest.code) + ' ' + E(f.arr) + ' · ' + E(f.carrier.split(' · ')[1]) + '</small></span><b class="pr-r">' + T.fmt(f.fare) + '</b></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('bed', 18) + '</i><span class="pr-t"><b>' + E(stay.name) + '</b><small>' + (Q.dayCount() - 1) + ' nights · ' + E(stay.cancel.toLowerCase()) + '</small></span><b class="pr-r">' + T.fmt(sh.stay) + '</b></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('pin', 18) + '</i><span class="pr-t"><b>Group extras</b><small>' + (ex.length ? E(ex.map(function (e) { return e.name.split(' ')[0]; }).join(' · ')) : 'None') + '</small></span><b class="pr-r">' + T.fmt(sh.extras) + '</b></div></div>' +
      '<div class="card share"><div class="yr"><span>Your share</span><b>' + T.fmt(sh.total) + '</b></div><div class="split4"><div><small>Flights</small><b>' + T.fmt(sh.flights) + '</b></div><div><small>Stay</small><b>' + T.fmt(sh.stay) + '</b></div><div><small>Extras</small><b>' + T.fmt(sh.extras) + '</b></div><div><small>Buffer</small><b>' + T.fmt(sh.buffer) + '</b></div></div><p class="fine">' + ic('lock', 12) + ' The buffer comes back if prices hold. You pay after everyone replies.</p></div></div>' +
      (open ? UI.dock({
        cue: 'Then pay once the pool opens', label: 'Approve the plan', act: 'vote', p: 'approved',
        under: '<div class="two"><button type="button" class="under-btn" data-a="vote" data-p="soft">Soft yes</button><button type="button" class="under-btn" data-a="vote" data-p="out">Can’t make it</button></div>'
      }) : UI.dock({ cue: m.vote ? 'Ira opens the pool next' : 'The pool is open', label: m.vote ? (m.vote === 'soft' ? 'You gave a soft yes' : 'You approved') : 'Back', act: m.vote ? 'rootgo' : 'back', p: 't.hub', icon: 'check' }));
  };
  H.vote = function (ph, v) {
    A.vote(ph.uid, v);
    if (v === 'out') { ph.replace('t.out'); return; }
    ph.toast(v === 'soft' ? 'Soft yes sent' : 'Approved', 'thumb');
    ph.replace('t.hub');
  };

  /* ---------- Pay ---------- */
  S['t.pay'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid, m = Q.member(uid);
    if (t.stage !== 'pooling' && t.stage !== 'booking') return '<div class="body">' + UI.top({ title: 'Pay your share' }) + UI.empty('clock', 'The pool isn’t open yet', 'Ira opens it once everyone has replied. You’ll get a message.') + '</div>';
    const sh = t.pool.locked[uid], count = Q.paidCount(), n = Q.headcount();
    return '<div class="body">' + UI.top({ title: T.DEST[t.plan.destId].name + ' trip pool' }) +
      '<div class="hero-lime pool"><div class="pl-top"><small>THE POOL</small><span class="pill dark">' + ic('clock', 12) + 'Closes Tue 6 PM</span></div><div class="pl-amt"><b>' + count + ' of ' + n + '</b><span>have paid</span></div>' + UI.bar(n ? count / n * 100 : 0, 'dark') + '<p class="pl-n">' + ic('eyeoff', 14) + 'Names stay private. Only the count is shown.</p></div>' +
      '<div class="card share"><div class="yr"><span>Your share</span><b>' + T.fmt(sh.total) + '</b></div><div class="split4"><div><small>Flights</small><b>' + T.fmt(sh.flights) + '</b></div><div><small>Stay</small><b>' + T.fmt(sh.stay) + '</b></div><div><small>Extras</small><b>' + T.fmt(sh.extras) + '</b></div><div><small>Buffer</small><b>' + T.fmt(sh.buffer) + '</b></div></div><p class="fine">' + ic('lock', 12) + ' Held in the pool. Refundable until booked.</p></div>' +
      '<div class="card rows"><div class="prow static"><i class="pr-i">' + ic('card', 18) + '</i><span class="pr-t"><b>UPI · ' + E(P[uid].name.toLowerCase()) + '@okbank</b><small>Simulated, no money moves</small></span><span class="pill ok">Default</span></div></div></div>' +
      (m.paid ? UI.dock({ cue: 'Booking starts when the pool is full', label: 'Paid · see my receipt', act: 'go', p: 't.receipt', icon: 'check' }) :
        UI.dock({ cue: 'I book everything once the pool is full', slide: UI.slide('Slide to pay ' + T.fmt(sh.total), 'travPay'), under: 'Payment simulated' }));
  };
  H['slide:travPay'] = function (ph) {
    A.pay(ph.uid);
    ph.toast('Paid ' + T.fmt(Q.shareFor(ph.uid).total), 'check');
    ph.replace('t.receipt');
  };

  /* ---------- Receipt ---------- */
  S['t.receipt'] = function (ph) {
    const t = T.store.get().trip, uid = ph.uid, m = Q.member(uid);
    if (!m || !m.paid) return '<div class="body">' + UI.top({ title: 'Receipt' }) + UI.empty('doc', 'No receipt yet', 'Your receipt appears after you pay your share.') + '</div>';
    const sh = t.pool.locked[uid], d = new Date(m.paid.at);
    const booked = t.stage === 'booked';
    const w = booked ? Q.wallet() : null;
    return '<div class="body">' + UI.top({ title: 'Receipt', back: false }) +
      '<div class="center-col tight"><span class="big-check">' + ic('check', 28) + '</span><h1 class="big c">You’re in</h1><p class="sub c">' + E(Q.datesInfo().short) + ' · ' + E(T.DEST[t.plan.destId].name) + '</p></div>' +
      '<div class="card rcpt"><div><span>Paid</span><b>' + T.fmt(m.paid.amount) + '</b></div><div><span>Method</span><b>UPI</b></div><div><span>Reference</span><b>' + E(m.paid.ref) + '</b></div><div><span>Date</span><b>' + d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '</b></div><div><span>Status</span><b>' + (booked ? 'Booked' : 'Held in the pool') + '</b></div></div>' +
      '<div class="card share"><div class="fl">WHERE YOUR SHARE GOES</div><div class="split4"><div><small>Flights</small><b>' + T.fmt(sh.flights) + '</b></div><div><small>Stay</small><b>' + T.fmt(sh.stay) + '</b></div><div><small>Extras</small><b>' + T.fmt(sh.extras) + '</b></div><div><small>Buffer</small><b>' + T.fmt(sh.buffer) + '</b></div></div>' + (booked ? '<div class="note ok">' + ic('refresh', 16) + '<span>' + T.fmt(sh.buffer) + ' comes back to you</span></div>' : '<p class="fine">' + ic('lock', 12) + ' ' + Q.paidCount() + ' of ' + Q.headcount() + ' have paid. Booking starts when the pool is full.</p>') + '</div>' +
      (booked ? '<div class="card"><div class="sect in"><h3>Where the money went</h3><span class="pill">Simulated</span></div>' + T.splitBar(w) + '</div>' : '') + '</div>' +
      UI.dock({ cue: booked ? 'Your itinerary and tickets' : 'Back to your trip status', label: booked ? 'Open my trip' : 'Back to home', act: 'rootgo', p: booked ? 'x.trip' : 't.hub' });
  };
})();
