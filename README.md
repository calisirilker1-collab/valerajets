# Valera Jets — Website MVP

Premium, Turkish, responsive single-page website for Valera Jets, positioned as an independent private jet brokerage / charter intermediary.

## Files
- `index.html` — page structure + SEO copy
- `styles.css` — full responsive design
- `script.js` — mobile menu, animations and 3-step quote form

## Publish on GitHub Pages
1. Create a new GitHub repository (for example `valerajets`).
2. Upload `index.html`, `styles.css`, `script.js` to the repository root.
3. Go to **Settings → Pages → Deploy from a branch → main / root**.
4. In your domain DNS, point `valerajets.com` to GitHub Pages according to GitHub's current custom-domain instructions.
5. In GitHub Pages settings, add `valerajets.com` as the custom domain and enable HTTPS.

## IMPORTANT — Lead form
The quote form UI works, but it intentionally does not send data anywhere yet. In `script.js`, replace the demo submit block with one of:
- your own `/api/quote` endpoint,
- Formspree,
- HubSpot form/API,
- Pipedrive webhook,
- Make/Zapier webhook,
- a serverless function (Vercel / Netlify / Cloudflare Workers).

Recommended lead fields already included:
- one-way / round-trip
- origin
- destination
- departure / return date
- passenger count
- jet preference
- special requests
- name
- phone
- email
- consent checkbox

## Before public launch
- Replace / confirm the contact email (`hello@valerajets.com`).
- Add Privacy Policy, KVKK notice, Cookie Policy and Terms pages.
- Have legal counsel review the wording used for brokerage/intermediary services, especially operator responsibility, payments, cancellations and flight safety representations.
- Connect analytics (GA4 / Meta Pixel) and your CRM.
- Replace demo/example empty-leg routes with real, timestamped inventory only if you plan to publish live availability.

## Positioning used in this version
Valera Jets does **not** present itself as an aircraft operator or aircraft owner. It is presented as a broker that compares operator / aircraft options and coordinates the charter process for the client.
