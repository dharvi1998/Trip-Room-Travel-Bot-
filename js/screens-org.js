/* Organiser (Ira) screens. */
(function () {
  const T = window.TR, UI = T.UI, E = UI.E, ic = window.icon, Q = T.q, A = T.act;
  const S = T.screens, H = T.on;
  const q = function (o) { return E(JSON.stringify(o)); };
  const P = T.PEOPLE;

  const STAGES = [['draft', 'Ask'], ['invited', 'Invite'], ['planning', 'Choose'], ['confirming', 'Confirm'], ['pooling', 'Pay'], ['booked', 'Booked']];
  function stageIndex(t) {
    const k = t.stage === 'booking' ? 'pooling' : t.stage;
    return Math.max(0, STAGES.findIndex(function (s) { return s[0] === k; }));
  }
  function resumeScreen(t) {
    return { draft: 'o.room', invited: 'o.responses', planning: 'o.plan', confirming: 'o.confirm', pooling: 'o.pool', booking: 'o.booking', booked: 'o.wallet' }[t.stage];
  }
  function stageLabel(t) {
    return { draft: 'Ready to share', invited: 'Waiting for answers', planning: 'Building the plan', confirming: 'Group is confirming', pooling: 'Pool is open', booking: 'Booking', booked: 'Booked' }[t.stage];
  }
  T.orgHelpers = { resumeScreen: resumeScreen, stageLabel: stageLabel, STAGES: STAGES, stageIndex: stageIndex };

  const nav = function (active) {
    const t = T.store.get().trip;
    return UI.nav([
      { id: 'home', icon: 'home', act: 'rootgo', p: 'o.home', label: 'Home' },
      { id: 'trip', icon: 'compass', act: 'orgTrip', label: 'Trip' },
      { id: 'wallet', icon: 'wallet', act: 'orgWallet', label: 'Wallet' },
      { id: 'me', icon: 'user', act: 'me', label: 'Profile' }
    ], active);
  };
  H.orgTrip = function (ph) {
    const t = T.store.get().trip;
    if (!t) { ph.toast('Start a Trip Room first', 'info'); return; }
    if (t.stage === 'booked') ph.root_('x.trip'); else ph.root_(resumeScreen(t));
  };
  H.orgWallet = function (ph) {
    const t = T.store.get().trip;
    if (!t) { ph.toast('Your wallet fills once a trip is booked', 'info'); return; }
    ph.root_(t.stage === 'booked' ? 'o.wallet' : (t.stage === 'pooling' || t.stage === 'booking') ? 'o.pool' : resumeScreen(t));
  };

  /* ---------- Home ---------- */
  S['o.home'] = function (ph) {
    const t = T.store.get().trip;
    const hero = !t ?
      '<div class="hero-lime"><div class="hl-top"><span class="pill dark">' + ic('sparkles', 12) + 'NEW · TRIP AGENT</span><span class="stack">' + ['ira', 'dev', 'rhea', 'kabir'].map(function (u) { return UI.av(u, 24); }).join('') + '</span></div>' +
      '<h2>Plan a trip with friends</h2><p>Dates, places and prices for all of you</p>' +
      '<button type="button" class="hl-btn" data-a="go" data-p="o.chat">' + ic('sparkles', 16) + 'Start a Trip Room</button></div>' :
      '<div class="hero-lime"><div class="hl-top"><span class="pill dark">' + ic('users', 12) + E(t.name).toUpperCase() + '</span><span class="stack">' + t.order.slice(0, 5).map(function (u) { return UI.av(u, 24); }).join('') + '</span></div>' +
      '<h2>' + E(stageLabel(t)) + '</h2><p>' + Q.headcount() + ' travelling · ' + E(Q.datesInfo().short) + '</p>' +
      '<div class="stages">' + STAGES.map(function (s, i) { return '<i class="' + (i <= stageIndex(t) ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<button type="button" class="hl-btn" data-a="go" data-p="' + resumeScreen(t) + '">Continue' + ic('arrow', 16) + '</button></div>';
    return '<div class="body">' +
      '<div class="hello"><div class="hello-l">' + UI.av('ira', 40) + '<div><small>Good morning</small><h1>Ira</h1></div></div>' +
      '<button type="button" class="rb" data-a="sheet" data-p="notifs" aria-label="Notifications">' + ic('bell', 18) + (T.store.get().notifs.some(function (n) { return n.to === 'ira'; }) ? '<i class="dot"></i>' : '') + '</button></div>' +
      '<button type="button" class="search" data-a="soon" data-p="Search">' + ic('search', 18) + '<span>Where to?</span><i>' + ic('sliders', 18) + '</i></button>' +
      '<div class="cats"><button class="cat on" type="button" data-a="noop">' + ic('sparkles', 14) + 'Trip Room</button><button class="cat" type="button" data-a="soon" data-p="Flights">' + ic('plane', 14) + 'Flights</button><button class="cat" type="button" data-a="soon" data-p="Stays">' + ic('bed', 14) + 'Stays</button><button class="cat" type="button" data-a="soon" data-p="Holidays">' + ic('compass', 14) + 'Holidays</button></div>' +
      hero +
      UI.sect('Popular this December', '<button type="button" class="link" data-a="soon" data-p="Browse">See all</button>') +
      '<div class="pop"><button type="button" class="pop-c" data-a="soon" data-p="Goa deals" style="background-image:' + UI.img('goa') + '"><span>Goa</span><small>from ₹4,100</small></button><button type="button" class="pop-c" data-a="soon" data-p="Jaipur deals" style="background-image:' + UI.img('jaipur') + '"><span>Jaipur</span><small>from ₹3,600</small></button></div>' +
      '</div>' + nav('home');
  };
  H.soon = function (ph, arg) { ph.toast((arg || 'This') + ' is outside this prototype', 'info'); };

  /* ---------- Conversation ---------- */
  function chatState(ph) {
    if (!ph.local.chat) ph.local.chat = { prompt: '6 friends, somewhere warm in December. Bangalore, Delhi, Mumbai.', when: 'weekend', vibe: 'Beach', budget: 'mid' };
    return ph.local.chat;
  }
  S['o.chat'] = function (ph) {
    const c = chatState(ph);
    return '<div class="body">' + UI.top({ title: 'Plan with friends', right: UI.rbtn('info', 'sheet', 'agent', 'About the agent') }) +
      '<div class="bubble me"><textarea id="chatPrompt" data-in="prompt" rows="3" aria-label="Describe your trip">' + E(c.prompt) + '</textarea></div>' +
      '<div class="bubble ai"><span class="ai-t">' + ic('sparkles', 12) + 'Trip Agent</span>Got it. Three taps and I am set.</div>' +
      '<div class="card form">' +
      '<div class="fl">When</div><div class="chips">' + Object.keys(T.DATES).map(function (k) { return UI.chip(T.DATES[k].label, { active: c.when === k, act: 'chat', p: 'when:' + k }); }).join('') + '</div>' +
      '<div class="fl">Vibe</div><div class="chips">' + ['Beach', 'Hills', 'City', 'Mix'].map(function (k) { return UI.chip(k, { active: c.vibe === k, act: 'chat', p: 'vibe:' + k }); }).join('') + '</div>' +
      '<div class="fl">Budget per person</div><div class="chips">' + Object.keys(T.BUDGETS).map(function (k) { return UI.chip(T.BUDGETS[k].label, { active: c.budget === k, act: 'chat', p: 'budget:' + k }); }).join('') + '</div>' +
      '</div></div>' + UI.dock({ cue: 'Choose who is coming', label: 'Choose who’s coming', act: 'go', p: 'o.pick' });
  };
  H['in:prompt'] = function (ph, v) { chatState(ph).prompt = v; };
  H.chat = function (ph, arg) { const kv = arg.split(':'); chatState(ph)[kv[0]] = kv[1]; ph.render(); };
  T.sheets.agent = function () {
    return '<h3>How the Trip Agent works</h3><div class="sh-list"><div class="sh-row">' + ic('users', 18) + '<span>It asks each friend privately for dates, budget and where they fly from</span></div><div class="sh-row">' + ic('sparkles', 18) + '<span>It builds one plan that fits everyone, and shows why</span></div><div class="sh-row">' + ic('wallet', 18) + '<span>Nothing is booked until the pool is full</span></div></div><div class="sh-actions">' + UI.btn('Got it', 'closeSheet', '', { kind: 'pri', block: true }) + '</div>';
  };

  /* ---------- Pick travellers ---------- */
  function pickState(ph) {
    if (!ph.local.pick) ph.local.pick = { sel: T.CONTACTS.slice(0, 5), q: '' };
    return ph.local.pick;
  }
  function contactRows(ph) {
    const p = pickState(ph), term = p.q.trim().toLowerCase();
    const list = T.CONTACTS.filter(function (u) { return !term || P[u].name.toLowerCase().indexOf(term) >= 0; });
    if (!list.length) return UI.empty('search', 'No match', 'Try another name, or add a new contact.');
    return list.map(function (u) {
      const on = p.sel.indexOf(u) >= 0;
      return '<button type="button" class="crow" data-a="pickToggle" data-p="' + u + '" aria-pressed="' + on + '">' + UI.av(u, 36) + '<span class="crow-t"><b>' + E(P[u].name) + '</b><small>' + E(P[u].phone) + '</small></span><i class="tick' + (on ? ' on' : '') + '">' + (on ? ic('check', 14) : '') + '</i></button>';
    }).join('');
  }
  S['o.pick'] = function (ph) {
    const p = pickState(ph);
    return '<div class="body">' + UI.top({ title: '', close: true, right: '<span class="stepc">1/3</span>' }) +
      '<h1 class="big">Who’s coming?</h1><p class="sub">Pick from your contacts</p>' +
      '<div class="picked"><button type="button" class="addc" data-a="sheet" data-p="addContact"><i>' + ic('plus', 18) + '</i><small>Add</small></button>' +
      p.sel.map(function (u) { return '<button type="button" class="pk" data-a="pickToggle" data-p="' + u + '" aria-label="Remove ' + E(P[u].name) + '">' + UI.av(u, 44, 'ring') + '<small>' + E(P[u].name) + '</small></button>'; }).join('') + '</div>' +
      '<label class="field">' + ic('search', 18) + '<input id="contactQ" data-in="contactq" type="search" placeholder="Search contacts" value="' + E(p.q) + '" autocomplete="off"></label>' +
      '<div class="card list" id="contactList">' + contactRows(ph) + '</div>' +
      '<p class="fine">' + ic('lock', 12) + ' Numbers stay masked. Friends get a WhatsApp link, no account needed.</p></div>' +
      UI.dock({ cue: 'Invites go out on WhatsApp', label: p.sel.length ? 'Add ' + p.sel.length + ' traveller' + (p.sel.length > 1 ? 's' : '') : 'Pick at least one friend', act: 'createRoom', dark: true, disabled: !p.sel.length });
  };
  H.pickToggle = function (ph, u) {
    const p = pickState(ph), i = p.sel.indexOf(u);
    if (i >= 0) p.sel.splice(i, 1); else p.sel.push(u);
    ph.render();
  };
  H['in:contactq'] = function (ph, v) {
    pickState(ph).q = v;
    const el = ph.scr.querySelector('#contactList');
    if (el) el.innerHTML = contactRows(ph);
  };
  H.createRoom = function (ph) {
    const c = chatState(ph), p = pickState(ph);
    A.createTrip({ prompt: c.prompt, when: c.when, vibe: c.vibe, budget: c.budget, invitees: p.sel.slice() });
    ph.replace('o.room');
  };
  T.sheets.addContact = function (ph) {
    return '<h3>Add a friend</h3><p class="sh-p">They get the same WhatsApp invite as everyone else.</p>' +
      '<label class="lab">Name<input id="newName" class="inp" type="text" placeholder="e.g. Tara" autocomplete="off"></label>' +
      '<label class="lab">Mobile number<input id="newPhone" class="inp" type="tel" placeholder="98765 43210" autocomplete="off"></label>' +
      '<div class="sh-actions">' + UI.btn('Add friend', 'addContact', '', { kind: 'pri', block: true }) + '</div>';
  };
  H.addContact = function (ph) {
    const n = (ph.layer.querySelector('#newName') || {}).value || '';
    const m = (ph.layer.querySelector('#newPhone') || {}).value || '';
    if (!n.trim()) { ph.toast('Add a name first', 'info'); return; }
    const id = A.addContact(n.trim(), m.trim());
    pickState(ph).sel.push(id);
    ph.closeSheet();
    ph.render();
    ph.toast(n.trim() + ' added', 'userplus');
  };

  /* ---------- Trip Room created ---------- */
  S['o.room'] = function (ph) {
    const t = T.store.get().trip;
    const sent = t.stage !== 'draft';
    const link = 'cleartrip.com/room/' + t.id;
    return '<div class="body">' + UI.top({ title: t.name, right: UI.rbtn('share', 'copy', link, 'Share') }) +
      '<div class="hero-lime center"><span class="big-check">' + ic('check', 28) + '</span><h2>Trip Room is ready</h2>' +
      '<button type="button" class="linkpill" data-a="copy" data-p="' + link + '">' + ic('link', 14) + '<span>' + E(link) + '</span>' + ic('copy', 14) + '</button></div>' +
      '<div class="card wa"><div class="fl">WHAT THEY GET ON WHATSAPP</div><p class="wa-t">Ira is planning December. Pick dates and a budget in 30 seconds.</p></div>' +
      '<div class="card invited"><span class="stack">' + t.order.filter(function (u) { return u !== 'ira'; }).map(function (u) { return UI.av(u, 28); }).join('') + '</span>' +
      '<span class="inv-t">' + ic('clock', 14) + (t.order.length - 1) + ' invited · replies close ' + E(t.closes) + '</span></div></div>' +
      UI.dock({
        cue: sent ? 'See who has answered' : 'Friends answer in 30 seconds', label: sent ? 'See responses' : 'Share on WhatsApp', act: sent ? 'go' : 'share', p: sent ? 'o.responses' : '',
        under: sent ? '' : '<button type="button" class="under-btn" data-a="copy" data-p="' + link + '">' + ic('copy', 14) + 'Copy link</button>'
      });
  };
  H.share = function (ph) {
    A.shareInvites();
    ph.toast('Invites sent on WhatsApp', 'message');
    ph.replace('o.responses');
  };

  /* ---------- Responses ---------- */
  S['o.responses'] = function (ph) {
    const t = T.store.get().trip;
    const ms = Q.members(), replied = Q.repliedCount();
    const pending = ms.filter(function (m) { return !Q.hasReplied(m); });
    const outs = ms.filter(function (m) { return m.out; }), maybe = ms.filter(function (m) { return m.answer && m.answer.sure === false && !m.out; });
    const answered = ms.filter(function (m) { return m.answer && !m.out; });
    const cities = {};
    answered.forEach(function (m) { cities[m.answer.city] = 1; });
    const fit = Q.datesFit();
    const canPlan = answered.length >= 2;
    const beyond = t.stage !== 'invited' && t.stage !== 'draft';
    const noteBits = [];
    if (outs.length) noteBits.push(outs.map(function (m) { return P[m.uid].name; }).join(', ') + (outs.length > 1 ? ' are out' : ' is out'));
    if (maybe.length) noteBits.push(maybe.map(function (m) { return P[m.uid].name; }).join(', ') + (maybe.length > 1 ? ' are tentative' : ' is tentative'));
    return '<div class="body">' + UI.top({ title: t.name, right: UI.rbtn('share', 'copy', 'cleartrip.com/room/' + t.id, 'Share link') }) +
      '<div class="hero-lime split">' + UI.ring(replied, ms.length, replied + ' of ' + ms.length, 'answered', 112) +
      '<div class="hl-r"><small>CLOSES</small><b>' + E(t.closes) + '</b><span class="pill dark">' + ic('sparkles', 12) + 'I plan then</span></div></div>' +
      '<div class="avrow">' + ms.map(function (m) { return '<div class="avc">' + UI.avStatus(m.uid, 38, Q.status(m)) + '<small>' + E(P[m.uid].name) + '</small></div>'; }).join('') + '</div>' +
      '<div class="fl pad">WHAT I LEARNED</div>' +
      '<div class="tiles3">' +
      '<div class="tile">' + ic('cal', 18) + '<small>Dates</small><b>' + (answered.length ? (fit.ok === fit.of ? E(Q.datesInfo().short.replace(' Dec', '')) : fit.ok + ' of ' + fit.of + ' fit') : '—') + '</b></div>' +
      '<div class="tile">' + ic('rupee', 18) + '<small>Budget</small><b>' + (answered.length ? T.fmtK(Q.ceiling()).replace('₹', '₹') + ' ceiling' : '—') + '</b></div>' +
      '<div class="tile">' + ic('plane', 18) + '<small>From</small><b>' + (answered.length ? Object.keys(cities).join(' · ') : '—') + '</b></div></div>' +
      (noteBits.length ? '<div class="note warn">' + ic('alert', 16) + '<span>' + E(noteBits.join(' · ')) + '</span></div>' : (pending.length ? '<div class="note">' + ic('clock', 16) + '<span>' + pending.length + ' still to answer</span></div>' : '<div class="note ok">' + ic('check', 16) + '<span>Everyone has answered</span></div>')) +
      '<div class="card list">' + ms.filter(function (m) { return m.uid !== 'ira'; }).map(function (m) {
        const st = Q.status(m), canNudge = !Q.hasReplied(m);
        return '<div class="mrow">' + UI.av(m.uid, 36) + '<span class="crow-t"><b>' + E(P[m.uid].name) + '</b><small>' + (m.answer ? E('Answered · from ' + m.answer.city) : m.joined ? 'Opened the invite' : 'Invite sent') + '</small></span>' +
          (canNudge ? '<button type="button" class="mini" data-a="remind" data-p="' + m.uid + '">Remind</button>' : UI.statusPill(st)) + '</div>';
      }).join('') + '</div></div>' +
      UI.dock({
        cue: beyond ? 'Back to the plan' : 'I plan with the answers',
        label: beyond ? 'Open the plan' : (canPlan ? 'Plan with what we have' : 'Waiting for the first answer'),
        act: 'go', p: beyond ? resumeScreen(t) : 'o.options', disabled: !beyond && !canPlan
      });
  };
  H.remind = function (ph, uid) { A.remind(uid); ph.toast('Reminder sent to ' + P[uid].name, 'bell'); };

  /* ---------- Options ---------- */
  function optCard(o, sel, big) {
    const d = o.dest, on = sel === o.id;
    const tags = [];
    tags.push(o.datesOk ? ['Dates fit', 'ok', 'check'] : ['Dates clash', 'err', 'alert']);
    tags.push(o.inBudget ? ['In budget', 'ok', 'check'] : ['Over budget', 'err', 'alert']);
    tags.push(d.direct ? ['Direct', 'ok', 'plane'] : [d.roadNote, 'warn', 'clock']);
    return '<button type="button" class="opt' + (on ? ' on' : '') + '" data-a="pickDest" data-p="' + o.id + '" aria-pressed="' + on + '" style="background-image:' + UI.img(d.img) + '">' +
      '<span class="opt-top">' + (o.best ? '<span class="pill lime">' + ic('check', 12) + 'Best fit</span>' : o.cheapest ? '<span class="pill white">Cheapest</span>' : '<span></span>') + '<i class="opt-star">' + (on ? ic('check', 14) : ic('star', 14)) + '</i></span>' +
      '<span class="opt-b"><b>' + E(d.name) + '</b><span class="opt-p">' + T.fmt(o.price) + ' <small>per person</small></span>' +
      '<span class="opt-tags">' + tags.map(function (t) { return '<span class="tg ' + t[1] + '">' + ic(t[2], 11) + E(t[0]) + '</span>'; }).join('') + '</span></span></button>';
  }
  S['o.options'] = function (ph) {
    const t = T.store.get().trip;
    let opts = Q.destOptions();
    const f = ph.local.optf || 'best', scope = ph.local.optscope || 'vibe', vibe = t.vibe || 'Beach';
    const inVibe = opts.filter(function (o) { return o.dest.vibes && o.dest.vibes.indexOf(vibe) >= 0; });
    if (scope === 'vibe' && inVibe.length) opts = inVibe;
    if (f === 'cheapest') opts = opts.slice().sort(function (a, b) { return a.price - b.price; });
    if (f === 'under') opts = opts.filter(function (o) { return o.price <= 12000; });
    const sel = ph.local.dest && opts.some(function (o) { return o.id === ph.local.dest; }) ? ph.local.dest : (opts[0] && opts[0].id);
    ph.local.dest = sel;
    const locked = t.stage !== 'invited' && t.stage !== 'draft' && t.stage !== 'planning';
    return '<div class="body">' + UI.top({ title: '', right: UI.rbtn('sliders', 'sheet', 'agent', 'Filters') }) +
      '<h1 class="big">Choose your destination</h1>' +
      '<div class="chips tight">' + UI.chip(vibe + ' · ' + inVibe.length, { active: scope === 'vibe', act: 'optscope', p: 'vibe' }) + UI.chip('All places · ' + Q.destOptions().length, { active: scope === 'all', act: 'optscope', p: 'all' }) + '</div>' +
      '<div class="chips tight hscroll">' + UI.chip('Best fit', { active: f === 'best', act: 'optf', p: 'best' }) + UI.chip('Cheapest', { active: f === 'cheapest', act: 'optf', p: 'cheapest' }) + UI.chip('Under ₹12k', { active: f === 'under', act: 'optf', p: 'under' }) + '</div>' +
      (opts.length ? opts.map(function (o, i) { return optCard(o, sel, i === 0); }).join('') : UI.empty('search', 'Nothing under ₹12k', 'Try Best fit or Cheapest to see every option.')) +
      '</div>' + UI.dock({ cue: 'See the full plan', label: sel ? 'Build the ' + T.DEST[sel].name + ' plan' : 'Choose a destination', act: 'buildPlan', p: sel || '', disabled: !sel || locked });
  };
  H.optscope = function (ph, v) { ph.local.optscope = v; ph.render(); };
  H.optf = function (ph, v) { ph.local.optf = v; ph.render(); };
  H.pickDest = function (ph, id) { ph.local.dest = id; ph.render(); };
  H.buildPlan = function (ph, id) {
    const t = T.store.get().trip;
    A.chooseDest(id);
    ph.go('o.plan');
  };

  /* ---------- Plan board ---------- */
  function latestArrival() {
    let worst = null;
    Q.activeMembers().forEach(function (m) {
      const f = Q.pickedFlight(m.uid);
      if (!worst || T.mins(f.arr) > T.mins(worst.f.arr)) worst = { f: f, uid: m.uid };
    });
    return worst;
  }
  function shareTiles(sh) {
    return '<div class="split4"><div><small>Flights</small><b>' + T.fmt(sh.flights) + '</b></div><div><small>Stay</small><b>' + T.fmt(sh.stay) + '</b></div><div><small>Extras</small><b>' + T.fmt(sh.extras) + '</b></div><div><small>Buffer</small><b>' + T.fmt(sh.buffer) + '</b></div></div>';
  }
  S['o.plan'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan, dest = T.DEST[plan.destId];
    const stay = Q.stayOf(plan), ex = Q.extrasOf(plan), sh = Q.shareFor('ira');
    const edit = t.stage === 'planning';
    const la = latestArrival(), late = T.mins(la.f.arr) > 11 * 60 + 30;
    const slotsOpen = [0, 1, 2, 3].slice(0, Q.dayCount()).reduce(function (a) { return a + 1; }, 0);
    const days = [];
    for (let i = 0; i < Q.dayCount(); i++) days.push(Q.dayLabel(i));
    const hold = t.plan.holdEnds ? UI.countdown(t.plan.holdEnds - Date.now()) : null;
    return '<div class="body">' + UI.top({ title: dest.name + ' plan', right: UI.rbtn('sliders', 'sheet', 'agent', 'Options') }) +
      '<div class="planhero" style="background-image:' + UI.img(dest.img) + '"><span class="pill dark">' + ic('sparkles', 12) + 'Planned by Trip Agent</span><div class="ph-p"><b>' + T.fmt(sh.total) + '</b><span>per person · ' + Q.headcount() + ' travelling</span></div></div>' +
      '<div class="days">' + days.map(function (d, i) { return '<span class="day' + (i === 0 ? ' on' : '') + '"><small>' + d.dow + '</small><b>' + d.date + '</b></span>'; }).join('') + '</div>' +
      '<div class="note ' + (hold ? 'warn' : 'warn') + '">' + ic('clock', 16) + '<span>' + (hold ? 'Held for the group · ends in ' + hold : 'Held until Tue 6 PM once you send it') + '</span></div>' +
      '<div class="card rows">' +
      '<button type="button" class="prow" data-a="go" data-p="o.flights">' + '<i class="pr-i">' + ic('plane', 18) + '</i><span class="pr-t"><b>Flights · ' + E(Q.dayLabel(0).dow + ' ' + Q.dayLabel(0).date + ' ' + Q.dayLabel(0).mon) + '</b><small>' + (late ? E(P[la.uid].name + ' lands ' + la.f.arr) : 'All land by ' + E(la.f.arr)) + '</small></span><span class="pr-r">' + (edit ? 'Swap' : ic('chevR', 16)) + '</span></button>' +
      '<button type="button" class="prow" data-a="go" data-p="o.stay">' + '<i class="pr-i">' + ic('bed', 18) + '</i><span class="pr-t"><b>' + E(stay.name) + '</b><small>' + E(stay.amen[0][1] + ' · ' + (stay.amen.some(function (a) { return a[1] === 'Pool'; }) ? 'pool · ' : '') + stay.cancel.toLowerCase().replace('free cancel until', 'free cancel')) + '</small></span><span class="pr-r">' + (edit ? 'Swap' : ic('chevR', 16)) + '</span></button>' +
      '<button type="button" class="prow" data-a="go" data-p="o.extras">' + '<i class="pr-i">' + ic('pin', 18) + '</i><span class="pr-t"><b>Things to do</b><small>' + (ex.length ? ex.slice(0, 3).map(function (e) { return E(e.name.split(' ')[0]); }).join(' · ') : 'Nothing picked yet') + '</small></span><span class="pr-r">' + ic('chevR', 16) + '</span></button></div>' +
      '<div class="card share"><div class="fl">YOUR SHARE</div>' + shareTiles(sh) + '<p class="fine">' + ic('lock', 12) + ' The buffer comes back if prices hold. Each friend pays their own fare.</p></div></div>' +
      UI.dock({
        cue: edit ? 'Group confirms the plan' : 'Check who has said yes', label: edit ? 'Send to group' : 'Open confirmations', act: edit ? 'sendPlan' : 'go', p: edit ? '' : 'o.confirm',
        left: edit ? '<button type="button" class="secbtn" data-a="go" data-p="o.why">' + ic('info', 16) + 'Why this?</button>' : ''
      });
  };
  H.sendPlan = function (ph) {
    A.sendPlan();
    ph.toast('Plan sent to the group', 'send');
    ph.replace('o.confirm');
  };

  /* ---------- Stay ---------- */
  S['o.stay'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan, dest = T.DEST[plan.destId], stay = Q.stayOf(plan);
    const n = Q.headcount(), edit = t.stage === 'planning';
    const pp = Math.round(stay.price / n);
    return '<div class="body nopad">' +
      '<div class="stayhero" style="background-image:' + UI.img(stay.img) + '"><div class="sh-top">' + UI.rbtn('back', 'back', '', 'Back', 'glass') + '<span class="sh-r">' + UI.rbtn('share', 'copy', 'cleartrip.com/stay/' + stay.id, 'Share', 'glass') + '</span></div>' +
      '<div class="sh-b"><span class="pill dark">' + ic('clock', 12) + 'Held until Tue 6 PM</span><h1>' + E(stay.name) + '</h1><p>' + ic('pin', 14) + E(stay.area) + ' &nbsp; ' + ic('star', 14) + E(stay.rating) + '</p></div></div>' +
      '<div class="pad16"><div class="chips tight"><span class="pill white">' + ic('pin', 12) + E(stay.beach) + '</span><span class="pill white">' + ic('users', 12) + 'Fits ' + stay.fits + '</span><span class="pill white">' + ic('cal', 12) + (Q.dayCount() - 1) + ' nights</span></div>' +
      '<div class="amen">' + stay.amen.map(function (a) { return '<div><i>' + ic(a[0], 20) + '</i><small>' + E(a[1]) + '</small></div>'; }).join('') + '</div>' +
      '<div class="note ok">' + ic('check', 16) + '<span>' + E(stay.cancel) + '</span></div>' +
      (edit ? '<div class="fl pad">OTHER PLACES</div><div class="card list">' + dest.stays.map(function (s) {
        const ok = s.fits >= n, on = s.id === stay.id;
        return '<button type="button" class="crow" data-a="setStay" data-p="' + s.id + '"' + (ok ? '' : ' disabled') + ' aria-pressed="' + on + '"><span class="thumb" style="background-image:' + UI.img(s.img) + '"></span><span class="crow-t"><b>' + E(s.name) + '</b><small>' + (ok ? T.fmt(s.price) + ' for ' + n + ' · ' + E(s.area) : 'Fits ' + s.fits + ', you need ' + n) + '</small></span><i class="tick' + (on ? ' on' : '') + '">' + (on ? ic('check', 14) : '') + '</i></button>';
      }).join('') + '</div>' : '') + '</div></div>' +
      '<div class="dock"><div class="cue"><span class="cue-i">' + ic('arrow', 9) + '</span><b>Next</b><span>' + (edit ? 'Back to the plan' : 'Group confirms the plan') + '</span></div><div class="dock-row"><div class="price"><b>' + T.fmt(pp) + '</b><small>per person · ' + T.fmt(stay.price) + ' for ' + n + '</small></div><button type="button" class="cta" data-a="back"><span>Looks good</span><i class="cta-ar">' + ic('arrow', 16) + '</i></button></div></div>';
  };
  H.setStay = function (ph, id) { A.setStay(id); ph.render(); };

  /* ---------- Flights ---------- */
  function flightCard(f, on, edit, city) {
    return '<button type="button" class="fl-card' + (on ? ' on' : '') + '" data-a="setFlight" data-p="' + city + '|' + f.id + '"' + (edit ? '' : ' disabled') + ' aria-pressed="' + on + '">' +
      '<span class="fl-side">' + E(f.carrier.toUpperCase()) + '</span><span class="fl-main"><span class="fl-line"><b>' + f.from + '</b><i>' + ic('plane', 12) + '</i><b>' + E(T.DEST[Q.trip().plan.destId].code) + '</b></span>' +
      '<span class="fl-t"><span>' + E(f.out) + ' · ' + E(Q.dayLabel(0).dow + ' ' + Q.dayLabel(0).date + ' ' + Q.dayLabel(0).mon) + '</span><span>' + E(f.arr) + '</span></span>' +
      '<span class="fl-m">' + (f.pick ? '<span class="tg ok">' + ic('check', 11) + 'Agent pick</span>' : '') + (f.late ? '<span class="tg warn">' + ic('clock', 11) + 'Lands late</span>' : '') + '<em>' + T.fmt(f.fare) + ' each</em></span>' +
      '<span class="fl-x"><span>Seats<br><b>' + E(f.seats) + '</b></span><span>Terminal<br><b>' + E(f.terminal) + '</b></span><span>Gate<br><b>' + E(f.gate) + '</b></span></span></span></button>';
  }
  S['o.flights'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan, dest = T.DEST[plan.destId], edit = t.stage === 'planning';
    const byCity = {};
    Q.activeMembers().forEach(function (m) { (byCity[m.city] = byCity[m.city] || []).push(m.uid); });
    const cities = Object.keys(byCity);
    const first = cities[0];
    return '<div class="body">' + UI.top({ title: 'Flights', right: UI.rbtn('swap', 'noop', '', 'Swap') }) +
      '<div class="route"><span><b>' + cities.join(' · ') + '</b><small>' + cities.map(function (c) { return T.CITIES[c]; }).join(', ') + '</small></span><i>' + ic('plane', 18) + '</i><span class="r"><b>' + dest.code + '</b><small>' + E(dest.airport) + '</small></span></div>' +
      '<div class="note ok">' + ic('check', 16) + '<span>Prices checked 2 min ago · ' + Q.headcount() + ' seats</span></div>' +
      cities.map(function (c) {
        const picked = Q.pickedFlight(byCity[c][0]);
        return '<div class="fl pad">' + (cities.length > 1 ? 'FROM ' + T.CITIES[c].toUpperCase() + ' · ' + byCity[c].map(function (u) { return E(P[u].name); }).join(', ') : Q.flightsFor(plan.destId, c).length + ' FLIGHTS, ' + Q.headcount() + ' SEATS TOGETHER') + '</div>' +
          Q.flightsFor(plan.destId, c).map(function (f) { return flightCard(f, f.id === picked.id, edit, c); }).join('');
      }).join('') + '</div>' +
      UI.dock({ cue: 'Back to the plan', label: 'Use ' + Q.pickedFlight(byCity[first][0]).carrier.split(' · ')[1], act: 'back' });
  };
  H.setFlight = function (ph, arg) { const p = arg.split('|'); A.setFlight(p[0], p[1]); ph.render(); };

  /* ---------- Things to do ---------- */
  S['o.extras'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan, dest = T.DEST[plan.destId], edit = t.stage === 'planning';
    const sh = Q.shareFor('ira');
    return '<div class="body">' + UI.top({ title: 'Things to do' }) +
      '<p class="sub pad16">Group extras are paid from the pool. Each one is booked for everyone once the pool is full.</p>' +
      dest.extras.map(function (e) {
        const on = plan.extraIds.indexOf(e.id) >= 0, d = Q.dayLabel(e.day);
        return '<button type="button" class="xrow' + (on ? ' on' : '') + '" data-a="toggleExtra" data-p="' + e.id + '"' + (edit ? '' : ' disabled') + ' aria-pressed="' + on + '"><span class="thumb lg" style="background-image:' + UI.img(e.img) + '"></span><span class="crow-t"><b>' + E(e.name) + '</b><small>' + E(d.dow + ' ' + T.clock(e.start)) + ' · ' + E(e.sub) + '</small><em>' + (e.price ? T.fmt(e.price) + ' per person' : 'Pay at the venue') + '</em></span><i class="sw' + (on ? ' on' : '') + '"><u></u></i></button>';
      }).join('') +
      '<div class="card share"><div class="fl">YOUR SHARE NOW</div>' + shareTiles(sh) + '<div class="tot"><span>Total per person</span><b>' + T.fmt(sh.total) + '</b></div></div></div>' +
      UI.dock({ cue: 'Back to the plan', label: 'Done', act: 'back' });
  };
  H.toggleExtra = function (ph, id) { A.toggleExtra(id); ph.render(); };

  /* ---------- Why this? ---------- */
  S['o.why'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan, dest = T.DEST[plan.destId], fit = Q.datesFit();
    const cities = {}; Q.activeMembers().forEach(function (m) { cities[m.city] = 1; });
    const ceil = Q.ceiling();
    const others = Q.destOptions().filter(function (o) { return o.id !== plan.destId; }).slice(0, 3);
    const checked = [
      fit.of ? 'Dates fit all ' + fit.ok : 'Dates fit',
      'Under the ' + T.fmtK(ceil) + ' ceiling',
      (dest.direct ? 'Direct flights from ' : 'Flights from ') + Object.keys(cities).length + ' ' + (Object.keys(cities).length > 1 ? 'cities' : 'city'),
      dest.weather
    ];
    const ruled = others.map(function (o) {
      return o.dest.name + ': ' + (!o.inBudget ? 'over budget by ' + T.fmt(o.maxShare - ceil) : !o.dest.direct ? o.dest.roadNote + ' from the airport' : 'less group fit');
    });
    return '<div class="whyhero" style="background-image:' + UI.img(dest.img) + '"><div class="sh-top">' + UI.rbtn('x', 'back', '', 'Close', 'glass') + '<span class="why-t">' + E(dest.name) + ' plan</span></div></div>' +
      '<div class="whysheet"><i class="grab"></i><h2>Why ' + E(dest.name) + ' for your group</h2>' +
      '<div class="fl">WHAT I CHECKED</div>' + checked.map(function (c) { return '<div class="li ok">' + ic('check', 16) + '<span>' + E(c) + '</span></div>'; }).join('') +
      '<div class="fl">WHAT I RULED OUT</div>' + ruled.map(function (c) { return '<div class="li no">' + ic('x', 16) + '<span>' + E(c) + '</span></div>'; }).join('') +
      '<div class="fl">ASSUMPTIONS YOU CAN CHANGE</div><div class="chips tight">' + UI.chip((Q.dayCount() - 1) + ' nights', { active: true, act: 'noop' }) + UI.chip('Whole-house stay', { active: true, act: 'noop' }) + UI.chip('Cheaper fare', { active: true, act: 'noop' }) + '</div>' +
      '<div class="conf"><span class="tg ok">Confidence: high</span><small>Drops if fares move</small></div>' +
      '<div class="why-act">' + UI.btn('Change', 'go', 'o.options', { kind: 'sec' }) + '<button type="button" class="cta" data-a="back"><span>Got it</span><i class="cta-ar">' + ic('arrow', 16) + '</i></button></div></div>';
  };

  /* ---------- Confirm with the group ---------- */
  S['o.confirm'] = function (ph) {
    const t = T.store.get().trip, plan = t.plan;
    const ms = Q.members(), pend = Q.pendingVotes();
    const ms_ = plan.holdEnds ? plan.holdEnds - Date.now() : 0;
    const total = 21 * 60 + 40;
    const left = Math.max(0, ms_ / 60000);
    const open = t.stage === 'confirming';
    const outs = ms.filter(function (m) { return m.out; });
    return '<div class="body">' + UI.top({ title: 'Confirm with the group' }) +
      '<div class="hero-lime hold"><small>HOLD ENDS IN</small><b id="holdT">' + UI.countdown(ms_) + '</b>' + UI.bar(100 - left / total * 100, 'dark') + '</div>' +
      '<div class="card list">' + ms.map(function (m) {
        const st = Q.status(m), canNudge = open && !m.out && !m.vote && m.uid !== 'ira' && !m.paid;
        return '<div class="mrow">' + UI.av(m.uid, 36) + '<span class="crow-t"><b>' + E(P[m.uid].name) + '</b><small>' + (m.out ? 'Can’t make it' : m.vote === 'soft' ? 'Soft yes · will confirm later' : m.vote ? T.fmt(Q.shareFor(m.uid).total) + ' share' : 'Reading the plan') + '</small></span>' +
          (canNudge ? '<button type="button" class="mini" data-a="remind" data-p="' + m.uid + '">Nudge</button>' : '') + (m.vote || m.out || m.uid === 'ira' || m.paid ? UI.statusPill(st === 'organiser' ? 'approved' : st) : UI.pill('Pending', 'warn')) + '</div>';
      }).join('') + '</div>' +
      (outs.length ? '<div class="note warn">' + ic('alert', 16) + '<span>' + E(outs.map(function (m) { return P[m.uid].name; }).join(', ')) + ' dropped out. The stay is now split ' + Q.headcount() + ' ways, ' + T.fmt(Q.shareFor('ira').total) + ' each.</span></div>' : '') +
      '<div class="note ok">' + ic('check', 16) + '<span>A soft yes is allowed. They can still pay later.</span></div></div>' +
      UI.dock({
        cue: open ? (pend.length ? pend.length + ' still to reply' : 'Everyone pays their own share') : 'Pool is open', label: open ? 'Open the pool' : 'Go to the pool', act: open ? 'openPool' : 'go', p: open ? '' : 'o.pool',
        disabled: open && pend.length > 0,
        left: open ? '<button type="button" class="rb big" data-a="nudgeAll" aria-label="Nudge everyone pending">' + ic('bell', 18) + '</button>' : ''
      });
  };
  T.after['o.confirm'] = function (ph) {
    const el = ph.scr.querySelector('#holdT');
    if (!el) return;
    clearInterval(ph.timers.hold);
    ph.timers.hold = setInterval(function () {
      const t = T.store.get().trip;
      if (ph.cur().id !== 'o.confirm' || !t || !t.plan.holdEnds) { clearInterval(ph.timers.hold); return; }
      el.textContent = UI.countdown(t.plan.holdEnds - Date.now());
    }, 15000);
  };
  H.nudgeAll = function (ph) {
    const pend = Q.pendingVotes();
    if (!pend.length) { ph.toast('Nobody is pending', 'check'); return; }
    pend.forEach(function (m) { A.remind(m.uid); });
    ph.toast('Nudged ' + pend.length + (pend.length > 1 ? ' friends' : ' friend'), 'bell');
  };
  H.openPool = function (ph) { A.openPool(); ph.toast('Pool is open', 'wallet'); ph.replace('o.pool'); };

  /* ---------- Pool ---------- */
  S['o.pool'] = function (ph) {
    const t = T.store.get().trip;
    if (t.stage === 'booking') { setTimeout(function () { if (ph.cur().id === 'o.pool') ph.replace('o.booking'); }, 0); }
    const total = Q.poolTotal(), paid = Q.paidTotal(), me = Q.member('ira'), sh = Q.shareFor('ira');
    const act = Q.activeMembers(), unpaid = act.filter(function (m) { return !m.paid; });
    return '<div class="body">' + UI.top({ title: T.DEST[t.plan.destId].name + ' trip pool', right: UI.rbtn('users', 'sheet', 'agent', 'People') }) +
      '<div class="hero-lime pool"><div class="pl-top"><small>THE POOL</small><span class="pill dark">' + ic('clock', 12) + 'Closes Tue 6 PM</span></div>' +
      '<div class="pl-amt"><b>' + T.fmt(paid) + '</b><span>of ' + T.fmt(total) + '</span></div>' + UI.bar(total ? paid / total * 100 : 0, 'dark') +
      '<div class="avrow tight">' + act.map(function (m) { return '<div class="avc">' + UI.avStatus(m.uid, 34, m.paid ? 'paid' : 'joined') + '<small>' + E(P[m.uid].name) + '</small></div>'; }).join('') + '</div></div>' +
      '<div class="card share"><div class="yr"><span>Your share</span><b>' + T.fmt(sh.total) + '</b></div>' + shareTiles(sh) + '<p class="fine">' + ic('lock', 12) + ' Held in the pool. Refundable until booked.</p></div>' +
      (unpaid.length ? '<div class="card strip">' + unpaid.slice(0, 3).map(function (m) { return UI.av(m.uid, 30); }).join('') + '<span>' + unpaid.length + ' still to pay</span><button type="button" class="mini dark" data-a="remindUnpaid">' + ic('bell', 12) + 'Remind</button></div>' : '') + '</div>' +
      (me.paid ? UI.dock({ cue: unpaid.length ? 'I book everything once the pool is full' : 'Booking starts', label: unpaid.length ? 'You paid · waiting for ' + unpaid.length : 'Booking', act: 'noop', disabled: true, icon: 'check' }) :
        UI.dock({ cue: 'I book everything once the pool is full', slide: UI.slide('Slide to pay ' + T.fmt(sh.total), 'orgPay'), under: 'Payment simulated' }));
  };
  H['slide:orgPay'] = function (ph) {
    A.pay('ira');
    ph.toast('Paid ' + T.fmt(Q.shareFor('ira').total), 'check');
    ph.render();
  };
  H.remindUnpaid = function (ph) {
    const un = Q.activeMembers().filter(function (m) { return !m.paid && m.uid !== 'ira'; });
    un.forEach(function (m) { A.remind(m.uid); });
    ph.toast(un.length ? 'Reminded ' + un.length + (un.length > 1 ? ' friends' : ' friend') : 'Everyone else has paid', 'bell');
  };

  /* ---------- Booking ---------- */
  S['o.booking'] = function (ph) {
    const t = T.store.get().trip;
    const steps = ['Flights for ' + Q.headcount(), Q.stayOf(t.plan).name, 'Group extras'];
    const el = Date.now() - (t.pool.fullAt || Date.now());
    const done = Math.min(steps.length, Math.floor(el / 1100));
    return '<div class="body center-col"><div class="spin-wrap"><span class="spinner"></span></div><h2>The pool is full</h2><p class="sub">Booking your trip. This takes a few seconds.</p>' +
      '<div class="card list ck">' + steps.map(function (s, i) { return '<div class="mrow">' + (i < done ? '<i class="ckd ok">' + ic('check', 14) + '</i>' : i === done ? '<i class="ckd run"></i>' : '<i class="ckd"></i>') + '<span class="crow-t"><b>' + E(s) + '</b><small>' + (i < done ? 'Confirmed' : i === done ? 'Booking now' : 'Next') + '</small></span></div>'; }).join('') + '</div></div>' +
      UI.dock({ cue: 'Tickets arrive on WhatsApp', label: 'Leave this screen, I’ll message you', act: 'rootgo', p: 'o.home' });
  };
  T.after['o.booking'] = function (ph) {
    clearInterval(ph.timers.bk);
    ph.timers.bk = setInterval(function () {
      const t = T.store.get().trip;
      if (!t || ph.cur().id !== 'o.booking') { clearInterval(ph.timers.bk); return; }
      if (t.stage === 'booked') { clearInterval(ph.timers.bk); ph.replace('o.booked'); return; }
      ph.render();
    }, 550);
  };

  /* ---------- Booked ---------- */
  S['o.booked'] = function (ph) {
    const t = T.store.get().trip, w = Q.wallet(), dest = T.DEST[t.plan.destId];
    return '<div class="body nopad"><div class="bkhero" style="background-image:' + UI.img(dest.img) + '"><span class="bk-ck">' + ic('check', 26) + '</span><h1>You’re going</h1><p>' + E(dest.name) + ' · ' + E(Q.datesInfo().short) + ' · ' + Q.headcount() + ' travelling</p></div>' +
      '<div class="pad16"><div class="card rows">' +
      '<div class="prow static"><i class="pr-i">' + ic('plane', 18) + '</i><span class="pr-t"><b>Flights</b><small>' + Q.headcount() + ' tickets on WhatsApp</small></span><span class="pill ok">Sent</span></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('bed', 18) + '</i><span class="pr-t"><b>Stay voucher</b><small>' + E(Q.stayOf(t.plan).name) + '</small></span><span class="pill ok">Ready</span></div>' +
      '<div class="prow static"><i class="pr-i">' + ic('ticket', 18) + '</i><span class="pr-t"><b>Extras</b><small>' + E(Q.extrasOf(t.plan).map(function (e) { return e.name.split(' ')[0]; }).join(', ')) + '</small></span><span class="pill ok">Booked</span></div></div>' +
      '<div class="note ok">' + ic('refresh', 16) + '<span>' + T.fmt(w.backEach) + ' back to each of you</span></div></div></div>' +
      UI.dock({ cue: 'Open your trip', label: 'Open the trip', act: 'go', p: 'o.wallet' });
  };

  /* ---------- Wallet ---------- */
  function splitBar(w) {
    const parts = [['Flights', w.flights, 'f'], ['Stay', w.stay, 's'], ['Extras', w.extras, 'e'], ['Back to friends', Math.max(0, w.back), 'b']];
    const tot = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1;
    return '<div class="spl"><div class="spl-bar">' + parts.map(function (p) { return '<i class="s-' + p[2] + '" style="flex:' + (p[1] / tot).toFixed(4) + '" title="' + E(p[0]) + '"></i>'; }).join('') + '</div>' +
      '<div class="spl-l">' + parts.map(function (p) { return '<div><i class="d-' + p[2] + '"></i><span><small>' + E(p[0]) + '</small><b>' + T.fmtK(p[1]).replace(/(\.\d)k/, '$1k') + '</b></span></div>'; }).join('') + '</div></div>';
  }
  T.splitBar = splitBar;
  S['o.wallet'] = function (ph) {
    const t = T.store.get().trip;
    if (!t || t.stage !== 'booked') return '<div class="body">' + UI.top({ title: 'Trip Wallet', back: false }) + UI.empty('wallet', 'Nothing in the wallet yet', 'Tickets and receipts show up here once the pool is full and the trip is booked.') + '</div>' + nav('wallet');
    const w = Q.wallet(), act = Q.activeMembers();
    const pre = Q.extrasOf(t.plan);
    return '<div class="body">' + UI.top({ title: T.DEST[t.plan.destId].name + ' Trip Wallet', right: UI.rbtn('share', 'copy', 'cleartrip.com/room/' + t.id, 'Share'), back: false }) +
      '<div class="avrow center">' + act.map(function (m) { return UI.av(m.uid, 34, 'ring'); }).join('') + '</div><p class="sub c">Shared by ' + act.length + ' · everyone has paid</p>' +
      '<div class="tiles3 stat"><div class="tile"><small>POOL</small><b>' + T.fmtK(w.pool) + '</b></div><div class="tile"><small>SPENT</small><b>' + T.fmtK(w.spent) + '</b></div><div class="tile"><small>BACK EACH</small><b>' + T.fmt(w.backEach) + '</b></div></div>' +
      '<div class="card"><div class="sect in"><h3>Where the money went</h3><span class="pill">Simulated</span></div>' + splitBar(w) + '</div>' +
      UI.sect('Documents') +
      '<div class="card rows"><button type="button" class="prow" data-a="sheet" data-p="doc" data-q="' + q({ k: 'flight' }) + '"><i class="pr-i">' + ic('plane', 18) + '</i><span class="pr-t"><b>Boarding pass</b><small>' + E(Q.pickedFlight('ira').carrier) + '</small></span>' + ic('qr', 18) + '</button>' +
      '<button type="button" class="prow" data-a="sheet" data-p="doc" data-q="' + q({ k: 'stay' }) + '"><i class="pr-i">' + ic('doc', 18) + '</i><span class="pr-t"><b>Stay voucher</b><small>' + E(Q.stayOf(t.plan).name) + '</small></span>' + ic('qr', 18) + '</button></div>' +
      UI.sect('Pre-booked', '<button type="button" class="link" data-a="rootgo" data-p="x.trip">View all</button>') +
      pre.filter(function (e) { return e.price >= 0; }).slice(0, 3).map(function (e) {
        const d = Q.dayLabel(e.day);
        return '<div class="pb" style="background-image:' + UI.img(e.img) + '"><span class="pill lime">' + (e.price ? 'Confirmed' : 'Reserved') + '</span><b>' + E(e.name) + '</b><small>' + E(d.dow + ' ' + T.clock(e.start) + ' · ' + e.sub.split(' · ')[0]) + '</small></div>';
      }).join('') + '</div>' + nav('wallet');
  };
  T.sheets.doc = function (ph, p) {
    const t = T.store.get().trip;
    const flight = p.k === 'flight';
    const f = Q.pickedFlight(ph.uid), stay = Q.stayOf(t.plan), d0 = Q.dayLabel(0);
    return '<div class="doc"><div class="doc-h"><span>' + (flight ? 'BOARDING PASS' : 'STAY VOUCHER') + '</span><b>' + E(P[ph.uid].name.toUpperCase()) + '</b></div>' +
      (flight ? '<div class="doc-r"><div><small>FROM</small><b>' + f.from + '</b></div><i>' + ic('plane', 18) + '</i><div class="r"><small>TO</small><b>' + T.DEST[t.plan.destId].code + '</b></div></div><div class="doc-g"><div><small>FLIGHT</small><b>' + E(f.carrier.split(' · ')[1]) + '</b></div><div><small>DEPARTS</small><b>' + E(f.out) + '</b></div><div><small>SEAT</small><b>' + E(f.seats.split('–')[0]) + '</b></div><div><small>GATE</small><b>' + E(f.gate) + '</b></div></div>' :
        '<div class="doc-r"><div><small>PROPERTY</small><b>' + E(stay.name) + '</b></div></div><div class="doc-g"><div><small>CHECK IN</small><b>' + E(d0.dow + ' ' + d0.date + ' ' + d0.mon) + '</b></div><div><small>GUESTS</small><b>' + Q.headcount() + '</b></div><div><small>NIGHTS</small><b>' + (Q.dayCount() - 1) + '</b></div></div>') +
      '<div class="qrbox">' + UI.qr(ph.uid + p.k + t.id) + '</div><p class="fine c">Simulated document. The code is decorative.</p></div>' +
      '<div class="sh-actions">' + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
  };

  /* ---------- Notifications sheet (both roles) ---------- */
  T.sheets.notifs = function (ph) {
    const list = T.store.get().notifs.filter(function (n) { return n.to === ph.uid; }).slice().reverse().slice(0, 12);
    return '<h3>Notifications</h3>' + (list.length ? '<div class="sh-list">' + list.map(function (n) {
      return '<button type="button" class="sh-row btnrow" data-a="openNotif" data-p="' + n.id + '">' + ic(n.icon || 'bell', 18) + '<span>' + E(n.text) + '</span></button>';
    }).join('') + '</div>' : UI.empty('bell', 'All caught up', 'New activity from your Trip Room shows up here.')) + '<div class="sh-actions">' + UI.btn('Close', 'closeSheet', '', { kind: 'sec', block: true }) + '</div>';
  };
  H.openNotif = function (ph, id) {
    const n = T.store.get().notifs.find(function (x) { return String(x.id) === String(id); });
    ph.closeSheet();
    if (n && n.go) ph.openFromNotif(n.go);
  };
})();
