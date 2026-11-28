// Builds the static site for healthypaw.app into dist/.
// No dependencies: plain Node (>= 20). Run with `pnpm --filter @petos/web build`.
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { site } from './site.config.mjs';
import en from './content/en.mjs';
import pl from './content/pl.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const langs = [en, pl];
const warnings = new Set();

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'static'), out, { recursive: true });

// Cache-busting hash for the stylesheet.
const cssHash = createHash('sha256').update(readFileSync(join(root, 'static/site.css'))).digest('hex').slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const other = (t) => (t.lang === 'en' ? pl : en);
const fill = (html, t) => html.replace(/\{(\w+)\}/g, (m, k) => t.paths[k] ?? m);
const todo = (t, what) => {
  warnings.add(what);
  return `<mark class="todo">[${esc(what)}: ${esc(t.ui.todo)}]</mark>`;
};

const icons = {
  paw: '<path d="M12 13.5c-2.6 0-5 2.3-5 4.4 0 1.4 1.1 2.1 2.4 2.1 1.1 0 1.6-.6 2.6-.6s1.5.6 2.6.6c1.3 0 2.4-.7 2.4-2.1 0-2.1-2.4-4.4-5-4.4Z"/><circle cx="6" cy="10" r="1.9"/><circle cx="9.5" cy="6" r="1.9"/><circle cx="14.5" cy="6" r="1.9"/><circle cx="18" cy="10" r="1.9"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  wifi: '<path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  globe: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5S14.4 18.1 12 20.5C9.6 18.1 8.5 15.3 8.5 12S9.6 5.9 12 3.5Z" fill="none" stroke="currentColor" stroke-width="2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  apple: '<path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-1.1 2.8-2.3.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.6ZM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2-.5 2.7-1.3Z"/>',
  play: '<path d="M5 3.6v16.8c0 .5.5.8.9.6l14.3-8.4c.4-.2.4-.8 0-1L5.9 3c-.4-.2-.9.1-.9.6Z"/>',
};
const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${icons[name]}</svg>`;

function storeButtons(t, variant = '') {
  const btn = (url, ic, pre, name) =>
    url
      ? `<a class="store ${variant}" href="${esc(url)}" rel="noopener">${icon(ic)}<span><small>${esc(pre)}</small>${esc(name)}</span></a>`
      : `<span class="store is-soon ${variant}" aria-label="${esc(name)}: ${esc(t.ui.comingSoon)}">${icon(ic)}<span><small>${esc(t.ui.comingSoon)}</small>${esc(name)}</span></span>`;
  return `<div class="stores">${btn(site.appStoreUrl, 'apple', t.ui.downloadOn, t.ui.appStore)}${btn(site.playStoreUrl, 'play', t.ui.getItOn, t.ui.googlePlay)}</div>`;
}

const logo = (t) =>
  `<a class="logo" href="${t.paths.home}" aria-label="HealthyPaw"><img src="/img/icon-rounded.svg" alt="" width="36" height="36"><picture><source srcset="/img/wordmark-white.svg" media="(prefers-color-scheme: dark)"><img class="wordmark" src="/img/wordmark.svg" alt="HealthyPaw" width="143" height="26"></picture></a>`;

function header(t, page) {
  const o = other(t);
  const n = t.ui.nav;
  const h = page === 'home' ? '' : t.paths.home;
  return `<a class="skip" href="#main">${esc(t.ui.skip)}</a>
<header class="site-header"><div class="wrap bar">
  ${logo(t)}
  <nav class="nav" aria-label="${esc(t.ui.menu)}">
    <a href="${h}#features">${esc(n.features)}</a>
    <a href="${h}#how">${esc(n.how)}</a>
    <a href="${h}#faq">${esc(n.faq)}</a>
    <a href="${t.paths.contact}">${esc(n.contact)}</a>
  </nav>
  <div class="bar-end">
    <a class="lang" href="${o.paths[page]}" hreflang="${o.lang}" lang="${o.lang}" title="${esc(t.ui.switchLabel)}">${esc(o.lang.toUpperCase())}</a>
    <a class="btn btn-sm" href="${h}#download">${esc(t.ui.getApp)}</a>
    <details class="menu">
      <summary aria-label="${esc(t.ui.menu)}"><span class="burger" aria-hidden="true"></span></summary>
      <nav class="menu-panel" aria-label="${esc(t.ui.menu)}">
        <a href="${h}#features">${esc(n.features)}</a>
        <a href="${h}#how">${esc(n.how)}</a>
        <a href="${h}#faq">${esc(n.faq)}</a>
        <a href="${t.paths.contact}">${esc(n.contact)}</a>
        <a class="btn" href="${h}#download">${esc(t.ui.getApp)}</a>
      </nav>
    </details>
  </div>
</div></header>`;
}

function footer(t, page) {
  const o = other(t);
  const year = new Date().getFullYear();
  return `<footer class="site-footer"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand">${logo(t)}<p>${esc(t.ui.footerTagline)}</p><p class="muted">${esc(t.ui.madeIn)}</p></div>
    <nav aria-label="${esc(t.ui.footerProduct)}"><h2>${esc(t.ui.footerProduct)}</h2>
      <a href="${t.paths.home}#features">${esc(t.ui.nav.features)}</a><a href="${t.paths.home}#how">${esc(t.ui.nav.how)}</a><a href="${t.paths.home}#faq">${esc(t.ui.nav.faq)}</a></nav>
    <nav aria-label="${esc(t.ui.footerLegal)}"><h2>${esc(t.ui.footerLegal)}</h2>
      <a href="${t.paths.privacy}">${esc(t.ui.privacy)}</a><a href="${t.paths.terms}">${esc(t.ui.terms)}</a><a href="${t.paths.deleteAccount}">${esc(t.ui.deleteAccount)}</a></nav>
    <nav aria-label="${esc(t.ui.footerHelp)}"><h2>${esc(t.ui.footerHelp)}</h2>
      <a href="${t.paths.contact}">${esc(t.ui.contact)}</a><a href="mailto:${site.supportEmail}">${site.supportEmail}</a>
      <a href="${o.paths[page]}" hreflang="${o.lang}" lang="${o.lang}">${esc(t.ui.switchTo)}</a></nav>
  </div>
  <p class="copy">© ${year} HealthyPaw</p>
</div></footer>`;
}

function layout(t, page, { title, description, body, noindex = false }) {
  const o = other(t);
  const url = site.origin + t.paths[page];
  const fullTitle = page === 'home' ? title : `${title} · HealthyPaw`;
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${t.lang}" href="${url}">
<link rel="alternate" hreflang="${o.lang}" href="${site.origin + o.paths[page]}">
<link rel="alternate" hreflang="x-default" href="${site.origin}/">`}
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#14122A" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HealthyPaw">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:image" content="${site.origin}/img/og-${t.lang}.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/favicon.ico" sizes="any">
<link rel="icon" href="/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/img/apple-touch-icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/fredoka-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css?v=${cssHash}">
</head>
<body class="page-${page}">
${header(t, page)}
<main id="main">
${body}
</main>
${footer(t, page)}
</body>
</html>
`;
}

const shot = (name, t, alt, { eager = false } = {}) =>
  `<div class="phone"><img src="/img/${name}-${t.lang}.webp" alt="${esc(alt)}" width="550" height="1000" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>`;

function home(t) {
  const h = t.home;
  const body = `
<section class="hero"><div class="wrap hero-grid">
  <div class="hero-copy">
    <p class="eyebrow">${icon('paw', 'icon eyebrow-icon')}${esc(h.eyebrow)}</p>
    <h1>${esc(h.h1)}</h1>
    <p class="lead">${esc(h.lead)}</p>
    ${storeButtons(t)}
    <p class="hero-note">${esc(h.heroNote)}</p>
  </div>
  <div class="hero-art">
    <div class="blob" aria-hidden="true"></div>
    ${shot('01-today', t, h.heroAlt, { eager: true })}
    <div class="float-chip chip-done" aria-hidden="true">${icon('check')}<span>${t.lang === 'pl' ? 'Spacer · Anna' : 'Walk · Anna'}</span></div>
    <div class="float-chip chip-streak" aria-hidden="true"><span class="flame">🔥</span><span>${t.lang === 'pl' ? '12 dni' : '12 days'}</span></div>
  </div>
</div></section>

<section class="problem"><div class="wrap">
  <h2 class="section-title">${esc(h.problemTitle)}</h2>
  <div class="bubbles">${h.bubbles.map((b, i) => `<p class="bubble b${i}">${esc(b)}</p>`).join('')}</div>
  <p class="answer">${esc(h.problemAnswer)}</p>
</div></section>

<section id="features" class="features"><div class="wrap">
  <h2 class="section-title">${esc(h.featuresTitle)}</h2>
  ${h.features
    .map(
      (f, i) => `<article class="feature ${i % 2 ? 'flip' : ''}">
    <div class="feature-copy">
      <p class="kicker">${esc(f.kicker)}</p>
      <h3>${esc(f.title)}</h3>
      <p>${esc(f.body)}</p>
      <ul class="ticks">${f.points.map((p) => `<li>${icon('check')}<span>${esc(p)}</span></li>`).join('')}</ul>
    </div>
    <div class="feature-art">${shot(f.img, t, f.alt)}</div>
  </article>`,
    )
    .join('\n')}
</div></section>

<section class="extras"><div class="wrap">
  <h2 class="section-title">${esc(h.extrasTitle)}</h2>
  <div class="extra-grid">${h.extras
    .map((x) => `<div class="extra">${icon(x.icon, 'icon extra-icon')}<h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div>`)
    .join('')}</div>
</div></section>

<section id="how" class="how"><div class="wrap">
  <h2 class="section-title">${esc(h.howTitle)}</h2>
  <ol class="steps">${h.steps.map((s, i) => `<li><span class="num">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`).join('')}</ol>
</div></section>

<section id="download" class="download"><div class="wrap download-grid">
  <div>
    <h2>${esc(h.downloadTitle)}</h2>
    <p>${esc(h.downloadBody)}</p>
    ${storeButtons(t, 'on-dark')}
    <p><a class="btn btn-light" href="mailto:${site.supportEmail}?subject=${encodeURIComponent(h.betaSubject)}">${icon('mail')}${esc(h.betaCta)}</a></p>
  </div>
  <div class="download-art">${shot('06-cats', t, h.catAlt)}</div>
</div></section>

<section id="faq" class="faq"><div class="wrap narrow">
  <h2 class="section-title">${esc(h.faqTitle)}</h2>
  ${h.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${fill(f.a, t)}</p></details>`).join('\n')}
</div></section>`;
  return layout(t, 'home', { title: h.title, description: h.description, body });
}

function legalCtx(t) {
  return {
    operator: site.operatorName ? esc(site.operatorName) : todo(t, t.lang === 'pl' ? 'nazwa podmiotu' : 'legal entity name'),
    address: site.operatorAddress ? esc(site.operatorAddress) : todo(t, t.lang === 'pl' ? 'adres' : 'address'),
    privacyEmail: site.privacyEmail,
    supportEmail: site.supportEmail,
    privacyPath: t.paths.privacy,
    termsPath: t.paths.terms,
    deleteAccountPath: t.paths.deleteAccount,
  };
}

function docPage(t, page, doc, { updated = false } = {}) {
  const body = `<article class="doc"><div class="wrap narrow">
  <h1>${esc(doc.title)}</h1>
  ${updated ? `<p class="updated">${esc(t.ui.updated)}: ${esc(site.legalUpdated[t.lang])}</p>` : ''}
  ${doc.body(legalCtx(t))}
</div></article>`;
  return layout(t, page, { title: doc.title, description: doc.description, body });
}

function contact(t) {
  const c = t.contact;
  const email = { support: site.supportEmail, privacy: site.privacyEmail };
  const body = `<article class="doc"><div class="wrap narrow">
  <h1>${esc(c.title)}</h1>
  <p class="lead">${esc(c.lead)}</p>
  <div class="contact-grid">${c.cards
    .map((k) => `<a class="contact-card" href="mailto:${email[k.key]}">${icon('mail', 'icon extra-icon')}<h2>${esc(k.title)}</h2><p>${esc(k.body)}</p><span class="email">${email[k.key]}</span></a>`)
    .join('')}</div>
  <p>${fill(c.deleteHint, t)}</p>
  <h2>${esc(c.postal)}</h2>
  <p>${legalCtx(t).operator}<br>${legalCtx(t).address}</p>
</div></article>`;
  return layout(t, 'contact', { title: c.title, description: c.description, body });
}

function invitePage() {
  const steps = (t, a) => `<section lang="${t.lang}"><h2>${esc(a.title)}</h2><ol>${a.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>`;
  const txt = {
    en: { title: 'You’ve been invited to HealthyPaw', steps: ['Install HealthyPaw on your phone (the app is in a private beta, so ask the person who invited you for the test link if you don’t have it yet).', 'Open this invite link again on your phone.', 'Sign in and join the household.'] },
    pl: { title: 'Zaproszono Cię do HealthyPaw', steps: ['Zainstaluj HealthyPaw na telefonie (aplikacja jest w zamkniętej becie, więc jeśli nie masz jeszcze linku do testów, poproś o niego osobę, która Cię zaprosiła).', 'Otwórz to zaproszenie jeszcze raz na telefonie.', 'Zaloguj się i dołącz do domu.'] },
  };
  const body = `<article class="doc"><div class="wrap narrow"><img src="/img/icon-rounded.svg" alt="" width="72" height="72" class="invite-icon">
  <h1>${esc(txt.en.title)}</h1>${steps(en, txt.en)}<hr><h1 lang="pl">${esc(txt.pl.title)}</h1>${steps(pl, txt.pl)}</div></article>`;
  return layout(en, 'home', { title: txt.en.title, description: 'HealthyPaw invite', body, noindex: true }).replace('<meta name="robots" content="noindex">', '<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer">');
}

function notFound() {
  const t = en;
  const body = `<section class="doc notfound"><div class="wrap narrow">
  <img src="/img/icon-rounded.svg" alt="" width="88" height="88">
  <h1>${esc(t.ui.notFoundTitle)} · ${esc(pl.ui.notFoundTitle)}</h1>
  <p>${esc(t.ui.notFoundBody)}<br><span lang="pl">${esc(pl.ui.notFoundBody)}</span></p>
  <p><a class="btn" href="/en/">${esc(t.ui.notFoundCta)}</a> <a class="btn btn-ghost" href="/pl/" lang="pl">${esc(pl.ui.notFoundCta)}</a></p>
</div></section>`;
  return layout(t, 'home', { title: 'Page not found · HealthyPaw', description: '', body, noindex: true });
}

const write = (path, html) => {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};
// "/en/" -> en/index.html, "/en/privacy" -> en/privacy.html (Workers assets serve both without the extension).
const fileFor = (p) => (p.endsWith('/') ? `${p}index.html` : `${p}.html`).slice(1);

for (const t of langs) {
  write(fileFor(t.paths.home), home(t));
  write(fileFor(t.paths.privacy), docPage(t, 'privacy', t.privacy, { updated: true }));
  write(fileFor(t.paths.terms), docPage(t, 'terms', t.terms, { updated: true }));
  write(fileFor(t.paths.deleteAccount), docPage(t, 'deleteAccount', t.deleteAccount));
  write(fileFor(t.paths.contact), contact(t));
}
write('404.html', notFound());

// Invite landing, served by the Worker for every /i/<token> (ADR 0024). Bilingual, no data, no scripts.
write('invite.html', invitePage());
if (site.appleTeamId) {
  write('.well-known/apple-app-site-association', JSON.stringify({
    applinks: { details: [{ appIDs: [`${site.appleTeamId}.${site.iosBundleId}`], components: [{ '/': '/i/*' }] }] },
  }));
} else console.warn('⚠ appleTeamId not set: no apple-app-site-association written, so invite links will open Safari, not the app.');

const pages = ['home', 'privacy', 'terms', 'contact', 'deleteAccount'];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${langs
  .flatMap((t) =>
    pages.map(
      (p) => `  <url><loc>${site.origin}${t.paths[p]}</loc>${langs
        .map((l) => `<xhtml:link rel="alternate" hreflang="${l.lang}" href="${site.origin}${l.paths[p]}"/>`)
        .join('')}</url>`,
    ),
  )
  .join('\n')}
</urlset>
`,
);
// No "Disallow: /c/": care-card pages send noindex themselves and crawlers must fetch them to see it (ADR 0024).
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);

const count = readdirSync(out, { recursive: true }).filter((f) => String(f).endsWith('.html')).length;
console.log(`Built ${count} pages into dist/`);
if (warnings.size) console.warn(`\n⚠ Placeholders still shown on the site (set them in site.config.mjs): ${[...warnings].join(', ')}`);
if (!site.appStoreUrl || !site.playStoreUrl) console.warn('ℹ Store links are not set yet, so the site shows "Coming soon" buttons.');
