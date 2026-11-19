# Showcase demo guide

How to run and present the MealDeck demo. What each ML feature does and how it was measured is in [`ml/README.md`](ml/README.md); this file is the practical side.

## What's what

| Address | What it is | Data |
|---|---|---|
| **mealdeck.in** | The real site: a student-built menu guide for campus stalls, with live out-of-stock reports | Real |
| **demo.mealdeck.in** | A throwaway copy with **simulated** history, so features that need weeks of data can be shown | Simulated, labelled "Demo data" on every page |
| `localhost:3000` | The same demo, on the laptop only | Simulated |

The demo **never touches the real database**: it uses an in-memory database that is wiped and reseeded on every start.

## Before the day

- [ ] Run `./demo.sh public --no-tunnel` once and click through the flow below.
- [ ] Run `python3 ml/train_eta.py` once yourself, so you can explain the output.
- [ ] Record a 1-2 minute screen recording of the flow (fallback if the network fails).
- [ ] Print the kit in `showcase/out/` (what to print, and on what, is in [`showcase/README.md`](showcase/README.md)). QR codes point at `?src=qr` so the visit counter tells scans apart.
- [ ] Get that morning's MyCamu mess-menu screenshots (one per meal) from a hosteller, for the live import. Fallback: the sample screenshots at `/demo-mess` (marked DEMO, one pair for every weekday).
- [ ] Collect a few misspelled dish names from friends: a fair test set for search that the model was never tuned on.

**Bring:** university ID cards, laptop and charger, an extension board, charged phones and a power bank, a phone with mobile data (hotspot fallback), the printed signs, a USB-C-to-HDMI adapter.

## Starting it

```bash
caffeinate -dimsu &                  # keep the Mac awake
./demo.sh public --no-tunnel         # ~2 min: model server, backend with simulated history, frontend
```

It prints the links when everything answers. Check `https://demo.mealdeck.in` on a phone (mobile data) before judges arrive. `./demo.sh status` shows what's running; `./demo.sh stop` stops it; running it again **resets the demo data** (handy between judges).

Demo logins: student `student@bennett.edu.in` / `student123`, vendor `bistro@mealdeck.in` / `vendor123` (at `/vendor/login`). Admin password login is off in public mode; an admin code goes to `.demo/backend.log` instead of email.

**Bistro / Kathi** is the one stall that previews pre-ordering: its dishes have a **+** and don't open the details sheet. It's open round the clock in the demo; the real stalls keep their hours (8 AM–10 PM), so Deal and "By craving" are empty before 8. Open dishes at Quench, SnapEats, Paid Mess... for votes, "similar, for less" and sold-out times.

## The monitor

The laptop is for live demos with judges; the monitor works while you're busy, catching people walking past and explaining MealDeck without you.

**The loop:** open `showcase/slides/index.html` in Chrome on the monitor and press F. Eight slides, 8 s each, loops on its own (arrows step, P pauses). PNGs of each slide are in `showcase/out/` if you'd rather use Keynote.

**No time to make it?** demo.mealdeck.in in full-screen Chrome on a dish sheet or the Mess page, with the QR poster beside it.

**When a judge stops by:** mirror the laptop onto the monitor (Cmd+F1, or Displays → Mirror) for the live demo, then switch back to the loop.

**Avoid** terminals, code or walls of text on the monitor: nobody reads them from two metres away. Keep the training output for when a judge asks to see the ML.

## Posters and decoration

Print-ready PDFs are in `showcase/out/`, built from the HTML in `showcase/` (`python3 showcase/tools/render.py`). See [`showcase/README.md`](showcase/README.md) for sizes and paper.

## The 5-minute flow

**0:00 The hook.** "Yesterday a dal makhani at a campus counter took 31 minutes. MealDeck is a student-built menu guide for every campus stall, live at mealdeck.in with 8 stalls and 1,086 dishes, plus live out-of-stock reports. Pre-ordering is built and waiting for stalls to opt in. Here's the ML that makes it useful." Mention it's student-built, not an official Bennett service.

**0:30 Search that understands typos.** Hand the judge a phone (or let them scan the QR). Type `panner tika`, then `manchoorian`: the right dishes appear, with "including close matches for ...". *A character-trigram model fitted on the 1,086 real dishes: plain search found the right dish for 26% of misspelled queries; this gets it into the top 10 every time and first 87% of the time.*

**1:15 The model learns from the judge.** Log in as the demo student, open **Deal me a dish**, ask the judge to keep every drink and skip all food for one hand, then deal again: the deck shifts towards drinks. *Online logistic regression: a shared model from every student's swipes plus a personal one that learns how you differ, updated after every hand. On by default; one switch in Account turns it off and deletes your swipes.*

**2:15 A neural network reads a screenshot, on the phone.** Mess tab, **Fill from MyCamu screenshots**, pick the morning's screenshots (or the DEMO ones from `/demo-mess`, linked under the button): all four meals appear, sorted and cleaned. The button only shows while a meal is empty, so reset the demo once someone has filled today's menu. *Tesseract OCR running in the browser: the screenshot never leaves the phone; our parser turns the text into meals. Hostellers see the mess menu in MyCamu; day scholars can't.* Point at **"Probably: ..."** on any meal still empty: a guess from the same weekday in past weeks, always labelled as one.

**3:00 Small things that save time and money** (pick one or two). Open a dish at a menu-only stall: **Similar, for less** at other stalls, **Often sold out by 2 PM**, **Amazing / Not worth it** votes. Vendor view: add a dish called "Paneer Tikka Roll" and the stall's own sections are suggested. *k-nearest neighbours on the stall's own menu: right first time 69% vs 14% for always picking the biggest section.*

**3:45 The classic pipeline.** In a terminal: `python3 ml/train_eta.py` (5 seconds). A random forest predicts preparation time: **2.1 min error vs 6.1 for always guessing the average**, and it leans most on the orders ahead in the queue. *Honestly: trained on simulated orders, because no stall takes pre-orders yet. The day one does, real ready-times replace the simulator and the same pipeline retrains.*

**4:30 Close.** "Every model here is small, measured and useful on day one, except the ETA, which is waiting for real data. Scan the code to try it."

## Likely questions

- **Is this real data?** The menus, search and section suggestions use real data; Deal learns from real swipes. The demo site's history is simulated and says so on every page.
- **Is this official?** No, it's student-built. We're proving demand first.
- **Why not just use an LLM?** These run on a phone, cost nothing per use, keep data on the device, and each one is measured against a baseline.
- **What's next?** One stall taking pre-orders; then the ETA model trains on real kitchens, and the stall can batch orders for the same time (three dal makhanis for 1 PM become one batch).

## If something breaks

| Symptom | Fix |
|---|---|
| demo.mealdeck.in doesn't load | Is `./demo.sh` running (`./demo.sh status`)? Is the Mac online and on Tailscale? Fallback: `http://localhost:3000` on the laptop. |
| A new hostname won't resolve on the Mac | `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` |
| Phone can't reach the laptop's local address | Venue Wi-Fi isolates devices: use demo.mealdeck.in, or put both on a phone hotspot and rerun `./demo.sh` |
| The demo's data got messy | `./demo.sh public --no-tunnel` again: fresh simulated data |
| Nothing works | Play the screen recording |

## How demo.mealdeck.in is wired

```
judge's phone ──► Cloudflare ──► cloudflared on the tunnel host ──► (Tailscale) ──► the laptop
                                   /api/... (incl. the WebSocket) ──►  :8080 backend
                                   everything else               ──►  :3000 frontend
```

On the machine running cloudflared, two ingress rules above the catch-all in `/etc/cloudflared/config.yml`:

```yaml
  - hostname: demo.mealdeck.in
    path: ^/api/
    service: http://<laptop's Tailscale IP>:8080
  - hostname: demo.mealdeck.in
    service: http://<laptop's Tailscale IP>:3000
```

DNS: a proxied CNAME `demo` in the mealdeck.in zone pointing to `<tunnel id>.cfargotunnel.com`. Add it in the dashboard: `cloudflared tunnel route dns` puts the record in whichever zone that machine's Cloudflare certificate belongs to, which may not be mealdeck.in.

Without that tunnel host, `./demo.sh public` runs a separate `mealdeck-demo` tunnel on the laptop itself (needs `brew install cloudflared` and `cloudflared tunnel login` once).

## Afterwards: a permanent demo on a server

The laptop setup is for the showcase. On a server, the `demo` profile in `docker-compose.yml` runs the same demo beside the real site (see the README's "demo.mealdeck.in" section): `COMPOSE_PROFILES=demo` in the env file, one tunnel rule to `127.0.0.1:8083`, and every `git pull && docker compose up -d --build` updates both.
