/* Static content for the Trip Room prototype. Prices are simulated. */
(function () {
  const PEOPLE = {
    ira:   { id: 'ira',   name: 'Ira',   av: 1, phone: '+91 ••••• 20481', role: 'Organiser' },
    dev:   { id: 'dev',   name: 'Dev',   av: 6, phone: '+91 ••••• 48210' },
    rhea:  { id: 'rhea',  name: 'Rhea',  av: 5, phone: '+91 ••••• 31877' },
    kabir: { id: 'kabir', name: 'Kabir', av: 3, phone: '+91 ••••• 60294' },
    naina: { id: 'naina', name: 'Naina', av: 2, phone: '+91 ••••• 75512' },
    samar: { id: 'samar', name: 'Samar', av: 4, phone: '+91 ••••• 90346' },
    meera: { id: 'meera', name: 'Meera', av: 6, phone: '+91 ••••• 11807' }
  };
  const CONTACTS = ['dev', 'rhea', 'kabir', 'naina', 'samar', 'meera'];

  const CITIES = { BLR: 'Bengaluru', DEL: 'Delhi', BOM: 'Mumbai' };

  // Trip date options. day names are derived from the start date.
  const DATES = {
    weekend:   { id: 'weekend',   label: 'Weekend 18–21 Dec', short: 'Fri 18–Mon 21 Dec', start: '2026-12-18', days: 4 },
    christmas: { id: 'christmas', label: 'Christmas week',    short: 'Thu 24–Sun 27 Dec', start: '2026-12-24', days: 4 },
    flexible:  { id: 'flexible',  label: 'Flexible',          short: 'Fri 18–Mon 21 Dec', start: '2026-12-18', days: 4 }
  };

  const BUDGETS = {
    low:  { id: 'low',  label: 'Under ₹12k', cap: 12000 },
    mid:  { id: 'mid',  label: '₹12–18k',    cap: 18000 },
    high: { id: 'high', label: '₹18k+',      cap: 30000 }
  };
  const ANSWER_BUDGETS = {
    b12: { id: 'b12', label: 'Up to ₹12k', cap: 12000 },
    b16: { id: 'b16', label: 'Up to ₹16k', cap: 16000 },
    b20: { id: 'b20', label: 'Up to ₹20k', cap: 20000 }
  };

  // Priced the way the Figma plan board is: share = flight + stay/headcount + extras + buffer.
  const BUFFER_RATE = 0.0685;

  const DEST = {
    goa: {
      id: 'goa', name: 'Goa', img: 'goa', code: 'GOI', airport: 'Goa', direct: true,
      vibes: ['Beach', 'City', 'Mix'], line: 'Beaches, villas, easy flights', weather: 'Dry season, 28°C',
      roadNote: '',
      baseFlights: [
        { id: '6E543', carrier: 'INDIGO · 6E 543', out: '07:40', arr: '09:10', fare: 5900, pick: true, terminal: 'T2', gate: '12', seats: '14A–14E', back: '6E 544 · Mon 10:30' },
        { id: 'AI678', carrier: 'AIR INDIA · AI 678', out: '11:30', arr: '13:00', fare: 6700, terminal: 'T1', gate: '4', seats: '9A–9E', back: 'AI 679 · Mon 14:05' },
        { id: 'SG2814', carrier: 'SPICEJET · SG 2814', out: '16:55', arr: '18:25', fare: 5400, late: true, terminal: 'T2', gate: '9', seats: '21A–21E', back: 'SG 2815 · Mon 19:40' }
      ],
      cityDelta: { BLR: 0, DEL: 1200, BOM: -1100 },
      stays: [
        { id: 'palm', name: 'Palm Grove Villa', area: 'Assagao, Goa', rating: '4.8 · 212 reviews', price: 38100, fits: 5, img: 'villa', beach: '1.2 km to beach', amen: [['bed', '3 BR'], ['waves', 'Pool'], ['wifi', 'Wi-Fi'], ['utensils', 'Kitchen']], cancel: 'Free cancel until 10 Dec', pick: true },
        { id: 'court', name: 'Courtyard Homes', area: 'Anjuna, Goa', rating: '4.6 · 148 reviews', price: 33600, fits: 6, img: 'spice', beach: '2.4 km to beach', amen: [['bed', '4 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Kitchen']], cancel: 'Free cancel until 8 Dec' },
        { id: 'beach', name: 'Beach House Candolim', area: 'Candolim, Goa', rating: '4.7 · 97 reviews', price: 44500, fits: 6, img: 'goa', beach: 'On the beach', amen: [['bed', '4 BR'], ['waves', 'Pool'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 6 Dec' }
      ],
      extras: [
        { id: 'cruise', name: 'Sunset cruise', day: 0, start: '17:30', end: '19:00', price: 700, img: 'cruise', sub: 'Mandovi river · 5 seats', icon: 'waves' },
        { id: 'fort', name: 'Fort Aguada sunset walk', day: 1, start: '16:00', end: '17:30', price: 260, img: 'fort', sub: 'Guided · lighthouse access', icon: 'pin' },
        { id: 'dinner', name: 'Dinner at Casa Vermelha', day: 1, start: '19:30', end: '21:15', price: 0, img: 'dinner', sub: 'Table for the group · pay at the venue', icon: 'utensils' },
        { id: 'music', name: 'Live music night', day: 1, start: '21:30', end: '23:30', price: 400, img: 'music', sub: 'Beachside stage · cover charge', icon: 'music' }
      ]
    },
    gokarna: {
      id: 'gokarna', name: 'Gokarna', img: 'gokarna', code: 'HBX', airport: 'Hubballi', direct: false, road: 180,
      vibes: ['Beach'], line: 'Quiet coves, slower pace', weather: 'Dry season, 29°C',
      roadNote: '3-hr road',
      baseFlights: [
        { id: '6E7123', carrier: 'INDIGO · 6E 7123', out: '07:55', arr: '08:50', fare: 4900, pick: true, terminal: 'T1', gate: '6', seats: '12A–12E', back: '6E 7124 · Mon 11:10' },
        { id: 'S5112', carrier: 'STAR AIR · S5 112', out: '13:10', arr: '14:10', fare: 5400, terminal: 'T1', gate: '3', seats: '5A–5E', back: 'S5 113 · Mon 15:00' }
      ],
      cityDelta: { BLR: 0, DEL: 1400, BOM: -300 },
      stays: [
        { id: 'om', name: 'Om Beach Cottages', area: 'Om Beach, Gokarna', rating: '4.5 · 64 reviews', price: 30500, fits: 5, img: 'gokarna', beach: 'On the beach', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Kitchen']], cancel: 'Free cancel until 9 Dec', pick: true },
        { id: 'cliff', name: 'Cliff Top Stay', area: 'Kudle, Gokarna', rating: '4.4 · 51 reviews', price: 27800, fits: 5, img: 'fort', beach: '800 m to beach', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 9 Dec' }
      ],
      extras: [
        { id: 'kayak', name: 'Kayak at Om Beach', day: 1, start: '08:00', end: '10:00', price: 640, img: 'parasailing', sub: 'Two hours with a guide', icon: 'waves' },
        { id: 'bonfire', name: 'Beach bonfire dinner', day: 1, start: '19:30', end: '21:30', price: 300, img: 'music', sub: 'Seafood grill on the sand', icon: 'utensils' },
        { id: 'trek', name: 'Cliff trail to Half Moon', day: 2, start: '07:30', end: '10:30', price: 600, img: 'gokarna', sub: 'Guided sunrise trek', icon: 'pin' }
      ]
    },
    kochi: {
      id: 'kochi', name: 'Kochi + Munnar', img: 'kochi', code: 'COK', airport: 'Kochi', direct: true,
      vibes: ['Hills', 'Mix'], line: 'Backwaters and tea hills', weather: 'Humid, 31°C',
      roadNote: '',
      baseFlights: [
        { id: '6E471', carrier: 'INDIGO · 6E 471', out: '06:45', arr: '08:05', fare: 7900, pick: true, terminal: 'T1', gate: '8', seats: '16A–16E', back: '6E 472 · Mon 09:20' },
        { id: 'AI506', carrier: 'AIR INDIA · AI 506', out: '10:20', arr: '11:40', fare: 8600, terminal: 'T2', gate: '2', seats: '7A–7E', back: 'AI 507 · Mon 13:10' }
      ],
      cityDelta: { BLR: 0, DEL: 1700, BOM: -400 },
      stays: [
        { id: 'tea', name: 'Tea Estate Bungalow', area: 'Munnar, Kerala', rating: '4.9 · 88 reviews', price: 44000, fits: 5, img: 'spice', beach: 'Tea hills view', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Kitchen']], cancel: 'Free cancel until 8 Dec', pick: true },
        { id: 'back', name: 'Backwater Houseboat', area: 'Alleppey, Kerala', rating: '4.7 · 120 reviews', price: 39500, fits: 5, img: 'kochi', beach: 'On the backwaters', amen: [['bed', '3 BR'], ['utensils', 'Chef on board']], cancel: 'Free cancel until 7 Dec' }
      ],
      extras: [
        { id: 'cruiseK', name: 'Backwater cruise', day: 1, start: '15:00', end: '17:30', price: 500, img: 'kochi', sub: 'Sunset on the water', icon: 'waves' },
        { id: 'walk', name: 'Fort Kochi heritage walk', day: 1, start: '09:00', end: '11:00', price: 280, img: 'jaipur', sub: 'Guided, two hours', icon: 'pin' },
        { id: 'kathakali', name: 'Kathakali evening', day: 2, start: '18:30', end: '20:00', price: 400, img: 'music', sub: 'Traditional performance', icon: 'music' }
      ]
    },
    jaipur: {
      id: 'jaipur', name: 'Jaipur', img: 'jaipur', code: 'JAI', airport: 'Jaipur', direct: true, road: 0,
      vibes: ['City', 'Mix'], line: 'Forts, bazaars and havelis', weather: 'Sunny, 22°C',
      roadNote: '',
      baseFlights: [
        { id: '6E6341', carrier: 'INDIGO · 6E 6341', out: '07:10', arr: '09:55', fare: 5600, pick: true, terminal: 'T2', gate: '14', seats: '10A–10E', back: '6E 6342 · Mon 11:00' },
        { id: 'AI9', carrier: 'AIR INDIA · AI 9', out: '12:15', arr: '15:00', fare: 6400, terminal: 'T1', gate: '5', seats: '18A–18E', back: 'AI 10 · Mon 15:20' }
      ],
      cityDelta: { BLR: 0, DEL: -3500, BOM: -1500 },
      stays: [
        { id: 'haveli', name: 'Haveli Courtyard Stay', area: 'Old City, Jaipur', rating: '4.7 · 176 reviews', price: 28000, fits: 5, img: 'jaipur', beach: '5 min to Hawa Mahal', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Breakfast']], cancel: 'Free cancel until 10 Dec', pick: true },
        { id: 'bagh', name: 'Bagh Garden Residence', area: 'C-Scheme, Jaipur', rating: '4.5 · 92 reviews', price: 31500, fits: 6, img: 'villa', beach: 'Garden and pool', amen: [['bed', '4 BR'], ['waves', 'Pool'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 8 Dec' }
      ],
      extras: [
        { id: 'amer', name: 'Amer Fort sunrise tour', day: 1, start: '07:00', end: '10:00', price: 450, img: 'fort', sub: 'Guided · skip-the-line entry', icon: 'pin' },
        { id: 'chokhi', name: 'Dinner at Chokhi Dhani', day: 1, start: '19:30', end: '22:00', price: 900, img: 'dinner', sub: 'Rajasthani thali and folk show', icon: 'utensils' },
        { id: 'bazaar', name: 'Johari Bazaar walk', day: 2, start: '16:00', end: '18:00', price: 0, img: 'market', sub: 'Gems, textiles and chai', icon: 'pin' }
      ]
    },
    manali: {
      id: 'manali', name: 'Manali', img: 'manali', code: 'KUU', airport: 'Bhuntar (Kullu)', direct: false, road: 120,
      vibes: ['Hills'], line: 'Snow, pines and cosy cottages', weather: 'Cold, 4°C',
      roadNote: '2-hr road',
      baseFlights: [
        { id: '6E2234', carrier: 'INDIGO · 6E 2234', out: '06:20', arr: '10:35', fare: 7200, pick: true, terminal: 'T1', gate: '3', seats: '8A–8E', back: '6E 2235 · Mon 12:10' },
        { id: 'S2441', carrier: 'ALLIANCE · 9I 819', out: '09:50', arr: '13:55', fare: 7900, terminal: 'T1', gate: '1', seats: '4A–4E', back: '9I 820 · Mon 15:30' }
      ],
      cityDelta: { BLR: 0, DEL: -4300, BOM: -900 },
      stays: [
        { id: 'cedar', name: 'Cedar Lodge', area: 'Old Manali', rating: '4.8 · 143 reviews', price: 30000, fits: 5, img: 'manali', beach: 'Riverside, pine forest', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Kitchen']], cancel: 'Free cancel until 9 Dec', pick: true },
        { id: 'orchard', name: 'Apple Orchard Cottage', area: 'Naggar, Kullu', rating: '4.6 · 77 reviews', price: 27500, fits: 6, img: 'manali-snow.svg', beach: 'Orchard and valley view', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 8 Dec' }
      ],
      extras: [
        { id: 'solang', name: 'Solang Valley snow day', day: 1, start: '09:00', end: '14:00', price: 1100, img: 'manali-snow.svg', sub: 'Snow slides and cable car', icon: 'compass' },
        { id: 'hadimba', name: 'Hadimba Temple walk', day: 1, start: '16:00', end: '17:30', price: 0, img: 'manali', sub: 'Cedar forest trail', icon: 'pin' },
        { id: 'bonfireM', name: 'Bonfire and barbecue', day: 2, start: '19:30', end: '22:00', price: 500, img: 'music', sub: 'Riverside camp, live guitar', icon: 'utensils' }
      ]
    },
    mussoorie: {
      id: 'mussoorie', name: 'Mussoorie', img: 'mussoorie', code: 'DED', airport: 'Dehradun', direct: false, road: 90,
      vibes: ['Hills'], line: 'Misty ridges and old bakeries', weather: 'Cool, 9°C',
      roadNote: '1.5-hr road',
      baseFlights: [
        { id: '6E7512', carrier: 'INDIGO · 6E 7512', out: '06:50', arr: '10:20', fare: 6900, pick: true, terminal: 'T1', gate: '7', seats: '11A–11E', back: '6E 7513 · Mon 12:40' },
        { id: 'AI1', carrier: 'AIR INDIA · AI 1', out: '12:40', arr: '16:10', fare: 7400, late: true, terminal: 'T2', gate: '2', seats: '15A–15E', back: 'AI 2 · Mon 17:00' }
      ],
      cityDelta: { BLR: 0, DEL: -4200, BOM: -900 },
      stays: [
        { id: 'oak', name: 'Oakwood Heritage Cottage', area: 'Landour, Mussoorie', rating: '4.8 · 119 reviews', price: 33000, fits: 5, img: 'mussoorie', beach: 'Forest ridge view', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Fireplace']], cancel: 'Free cancel until 9 Dec', pick: true },
        { id: 'mall', name: 'Mall Road Boutique Stay', area: 'Mussoorie', rating: '4.4 · 203 reviews', price: 29000, fits: 4, img: 'mussoorie-falls.svg', beach: '3 min to Mall Road', amen: [['bed', '2 BR'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 10 Dec' }
      ],
      extras: [
        { id: 'kempty', name: 'Kempty Falls visit', day: 1, start: '10:30', end: '13:00', price: 400, img: 'mussoorie-falls.svg', sub: 'Waterfall and picnic spot', icon: 'waves' },
        { id: 'landourCafe', name: 'Landour café trail', day: 1, start: '15:30', end: '17:30', price: 350, img: 'cafe', sub: 'Three stops, one bakery', icon: 'utensils' },
        { id: 'camel', name: 'Camel’s Back sunset', day: 2, start: '16:30', end: '18:00', price: 0, img: 'mussoorie', sub: 'Short walk, big views', icon: 'pin' }
      ]
    },
    udaipur: {
      id: 'udaipur', name: 'Udaipur', img: 'udaipur.svg', code: 'UDR', airport: 'Udaipur', direct: true, road: 0,
      vibes: ['City', 'Mix'], line: 'Lakes, palaces and rooftops', weather: 'Sunny, 24°C',
      roadNote: '',
      baseFlights: [
        { id: '6E6283', carrier: 'INDIGO · 6E 6283', out: '08:05', arr: '10:50', fare: 7800, pick: true, terminal: 'T1', gate: '9', seats: '12A–12E', back: '6E 6284 · Mon 11:30' },
        { id: 'AI5', carrier: 'AIR INDIA · AI 5', out: '14:10', arr: '17:00', fare: 8500, late: true, terminal: 'T1', gate: '4', seats: '6A–6E', back: 'AI 6 · Mon 18:10' }
      ],
      cityDelta: { BLR: 0, DEL: -3800, BOM: -2400 },
      stays: [
        { id: 'lakeh', name: 'Lakeview Haveli', area: 'Lake Pichola, Udaipur', rating: '4.9 · 164 reviews', price: 38000, fits: 5, img: 'udaipur.svg', beach: 'On the lake', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Rooftop']], cancel: 'Free cancel until 8 Dec', pick: true },
        { id: 'garden', name: 'Garden Palace Stay', area: 'Fateh Sagar, Udaipur', rating: '4.6 · 81 reviews', price: 33000, fits: 5, img: 'udaipur-boat.svg', beach: 'Garden and pool', amen: [['bed', '3 BR'], ['waves', 'Pool'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 8 Dec' }
      ],
      extras: [
        { id: 'pichola', name: 'Lake Pichola sunset boat', day: 0, start: '17:00', end: '18:30', price: 800, img: 'udaipur-boat.svg', sub: 'Private boat for the group', icon: 'waves' },
        { id: 'citypal', name: 'City Palace tour', day: 1, start: '10:00', end: '12:30', price: 700, img: 'udaipur.svg', sub: 'Guided, museum included', icon: 'pin' },
        { id: 'cookU', name: 'Rajasthani cooking class', day: 2, start: '11:00', end: '13:30', price: 600, img: 'cafe', sub: 'Cook, then eat lunch', icon: 'utensils' }
      ]
    },
    pondicherry: {
      id: 'pondicherry', name: 'Pondicherry', img: 'pondy', code: 'PNY', airport: 'Puducherry', direct: true, road: 0,
      vibes: ['Beach', 'Mix', 'City'], line: 'French streets and a sea promenade', weather: 'Warm, 27°C',
      roadNote: '',
      baseFlights: [
        { id: '6E7241', carrier: 'INDIGO · 6E 7241', out: '07:30', arr: '08:40', fare: 4600, pick: true, terminal: 'T1', gate: '5', seats: '9A–9E', back: '6E 7242 · Mon 10:00' },
        { id: '6E7243', carrier: 'INDIGO · 6E 7243', out: '16:20', arr: '17:30', fare: 4300, late: true, terminal: 'T1', gate: '6', seats: '13A–13E', back: '6E 7244 · Mon 19:00' }
      ],
      cityDelta: { BLR: 0, DEL: 3600, BOM: 2200 },
      stays: [
        { id: 'maison', name: 'Maison Rose Heritage Villa', area: 'White Town, Pondicherry', rating: '4.8 · 130 reviews', price: 32000, fits: 5, img: 'maison-rose', beach: '4 min to the promenade', amen: [['bed', '3 BR'], ['wifi', 'Wi-Fi'], ['utensils', 'Breakfast']], cancel: 'Free cancel until 10 Dec', pick: true },
        { id: 'seaside', name: 'Seaside Guesthouse', area: 'Promenade, Pondicherry', rating: '4.5 · 88 reviews', price: 26000, fits: 6, img: 'pondy', beach: 'Across from the sea', amen: [['bed', '4 BR'], ['wifi', 'Wi-Fi']], cancel: 'Free cancel until 9 Dec' }
      ],
      extras: [
        { id: 'auroville', name: 'Auroville morning', day: 1, start: '08:30', end: '11:00', price: 300, img: 'spa.svg', sub: 'Matrimandir viewpoint and café', icon: 'pin' },
        { id: 'frenchwalk', name: 'French Quarter food walk', day: 1, start: '17:00', end: '19:00', price: 650, img: 'pondy-street.svg', sub: 'Five tastings, one guide', icon: 'utensils' },
        { id: 'paddle', name: 'Sunrise paddle on the promenade', day: 2, start: '06:30', end: '08:30', price: 500, img: 'pondy', sub: 'Stand-up paddle, with a coach', icon: 'waves' }
      ]
    }
  };

  // Things a traveller can add to their own free time, by destination.
  const CANCEL = 'Free cancel up to 24 h before';
  const IDEAS = [];
  (function () {
    // [dest, id, name, cat, price, dur(min), window start, window end, img, sub, icon, away, cancel]
    const rows = [
      ['goa', 'parasail', 'Parasailing', 'Adventure', 1800, 60, '09:00', '17:00', 'parasailing', 'Calangute · 45 min on the water', 'plane', '8 km away', 'Free cancel until Sat 9 AM'],
      ['goa', 'dolphin', 'Dolphin spotting boat', 'Adventure', 900, 120, '08:00', '12:00', 'cruise', 'Sinquerim jetty · small group', 'waves', '6 km away'],
      ['goa', 'spice', 'Spice farm tour', 'Food', 950, 150, '10:00', '16:00', 'spice', 'Ponda · lunch included', 'pin', '24 km away'],
      ['goa', 'beachclub', 'Beach club day', 'Chill', 1500, 240, '14:00', '21:00', 'goa', 'Vagator · cabana and one drink', 'waves', '9 km away'],
      ['goa', 'cafehop', 'Anjuna café hop', 'Food', 600, 150, '11:00', '17:00', 'cafe.svg', 'Three cafés, one scooter', 'utensils', '4 km away'],
      ['goa', 'chapora', 'Chapora Fort sunset ride', 'Adventure', 0, 120, '15:00', '18:30', 'fort', 'Scooter ride · free entry', 'compass', '11 km away', 'No booking needed'],
      ['goa', 'yoga', 'Sunrise yoga on the sand', 'Chill', 500, 90, '08:00', '10:30', 'spa.svg', 'Ashwem · mats provided', 'sparkles', '7 km away'],
      ['gokarna', 'paradise', 'Paradise Beach boat hop', 'Adventure', 750, 150, '09:00', '15:00', 'gokarna', 'Three coves, one boat', 'waves', '3 km away'],
      ['gokarna', 'temple', 'Mahabaleshwar temple visit', 'Culture', 0, 90, '08:00', '18:00', 'market.svg', 'Short walk from town', 'pin', '2 km away', 'No booking needed'],
      ['gokarna', 'shack', 'Seafood shack lunch', 'Food', 700, 90, '12:00', '15:00', 'cafe.svg', 'Fresh catch on Kudle Beach', 'utensils', '1 km away'],
      ['gokarna', 'cliffyoga', 'Cliff-top sunset yoga', 'Chill', 400, 90, '16:30', '18:30', 'spa.svg', 'Half Moon cliff · small group', 'sparkles', '4 km away'],
      ['kochi', 'houseboat', 'Houseboat lunch', 'Food', 1200, 180, '11:00', '16:00', 'kochi', 'Alleppey backwaters', 'utensils', '55 km away'],
      ['kochi', 'teamuseum', 'Tea museum visit', 'Culture', 300, 90, '09:00', '16:00', 'spice', 'Munnar · tasting included', 'pin', '3 km away'],
      ['kochi', 'ayur', 'Ayurvedic massage', 'Chill', 1800, 90, '10:00', '20:00', 'spa.svg', 'Certified therapists', 'sparkles', '2 km away'],
      ['kochi', 'spicemkt', 'Spice market walk', 'Culture', 0, 90, '09:00', '17:00', 'market.svg', 'Mattancherry · free to wander', 'pin', '5 km away', 'No booking needed'],
      ['jaipur', 'blockprint', 'Block-printing workshop', 'Culture', 700, 120, '10:00', '16:00', 'market.svg', 'Sanganer · take home your print', 'pin', '14 km away'],
      ['jaipur', 'kachori', 'Lassi and kachori crawl', 'Food', 400, 90, '09:00', '14:00', 'cafe.svg', 'Five stalls, one guide', 'utensils', '3 km away'],
      ['jaipur', 'jaigarh', 'Jaigarh sunset ride', 'Adventure', 500, 120, '15:00', '18:00', 'fort', 'Jeep ride along the ridge', 'compass', '12 km away'],
      ['jaipur', 'haveliSpa', 'Spa at the haveli', 'Chill', 1500, 90, '11:00', '19:00', 'spa.svg', 'Massage and steam', 'sparkles', 'On site'],
      ['manali', 'paraglide', 'Paragliding at Solang', 'Adventure', 2500, 60, '09:00', '14:00', 'manali-snow.svg', 'Tandem flight, 15 min', 'plane', '14 km away'],
      ['manali', 'jogini', 'Jogini Falls trek', 'Adventure', 300, 180, '08:00', '14:00', 'trek.svg', 'Easy trail, guide included', 'compass', '5 km away'],
      ['manali', 'springs', 'Vashisht hot springs', 'Chill', 100, 90, '08:00', '20:00', 'spa.svg', 'Soak and a village walk', 'waves', '4 km away'],
      ['manali', 'cafeM', 'Old Manali café hours', 'Food', 450, 90, '10:00', '18:00', 'cafe.svg', 'Riverside, trout and coffee', 'utensils', '2 km away'],
      ['mussoorie', 'cablecar', 'Cable car to Gun Hill', 'Culture', 300, 60, '09:00', '17:00', 'mussoorie', 'Ten-minute ride, Himalayan views', 'compass', '1 km away'],
      ['mussoorie', 'bakery', 'Landour bakery crawl', 'Food', 500, 90, '09:00', '17:00', 'cafe.svg', 'Three famous counters', 'utensils', '4 km away'],
      ['mussoorie', 'libatibba', 'Trek to Lal Tibba', 'Adventure', 400, 180, '07:30', '14:00', 'trek.svg', 'Guided ridge walk', 'compass', '5 km away'],
      ['mussoorie', 'sauna', 'Spa and sauna', 'Chill', 1600, 90, '10:00', '20:00', 'spa.svg', 'Warm up after the hills', 'sparkles', '2 km away'],
      ['udaipur', 'carmuseum', 'Vintage car museum', 'Culture', 400, 60, '09:00', '17:00', 'udaipur.svg', 'Royal collection', 'pin', '2 km away'],
      ['udaipur', 'thali', 'Rooftop thali lunch', 'Food', 900, 90, '12:00', '21:00', 'dinner', 'Lake view, unlimited refills', 'utensils', '1 km away'],
      ['udaipur', 'sajjan', 'Sajjangarh sunset ride', 'Adventure', 500, 120, '15:00', '18:00', 'udaipur-boat.svg', 'Monsoon palace viewpoint', 'compass', '6 km away'],
      ['udaipur', 'hammam', 'Hammam spa', 'Chill', 1800, 90, '10:00', '20:00', 'spa.svg', 'Scrub, steam and tea', 'sparkles', '2 km away'],
      ['pondicherry', 'scuba', 'Scuba at Temple Reef', 'Adventure', 3500, 180, '08:00', '13:00', 'cruise', 'Beginner friendly', 'waves', '4 km away'],
      ['pondicherry', 'cycle', 'White Town cycle tour', 'Culture', 400, 120, '08:00', '17:00', 'pondy-street.svg', 'Yellow lanes and old churches', 'compass', '1 km away'],
      ['pondicherry', 'creole', 'Creole lunch', 'Food', 800, 90, '12:00', '15:00', 'cafe.svg', 'Home kitchen, set menu', 'utensils', '2 km away'],
      ['pondicherry', 'beachyoga', 'Beach yoga', 'Chill', 400, 90, '08:00', '10:30', 'spa.svg', 'Serenity Beach', 'sparkles', '8 km away']
    ];
    rows.forEach(function (r) {
      IDEAS.push({ dest: r[0], id: r[1], name: r[2], cat: r[3], price: r[4], dur: r[5], windowStart: r[6], windowEnd: r[7], img: r[8], sub: r[9], icon: r[10], away: r[11], cancel: r[12] || CANCEL });
    });
  })();
  const ideasFor = function (destId) { return IDEAS.filter(function (i) { return i.dest === destId; }); };

  // Quick starters for "Add your own": the traveller names the plan, the time and the cost.
  const CUSTOM_KINDS = [
    { id: 'meal', label: 'Meal out', icon: 'utensils', title: 'Dinner out', dur: 90, start: '20:00' },
    { id: 'cab', label: 'Cab or transfer', icon: 'pin', title: 'Cab to the market', dur: 60, start: '10:00' },
    { id: 'rest', label: 'Rest', icon: 'sparkles', title: 'Rest at the stay', dur: 120, start: '14:00' },
    { id: 'shop', label: 'Shopping', icon: 'ticket', title: 'Shopping trip', dur: 120, start: '16:00' },
    { id: 'remind', label: 'Reminder', icon: 'bell', title: 'Remind me to', dur: 30, start: '09:00' },
    { id: 'other', label: 'Something else', icon: 'plus', title: '', dur: 60, start: '12:00' }
  ];

  const fmt = function (n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };
  const fmtK = function (n) {
    return n >= 10000 ? '₹' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : fmt(n);
  };
  const mins = function (hhmm) {
    const p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  };
  const hhmm = function (m) {
    m = Math.max(0, Math.min(23 * 60 + 59, Math.round(m)));
    const h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  };
  const clock = function (t) {
    const m = mins(t), h = Math.floor(m / 60), mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOWFULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayInfo = function (startIso, idx) {
    const p = startIso.split('-');
    const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + idx));
    return { dow: DOW[d.getUTCDay()], dowFull: DOWFULL[d.getUTCDay()], date: d.getUTCDate(), mon: MON[d.getUTCMonth()] };
  };

  window.TR = window.TR || {};
  Object.assign(window.TR, { PEOPLE, CONTACTS, CITIES, DATES, BUDGETS, ANSWER_BUDGETS, BUFFER_RATE, DEST, IDEAS, ideasFor, CUSTOM_KINDS, fmt, fmtK, mins, hhmm, clock, dayInfo });
})();
