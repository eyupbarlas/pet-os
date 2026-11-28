// English copy for healthypaw.app. Legal pages are plain-language beta versions, not lawyer-final.

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

  privacy: {
    title: 'Privacy notice',
    description: 'What data HealthyPaw uses, why, who processes it and what your rights are.',
    body: (c) => `
<p class="lead">HealthyPaw is in an invite-only beta. This notice explains in plain words what data the app and this website use, why, and what you can do about it.</p>

<h2>1. Who we are</h2>
<p>HealthyPaw is run by ${c.operator}${c.address ? `, ${c.address}` : ''} (“we”). We are the controller of your personal data. For anything about your data, write to <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>.</p>

<h2>2. What we use and why</h2>
<table>
  <thead><tr><th>Data</th><th>Why</th><th>Legal basis</th></tr></thead>
  <tbody>
    <tr><td><strong>Account:</strong> email address, display name, and the sign-in identifier from Apple or Google if you sign in with them</td><td>To create your account and sign you in</td><td>Contract (GDPR Art. 6(1)(b))</td></tr>
    <tr><td><strong>Pets and care:</strong> pet names, species, breed, birth date, weight, routines, ticks, medications, vet visits, vaccinations, your vet’s contact, notes, and your food and groomer links</td><td>To run the app for you and your household</td><td>Contract</td></tr>
    <tr><td><strong>Household:</strong> who is in it, their role, and who ticked what and when</td><td>So members can share the care and see who did what</td><td>Contract</td></tr>
    <tr><td><strong>Care cards:</strong> what you choose to show, including up to 3 first names and phone numbers, and how many times the link was opened</td><td>So a sitter can see today’s care without an account</td><td>Contract; for other people’s numbers, our legitimate interest in letting you share them, so please ask them first</td></tr>
    <tr><td><strong>App settings:</strong> language, reminder and quiet-hour choices, your privacy choices</td><td>To make the app work the way you set it</td><td>Contract</td></tr>
    <tr><td><strong>Usage statistics</strong> (PostHog EU), <strong>only if you turn them on</strong></td><td>To see which features help and which confuse</td><td>Consent (Art. 6(1)(a)); off by default, change it any time in Settings</td></tr>
    <tr><td><strong>Crash reports</strong> (Sentry EU), <strong>only if you turn them on</strong>; they carry no name or email</td><td>To find and fix bugs</td><td>Consent; off by default</td></tr>
    <tr><td><strong>Totals from the service</strong>, for example how many households keep a 7-day streak or how often care cards are opened</td><td>To learn whether HealthyPaw is useful. We only look at totals, never at one person, and share them with no one</td><td>Legitimate interest (Art. 6(1)(f))</td></tr>
    <tr><td><strong>Technical logs</strong> at our providers, such as IP addresses on requests</td><td>To keep the service secure and working</td><td>Legitimate interest</td></tr>
    <tr><td><strong>Messages you send us</strong></td><td>To answer you</td><td>Legitimate interest</td></tr>
  </tbody>
</table>
<p>We don’t use your location, photos or contacts book. We don’t show ads, we don’t sell data and we don’t track you across other apps or websites. Reminders are scheduled on your phone, not on our servers.</p>

<h2>3. This website</h2>
<p>healthypaw.app sets no cookies and has no analytics or third-party scripts. Cloudflare delivers the site and processes your IP address to do so and to protect it from abuse.</p>

<h2>4. Who processes data for us</h2>
<table>
  <thead><tr><th>Provider</th><th>What for</th><th>Where</th></tr></thead>
  <tbody>
    <tr><td>Supabase</td><td>Database and sign-in</td><td>Frankfurt, Germany</td></tr>
    <tr><td>PowerSync</td><td>Syncing data between household members’ phones</td><td>Ireland (EU)</td></tr>
    <tr><td>Resend</td><td>Sending sign-in and account emails</td><td>Sent from the EU; email logs stored in the USA</td></tr>
    <tr><td>PostHog</td><td>Usage statistics, only if you turn them on</td><td>Frankfurt, Germany</td></tr>
    <tr><td>Sentry</td><td>Crash reports, only if you turn them on</td><td>Germany</td></tr>
    <tr><td>Cloudflare</td><td>This website, care card pages, DNS, email forwarding</td><td>Global network</td></tr>
    <tr><td>Apple, Google</td><td>Sign in with Apple or Google, app distribution and beta testing (TestFlight, Google Play)</td><td>Their own terms and privacy policies apply</td></tr>
  </tbody>
</table>
<p>Where data leaves the European Economic Area, we rely on the safeguards these providers offer, such as the EU Standard Contractual Clauses or the EU-US Data Privacy Framework.</p>

<h2>5. Who can see your data</h2>
<ul>
  <li><strong>Your household:</strong> every member sees the household’s pets, routines, health entries and history, including who ticked each task.</li>
  <li><strong>Anyone with a care card link</strong> can see that card until a member turns it off or replaces the link. Don’t put door codes or your address on a card.</li>
  <li><strong>Us:</strong> we only look at an individual account to help you when you ask, to fix a problem, or when the law requires it.</li>
</ul>

<h2>6. How long we keep it</h2>
<p>We keep your data while your account exists. When you <a href="${c.deleteAccountPath}">delete your account</a>, we delete your account, profile, settings, household memberships, sign-in identities and your entries on care cards, and the household itself if you were its last member. Ticks you made stay in the household’s history as “Former member”, and things you added to a shared household stay with the remaining members. Database backups are overwritten within 7 days. Crash reports expire after 30 days. Emails to us are kept as long as needed to deal with them.</p>

<h2>7. Your rights</h2>
<p>You can ask us for a copy of your data, to correct it, to delete it, to restrict or object to how we use it, or to receive it in a portable format. You can withdraw consent for usage statistics or crash reports at any time in Settings. Write to <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a> and we’ll reply within one month.</p>
<p>You can also complain to the Polish data protection authority: Prezes Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" rel="noopener">uodo.gov.pl</a>, or to the authority in your own EU country.</p>

<h2>8. Age</h2>
<p>HealthyPaw is for people aged 16 and over.</p>

<h2>9. Changes</h2>
<p>We’ll update this page when something changes and tell you in the app if the change matters to you.</p>`,
  },

  terms: {
    title: 'Terms of use',
    description: 'The terms for using the HealthyPaw beta.',
    body: (c) => `
<p class="lead">These are the terms for using the HealthyPaw app and website during the beta. We’ve kept them short and plain.</p>

<h2>1. About these terms</h2>
<p>These terms are an agreement between you and ${c.operator}${c.address ? `, ${c.address}` : ''} (“we”). By creating an account or using HealthyPaw you accept them. Our <a href="${c.privacyPath}">privacy notice</a> explains how we handle your data.</p>

<h2>2. The beta</h2>
<p>HealthyPaw is an invite-only test version and is free. Features will change, some things may break, and we may pause or end the beta. We’ll tell you in advance when we can. Please keep important health records, such as vaccination certificates, with your vet too.</p>

<h2>3. Your account</h2>
<ul>
  <li>You must be at least 16 years old.</li>
  <li>One account per person. Keep your sign-in safe and tell us if you think someone else is using it.</li>
</ul>

<h2>4. Your content and your household</h2>
<p>What you enter stays yours. You allow us to store it and show it to the members of your household and to anyone you share a care card with, only so that HealthyPaw can work. You are responsible for what you add, including other people’s names and phone numbers: please ask them first.</p>
<p>The household owner invites and removes members. Every member can see and edit the household’s pets, routines and history.</p>

<h2>5. Care cards</h2>
<p>A care card is a link that anyone who has it can open. Share it only with people you trust, don’t put door codes or your address on it, and turn it off when you no longer need it.</p>

<h2>6. Not veterinary advice</h2>
<p>HealthyPaw helps you organise care. It does not give veterinary advice and does not replace your vet. Reminders depend on your phone’s settings and battery and may not always arrive. In an emergency, call your vet.</p>

<h2>7. Fair use</h2>
<p>Don’t use HealthyPaw to break the law, to harass anyone, to access other households’ data, to overload or attack the service, or to copy it. We may suspend accounts that do.</p>

<h2>8. Links to other services</h2>
<p>The app can link to other services, such as a pet food shop or a groomer booking site. They are run by others and have their own terms. Nothing is bought or booked inside HealthyPaw.</p>

<h2>9. Ending</h2>
<p>You can stop using HealthyPaw and <a href="${c.deleteAccountPath}">delete your account</a> at any time. We may close an account that breaks these terms, and we’ll tell you why.</p>

<h2>10. Our responsibility</h2>
<p>During the beta HealthyPaw is provided as it is. We do our best to keep it working and your data safe, but we can’t promise it will always be available or free of errors. As far as the law allows, we are not liable for indirect losses or for data lost during the beta. Nothing in these terms limits your rights as a consumer or any liability that cannot be limited by law.</p>

<h2>11. Changes to these terms</h2>
<p>We may update these terms. If a change matters, we’ll tell you in the app before it applies. If you don’t agree, you can delete your account.</p>

<h2>12. Law and contact</h2>
<p>Polish law applies. If you are a consumer, you also keep the protection of the law of the country where you live. Questions? Write to <a href="mailto:${c.supportEmail}">${c.supportEmail}</a>.</p>`,
  },
};
