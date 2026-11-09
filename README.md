# AUTOPRIME Website

A static multi-page vehicle marketplace site. No build step needed — unzip and open `index.html`, or upload the whole folder to any web host.

## Pages
- `index.html` — home page (hero, saved searches, categories, recently added/viewed, support chat)
- `browse.html` — all vehicles with filters and Save Search
- `sedan.html`, `suv.html`, `pickup.html` — category pages
- `compare.html` — side-by-side comparison (up to 3 vehicles)
- `favorites.html` — saved vehicles
- `sell.html` — list your vehicle
- `transactions.html` — purchases and sales
- `account.html` — customer & seller dashboards, ID verification
- `help.html` — help center, FAQ, support tickets

## Files
- `app.js` — original site script (listings, modals, ID verification wizard)
- `enhance.js` / `enhance.css` — added features (favorites, compare, saved searches, messaging, support chat, dashboards)
- `style.css` — site styles
- `image/` — vehicle photos

## Things to know before going live
- All data is demo data stored in the browser (localStorage) — nothing is saved to a real server.
- Simulated features are labelled as such (support chat, dealer auto-replies, face-scan verification).
- Sample content (reviews, inspection details, help articles, payment wording) was written as placeholder — replace it with your real content.
- ID verification: the simulated face scan marks users "Verified" after ~20 seconds; manual submissions stay "Pending" until approved in the demo.
