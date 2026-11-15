# Trip Room · AI travel agent for Cleartrip

An interactive prototype of the Razorpay Design × NID brief. One group trip, two phones: the **organiser** (Ira) plans, the **traveller** (a friend) answers, approves and pays. Both phones read from the same live trip, so what one person does shows up on the other.

Plain HTML, CSS and JavaScript. No build step, no dependencies. Payments, flights and prices are simulated.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Host it on GitHub Pages

1. Create a repository and push everything in this folder to the `main` branch (the files must sit at the repository root, next to `index.html`).
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then Save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

All asset paths are relative, so it works under that sub-path. `.nojekyll` is included so GitHub serves the files as they are.

## How to use it

- **Organiser phone:** Start a Trip Room → pick friends → share on WhatsApp → read the answers → choose a destination (Beach, Hills, City or Mix, 8 places in all: Goa, Gokarna, Kochi + Munnar, Jaipur, Manali, Mussoorie, Udaipur, Pondicherry) → review flights, stay and extras → send the plan → open the pool → pay → booked → wallet and itinerary.
- **Traveller phone:** switch friend with the chips under the phone. Open WhatsApp → join → answer → approve (or soft yes, or can't make it) → pay → receipt → itinerary. On the itinerary the group bookings stay locked, but everything around them is yours: skip a group extra, tap **Free time** for ideas, **Add your own** plan (meal, cab, rest, anything), edit time, day, who joins and who can see it, check clashes, settle up, and open the Today view.
- **Demo controls (right side):** make the other friends act (Reply, Approve, Pay), jump to any moment, reset. **Focus** (or press `F`) hides everything except the phones so they fill the window; the panel can be toggled with **Demo controls**.
- **Two tabs:** open the page twice (`?view=organiser` in one, `?view=traveller` in the other). They stay in sync through `localStorage` on the same browser.

### URL options

| Parameter | Values |
|---|---|
| `view` | `both` (default), `organiser`, `traveller` |
| `as` | traveller to show: `dev`, `rhea`, `kabir`, `naina`, `samar`, `meera` |
| `focus` | `1` to open in focus mode |
| `preset` | `start`, `room`, `invited`, `answers`, `plan`, `confirm`, `pool`, `booked` |

Example: `index.html?preset=pool&view=traveller&as=kabir`

## Rules baked into the prototype

- Each friend's share = their own flight fare + stay ÷ headcount + group extras + a small buffer. Goa works out to ₹15,900 each. Every destination has its own flights, stay, group extras and free-time ideas.
- If someone drops out before the pool opens, the others are repriced.
- The pool opens only when everyone has replied. A soft yes is allowed.
- Travellers see how many have paid, not who. The organiser sees names.
- Personal extras can be private or visible to friends, and split extras go to Settle up.

## Files

```
index.html
css/app.css          tokens and all components
js/icons.js          icon set
js/data.js           people, destinations, flights, stays, ideas
js/store.js          state, pricing rules, actions, friend simulator
js/ui.js             phone shell, navigation, components
js/screens-org.js    organiser screens
js/screens-trav.js   traveller screens
js/screens-shared.js itinerary, ideas, clash check, Today, settle up
js/app.js            page shell, demo controls, sync
assets/              destination photos (Goa, Jaipur, Kochi) and illustrated covers (SVG) for the other places
```
