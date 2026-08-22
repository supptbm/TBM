# TBM Maintenance — bilingual marketing site

Static, single-page bilingual (Arabic RTL / English LTR) marketing site for an
engineering maintenance company in Cairo. No build step, no backend, no
dependencies — plain HTML, CSS and vanilla JS.

```
html      all markup + inline SVG logo and icons
styles.css      design system (tokens at the top) + all layout
config.js       brand name + contact details  <-- edit this first
i18n.js         every string, in Arabic and English
app.js          language engine, FAQ accordion, mobile nav, form, scroll reveal
favicon.svg
assets/img/     generated hero and section photography
```

Open `index.html` in a browser, or serve the folder (`python3 -m http.server`).
Default language is Arabic. `#en` / `#ar` in the URL deep-links a language.

---

## 1. Rename the company (one place)

The brand name lives **only** in `config.js`:

```js
window.SITE_CONFIG = {
  brand: {
    en: { short: 'TBM',   full: 'TBM Maintenance' },
    ar: { short: 'TBM',     full: 'TBM للصيانة' }
  },
  ...
};
```

`short` is used in the header, footer and copyright; `full` is used in the page
title, hero and WhatsApp message. Every place in the HTML is marked with
`data-brand-name="short|full"` and filled in by `app.js`, so changing these four
strings renames the whole site.

Two other spots mention the name as plain text you may want to align:
`i18n.js` → `meta.title` (browser tab / SEO title) and `footer.about`.

## 2. Placeholder details to replace

| What | Current placeholder | Where |
| --- | --- | --- |
| Phone (displayed) — LIVE | `+20 112 553 5943` | `config.js` → `contact.phoneDisplay` |
| Phone (dial / `tel:`) | `+201125535943` | `config.js` → `contact.phoneDial` |
| WhatsApp number (wa.me, digits only, no `+`) | `201125535943` | `config.js` → `contact.whatsappNumber` |
| Email | `supp.tbm@gmail.com` | `config.js` → `contact.email` |
| Street / city line | `Nasr City, Cairo, Egypt` | `i18n.js` → `footer.addr` (ar + en) |
| Working hours | Sun–Thu 9–18, Sat 10–16, Fri closed | `i18n.js` → `footer.hours*`, `quote.hoursVal` |
| Service areas (6 Greater Cairo lines) | New Cairo, Nasr City, Downtown, Maadi, Giza, 6th of October | `i18n.js` → `footer.area1…area6` |
| Commercial registry / tax ID line | "Commercial registry & tax ID to be added" | `i18n.js` → `footer.legal` |
| Years in business / founding claim | "15+ years", used in the hero kicker and About copy | `i18n.js` → `hero.kicker`, `why.lead` |
| Response-time SLA and stats | "Within 4 hours", "All Greater Cairo" | `i18n.js` → `hero.stat*Val` |
| Testimonials | 3 clearly-marked **placeholder** quotes and client names | `i18n.js` → `tst.*` (a visible note says they are samples — replace or delete the section) |

There are **no prices anywhere**; all three contract tiers end in a
"request a quote" CTA. Keep it that way or add real numbers deliberately.

The quote form has no backend. On a valid submit it shows a success panel and
offers "Send via WhatsApp", which opens `wa.me/<whatsappNumber>` with the form
contents URL-encoded. If you later add a real endpoint, post from
`handleSubmit()` in `app.js` before showing the success state.

## 3. Editing or adding translations

All copy is in `i18n.js`:

```js
window.SITE_I18N = { ar: { 'hero.title': '…' }, en: { 'hero.title': '…' } };
window.SITE_FAQ  = { ar: [{ q: '…', a: '…' }], en: [ … ] };   // 6 items each
```

- To change wording, edit the value for that key in **both** `ar` and `en`.
- To add a new piece of text: add the key to both dictionaries, then in
  `index.html` put `data-i18n="your.key"` on the element. Its text content is
  replaced on every language switch.
- For accessible labels use `data-i18n-aria-label="your.key"` (sets `aria-label`).
  The two input placeholders (`01xxxxxxxxx`, `name@company.com`) are
  language-neutral and live directly in `index.html`.
- FAQ items are rendered from `SITE_FAQ`; add or remove objects and the
  accordion rebuilds itself — no HTML change needed.
- Arabic strings should avoid Latin digits inside a sentence when it would flip
  order visually; the site uses phrases like "على مدار الساعة" instead of "24/7"
  in Arabic for that reason. Wrap any Latin/number-only run in
  `<span dir="ltr">` if you need one inline.

Adding a third language would mean: a new key block in `SITE_I18N`, a new
button in the `.lang` group in `index.html`, and adding the code to the
`applyLang()` direction map in `app.js`.

## 4. Changing the accent colour

`styles.css`, top of the file:

```css
--accent:       #4d9dff;   /* engineering blue — buttons, section numbers, rules */
--accent-hover: #6fb2ff;
--accent-ink:   #17130a;   /* text drawn on top of the accent */
```

Change those three and the whole site follows (CTAs, focus rings, icon tiles,
active language button, hover states). For an electric-blue variant, e.g.
`#2f8fff` / `#5aa8ff` / `#06121f`. Keep `--accent-ink` dark on a light accent
and light on a dark accent so button labels stay readable. The green of the
WhatsApp button is intentionally the WhatsApp brand colour (`#25d366`, set on
`.floater--wa` in `styles.css`) and is not tied to the accent.

Surfaces are `--bg`, `--surface`, `--surface-2`, `--surface-3`; text is
`--text`, `--text-dim`, `--text-muted`, `--text-faint`.

## 5. Imagery

`assets/img/` holds generated photography matching the art direction
(hero, electrical, hvac, fire, industrial, cairo). Replace files with the same
names to swap them; keep the aspect ratios (hero and cairo 16:9, service images
4:3) and keep files under ~300 KB.

## 6. Accessibility / QA notes

Keyboard-navigable nav, accordion and form; visible focus rings; `aria-expanded`
on the accordion and mobile nav; `aria-pressed` on the language buttons; live
validation messages tied to inputs. Verified at 1280px and 375px in both
Arabic (RTL) and English (LTR). On screens ≤640px the floating call and
WhatsApp buttons become a solid bottom action bar with matching body padding so
they never cover content.
