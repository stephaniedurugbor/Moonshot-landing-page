# Stephanie Durugbor — personal landing page

A lightweight, static personal website built with HTML, CSS, and vanilla JavaScript, bundled with Vite. The Cal Sans variable font is bundled locally, so visitors do not need a network connection to a font provider. PostHog analytics are initialized only when a project token is provided at build time. Vercel can build the site with `npm run build` and serve the generated `dist/` directory.

## Preview locally

Install dependencies, configure the analytics environment, and start Vite:

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_POSTHOG_PROJECT_TOKEN` in `.env.local` to the **Project API Key** from the PostHog project named **Moonshot Networking Site**. Set `VITE_POSTHOG_HOST` to `https://us.i.posthog.com` (already supplied in `.env.example`). The page runs without analytics when the token is blank. Vite embeds `VITE_` variables in the browser bundle, so use only the PostHog project ingest key here, never a PostHog personal or secret API key. `.env.local` is ignored by Git.

The SDK captures the initial pageview and general autocapture events. The LinkedIn, email, and Tidy up controls are excluded from autocapture and emit only their named custom events. Custom events have no properties, so they do not attach an email address or other personal data. Session recording is explicitly disabled.

### Vercel environment variables

In the Vercel project dashboard, open **Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `VITE_POSTHOG_PROJECT_TOKEN` | The PostHog Project API Key for **Moonshot Networking Site** |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` |

Select the environments where analytics should run (Production and Preview as needed), save, then redeploy. Vite reads these values during the build, so a new deployment is required after changing them.

### Confirming events

Open the **Moonshot Networking Site** project in PostHog and view **Activity / Live events**. Visit the deployed site (or local Vite site with `.env.local` configured) and confirm `$pageview` appears. Then click each contact link and **Tidy up** and confirm `linkedin_click`, `email_click`, and `tidy_up_click`. No real event can arrive until the project token is configured and the site is visited.

## Font and license

The site bundles Cal Sans v2 from the official [`cal-sans` npm package](https://github.com/calcom/sans). The WOFF2 file is served locally from `assets/fonts/CalSansVF.woff2`; the full SIL Open Font License 1.1 is included at `assets/fonts/OFL.txt`. Cal Sans is commissioned by Peer Richelsen for Cal.com and drawn and engineered by WORDMARK. The project’s use of the font is covered by the included license.

The variable font uses automatic optical sizing for regular text and the Cal Sans documented UI settings (`GEOM` 25, `opsz` 10) for tiny annotations. Large display text uses weight 700 with `GEOM` 50 and `opsz` 45 to retain the bold display style.

## Before publishing

- Replace the clearly labelled portrait, personal-photo, and GVAC member-record placeholders with approved assets. Put image files in `assets/` and update the corresponding markup.
- The three overlapping hero image placeholders are `assets/images/hero-portrait.svg`, `assets/images/hero-support-left.svg`, and `assets/images/hero-support-right.svg`. Replace each SVG or update its matching `<img src>` in `index.html`; adjust `object-position` in `.hero-frame img` if a supplied photo needs a different crop.
- Replace the LinkedIn and email placeholders with the actual URLs/address.
- Replace the personal moment sentence with copy supplied by Stephanie.

The live GVAC application URL is intentionally not included. The product preview placeholder is reserved for a mockup or recording of Stephanie's own member record.
