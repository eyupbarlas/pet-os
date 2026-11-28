// English copy for healthypaw.app. Legal pages are plain-language beta versions, not lawyer-final.

import { privacy, terms } from './en.legal.mjs';

export default {
  lang: 'en',
  ogLocale: 'en_US',
  paths: {
    home: '/en/',
    privacy: '/en/privacy',
    terms: '/en/terms',
    contact: '/en/contact',
    deleteAccount: '/en/delete-account',
  },
  ui: {
    menu: 'Menu',
    skip: 'Skip to content',
    nav: { features: 'Features', how: 'How it works', faq: 'FAQ', contact: 'Contact' },
    getApp: 'Get the app',
    switchTo: 'Polski',
    switchLabel: 'Ta strona po polsku',
    comingSoon: 'Coming soon',
    downloadOn: 'Download on the',
    getItOn: 'Get it on',
    appStore: 'App Store',
    googlePlay: 'Google Play',
    footerTagline: 'Daily pet care, shared by the whole household.',
    footerProduct: 'Product',
    footerLegal: 'Legal',
    footerHelp: 'Help',
    privacy: 'Privacy notice',
    terms: 'Terms',
    deleteAccount: 'Delete your account',
    contact: 'Contact us',
    madeIn: 'Made in Warsaw for dogs, cats and their people.',
    updated: 'Last updated',
    todo: 'to be confirmed',
    notFoundTitle: 'Page not found',
    notFoundBody: 'This page wandered off. Let’s get you back home.',
    notFoundCta: 'Back to the home page',
  },

  home: {
    title: 'HealthyPaw: daily pet care, shared',
    description:
      'A shared daily checklist for your dog or cat. Walks, meals and meds in one list, ticked off by the whole household, with streaks, health records and a care card for the sitter.',
    eyebrow: 'Daily pet care, shared',
    h1: 'Every walk, meal and med in one list',
    lead:
      'HealthyPaw is a shared daily checklist for your dog or cat. Tick a task off and the whole household sees it, so nobody feeds the cat twice and nobody misses the evening pill.',
    heroNote: 'Free during the beta · iPhone and Android · English and Polish',
    heroAlt: 'The Today screen: Luna’s day with 2 of 6 tasks done and a 12-day streak',

    problemTitle: 'Sound familiar?',
    bubbles: ['“Did you feed her?”', '“Was the pill this morning or tonight?”', '“Wait, who walked him?”'],
    problemAnswer: 'HealthyPaw answers all three before anyone has to ask.',

    featuresTitle: 'Everything your pet’s day needs, nothing it doesn’t',
    features: [
      {
        img: '02-household',
        kicker: 'Household',
        title: 'Share the care with everyone at home',
        body:
          'Invite your partner, kids or flatmates with a link. Everyone sees the same pets and the same list, and every tick shows who did it and when.',
        points: ['“Done by Anna, 8:12”', 'Works offline and syncs later', 'One shared streak per pet'],
        alt: 'Inviting a family member to the household',
      },
      {
        img: '03-streak',
        kicker: 'Streaks',
        title: 'Build a streak together',
        body:
          'A day counts when every meal, med and walk is ticked. Celebrate 7, 14, 30 and 100 days. Busy day? Two paw passes a month keep the streak safe. Never a guilt trip.',
        points: ['Milestones to celebrate', 'Paw passes for busy days', 'Rest days when you need them'],
        alt: 'Luna’s 12-day streak with weekly progress and milestones',
      },
      {
        img: '04-health',
        kicker: 'Health',
        title: 'Health records in your pocket',
        body:
          'Medications with doses and schedules turn into tasks on the daily list. Vet visits and vaccinations sit in one place, with a heads-up before the next one is due.',
        points: ['Meds become daily tasks', 'Vaccinations and next due dates', 'Your vet’s number, one tap away'],
        alt: 'Health screen with medications, vaccinations and vet visits',
      },
      {
        img: '05-care-card',
        kicker: 'Care card',
        title: 'A care card for the sitter',
        body:
          'Going away? Share one link with today’s routine, meds, feeding amounts and your vet. It opens in any browser, no app or account needed, and you can turn it off at any time.',
        points: ['No app needed for the sitter', 'You choose what’s on it', 'Turn it off with one tap'],
        alt: 'Setting up Luna’s care card for a sitter',
      },
    ],

    extrasTitle: 'Made for real homes',
    extras: [
      { icon: 'paw', title: 'Dogs and cats', body: 'Routines that fit each species: walks for dogs, fresh water and litter for cats.' },
      { icon: 'bell', title: 'Gentle reminders', body: 'Turn reminders on per task, with your own quiet hours. One streak nudge a day, at most.' },
      { icon: 'wifi', title: 'Works offline', body: 'Tick in the lift or the cellar. Everything syncs when you’re back online.' },
      { icon: 'lock', title: 'Private by default', body: 'No ads, no selling data. Usage stats stay off unless you turn them on.' },
      { icon: 'globe', title: 'English and Polish', body: 'The whole app, the care card and every reminder, in both languages.' },
      { icon: 'heart', title: 'Free in the beta', body: 'Everything in HealthyPaw is free while we test it together.' },
    ],
    catAlt: 'Today screen for a cat with meals, fresh water and litter',

    howTitle: 'Up and running in two minutes',
    steps: [
      { title: 'Add your pet', body: 'Name, dog or cat, and a few details. A sensible daily routine is ready straight away.' },
      { title: 'Invite your household', body: 'Send a link to the people you share the care with.' },
      { title: 'Tick it off together', body: 'Everyone sees what’s done. Keep the streak going, one day at a time.' },
    ],

    downloadTitle: 'Coming to iPhone and Android',
    downloadTitleLive: 'Get HealthyPaw on your phone',
    downloadBody:
      'HealthyPaw is in a small, invite-only beta in Warsaw. Want to be one of the first households to try it? Write to us and we’ll send you an invite.',
    betaCta: 'Ask for a beta invite',
    betaSubject: 'HealthyPaw beta invite',

    faqTitle: 'Questions, answered',
    faq: [
      { q: 'How much does HealthyPaw cost?', a: 'It’s free during the beta. If that ever changes, we’ll tell you well in advance.' },
      { q: 'Which pets does it support?', a: 'Dogs and cats for now, with routines made for each. More species may come later.' },
      { q: 'Does my sitter need the app?', a: 'No. The care card is a link that opens in any browser. You can turn it off at any time.' },
      {
        q: 'Where is my data stored?',
        a: 'In the EU, with Supabase in Frankfurt. We don’t sell data and there are no ads. Read the <a href="{privacy}">privacy notice</a> for the details.',
      },
      {
        q: 'How do I delete my account?',
        a: 'In the app: Settings, Account, Delete account. Or follow the steps on <a href="{deleteAccount}">this page</a>.',
      },
    ],
  },

  contact: {
    title: 'Contact us',
    description: 'Get in touch with the HealthyPaw team.',
    lead: 'We’re a small team and we read every message. We usually reply within two working days.',
    cards: [
      { title: 'Help and feedback', body: 'Questions about the app, a bug, an idea, or a beta invite.', key: 'support' },
      { title: 'Privacy and your data', body: 'Access, correction or deletion of your data, and anything in the privacy notice.', key: 'privacy' },
    ],
    deleteHint: 'Want to delete your account? <a href="{deleteAccount}">Here’s how</a>.',
    postal: 'Postal address',
  },

  deleteAccount: {
    title: 'Delete your HealthyPaw account',
    description: 'How to delete your HealthyPaw account and what happens to your data.',
    body: ({ privacyEmail, privacyPath }) => `
<h2>In the app (quickest)</h2>
<ol>
  <li>Open HealthyPaw and go to <strong>Settings</strong>.</li>
  <li>Tap <strong>Account</strong>, then <strong>Delete account</strong>.</li>
  <li>Confirm. If you signed in with Apple, you’ll be asked to confirm with Apple once more.</li>
</ol>
<p>Your account is deleted straight away and you’ll get a short email to confirm it.</p>

<h2>Without the app</h2>
<p>Email <a href="mailto:${privacyEmail}?subject=Delete%20my%20account">${privacyEmail}</a> <strong>from the email address on your account</strong>, with the subject “Delete my account”. We’ll delete your account within 30 days, usually within a few days, and reply to confirm.</p>
<p>If you signed in with Apple and chose “Hide My Email”, your account address is the relay address shown under Sign in with Apple in your Apple ID settings. Write from your own address and include that relay address, or use the app.</p>

<h2>What is deleted</h2>
<ul>
  <li>Your account, profile, sign-in identities and settings.</li>
  <li>Your membership of every household.</li>
  <li>Your name and phone number on any care card.</li>
  <li>If you are the last member of a household: the household, its pets and all their data.</li>
  <li>Any usage statistics linked to your account, if you had turned them on.</li>
</ul>

<h2>What stays</h2>
<ul>
  <li>Ticks you made stay in the household’s history, shown as “Former member”, so the other members’ streak and history still make sense.</li>
  <li>Things you added to a shared household, such as pet notes, health entries and task names, stay with the remaining members.</li>
  <li>Database backups are kept for up to 7 days before they are overwritten.</li>
</ul>
<p>More in the <a href="${privacyPath}">privacy notice</a>.</p>`,
  },

  privacy,
  terms,
};
