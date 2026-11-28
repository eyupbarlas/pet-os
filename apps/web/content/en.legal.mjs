// Privacy notice and terms (English). Plain-language beta versions, built on the Termify templates Eyup supplied
// but rewritten to match what HealthyPaw actually does (no ads, no sales, no payments, no passwords).
// Not lawyer-reviewed. Review before public launch; see docs in the PR description for the open points.

export const privacy = {
  title: 'Privacy notice',
  description: 'What data HealthyPaw uses, why, who processes it and what your rights are.',
  body: (c) => `
<p class="lead">HealthyPaw is in an invite-only beta. This notice explains in plain words what personal data the app and this website use, why, who else handles it and what you can do about it. It applies to the HealthyPaw app and to healthypaw.app (together, the “Service”). It does not cover other websites that we link to.</p>

<h2>1. Who we are</h2>
<p>HealthyPaw is run by ${c.operator}${c.address ? `, ${c.address}` : ''} (“we”, “us”). We are the controller of your personal data under the GDPR. We are based in Poland. For anything about your data, write to <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>.</p>

<h2>2. Terms we use</h2>
<ul>
  <li><strong>Personal data:</strong> any information that identifies you or can be linked to you, such as your email address or a name.</li>
  <li><strong>Household:</strong> the group of people who share the care of the same pets in HealthyPaw.</li>
  <li><strong>Care card:</strong> a web link that shows a pet’s daily care to anyone who has the link.</li>
  <li><strong>Device:</strong> your phone or any other device you use to open the app or this website.</li>
</ul>

<h2>3. What we use and why</h2>
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
<p>You don’t need to give us anything beyond what the table lists. Without an account email or an Apple or Google sign-in, we can’t offer you an account.</p>

<h2>4. What we do not do</h2>
<ul>
  <li>No advertising, no ad networks, no remarketing and no interest-based ads.</li>
  <li>We don’t sell or rent your personal data, and we don’t share it with marketing partners.</li>
  <li>No payments or card details: the beta is free and nothing is bought inside the app.</li>
  <li>No passwords. You sign in with Apple, Google or a one-time code we email you.</li>
  <li>No location, photos, microphone, camera or contacts-book access.</li>
  <li>No automated decisions with legal or similarly significant effects on you.</li>
</ul>

<h2>5. Email</h2>
<p>We email you only about your account: sign-in codes, a confirmation when you delete your account, and replies to messages you send us. We don’t send newsletters or marketing emails. If that ever changes, we’ll ask for your consent first and you’ll be able to say no.</p>

<h2>6. This website, cookies and storage on your device</h2>
<p>healthypaw.app sets no cookies, has no analytics and loads no third-party scripts. Cloudflare delivers the site and processes your IP address to do so and to protect it from abuse.</p>
<p>The app stores your sign-in session and your settings on your phone, and a copy of your household’s data so that it works offline. This is needed for the app to work, and you can remove it by signing out, deleting the app or deleting your account.</p>

<h2>7. Who processes data for us</h2>
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
<p>These providers act on our instructions and may use your data only to provide their service to us.</p>

<h2>8. Who can see your data</h2>
<ul>
  <li><strong>Your household:</strong> every member sees the household’s pets, routines, health entries and history, including who ticked each task.</li>
  <li><strong>Anyone with a care card link</strong> can see that card until a member turns it off or replaces the link. Don’t put door codes or your address on a card.</li>
  <li><strong>Us:</strong> we only look at an individual account to help you when you ask, to fix a problem, or when the law requires it.</li>
  <li><strong>Authorities:</strong> we may disclose data if a court or authority legally requires it, or when it is necessary to protect someone’s safety or our legal rights.</li>
  <li><strong>A successor:</strong> if we sell or transfer HealthyPaw, your data may move to the new operator, who must keep to this notice. We’ll tell you before that happens.</li>
</ul>

<h2>9. Transfers outside the EU</h2>
<p>Most of your data stays in the EU. Resend stores email logs in the USA, and Cloudflare serves the website from servers around the world. Where data leaves the European Economic Area, we rely on safeguards such as the EU Standard Contractual Clauses or the EU-US Data Privacy Framework. You can ask us for details.</p>

<h2>10. How long we keep it</h2>
<p>We keep your data while your account exists. When you <a href="${c.deleteAccountPath}">delete your account</a>, we delete your account, profile, settings, household memberships, sign-in identities and your entries on care cards, and the household itself if you were its last member. Ticks you made stay in the household’s history as “Former member”, and things you added to a shared household stay with the remaining members. Database backups are overwritten within 7 days. Crash reports expire after 30 days. Emails to us are kept as long as needed to deal with them, and then deleted.</p>

<h2>11. How we protect it</h2>
<p>Data is encrypted in transit, access to it is limited to what each person needs, and each household can only see its own data. No system is perfectly secure, so we can’t promise that nothing will ever go wrong. If a breach is likely to put you at risk, we’ll tell you and the Polish data protection authority as the law requires.</p>

<h2>12. Your rights</h2>
<p>Under the GDPR you can ask us for a copy of your data, to correct it, to delete it, to restrict how we use it, to receive it in a portable format, and to object to processing that is based on our legitimate interest. You can withdraw consent for usage statistics or crash reports at any time in Settings, without affecting what happened before. Write to <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>. We may ask you to confirm who you are first, and we’ll reply within one month.</p>
<p>You can also complain to the Polish data protection authority: Prezes Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" rel="noopener">uodo.gov.pl</a>, or to the authority in your own EU country.</p>

<h2>13. Children</h2>
<p>HealthyPaw is for people aged 16 and over. We don’t knowingly collect data from anyone younger. If you think a child has given us personal data, write to us and we’ll delete it.</p>

<h2>14. Links to other websites</h2>
<p>The app can link to other services, such as a pet food shop or a groomer booking site. They have their own privacy policies and we are not responsible for them. This notice stops applying once you leave HealthyPaw.</p>

<h2>15. Changes</h2>
<p>We’ll update this page when something changes and tell you in the app if the change matters to you. The date at the top shows the latest version.</p>`,
};

export const terms = {
  title: 'Terms of use',
  description: 'The terms for using the HealthyPaw beta.',
  body: (c) => `
<p class="lead">These are the terms for using the HealthyPaw app and website, during the beta and after. We’ve kept them short and plain.</p>

<h2>1. About these terms</h2>
<p>These terms are an agreement between you and ${c.operator}${c.address ? `, ${c.address}` : ''} (“we”, “us”). By creating an account or using HealthyPaw you accept them. If you don’t agree, please don’t use the Service. Our <a href="${c.privacyPath}">privacy notice</a> explains how we handle your data.</p>

<h2>2. Terms we use</h2>
<ul>
  <li><strong>Service:</strong> the HealthyPaw app, the website healthypaw.app and everything we provide through them.</li>
  <li><strong>Household:</strong> the group of people sharing the care of the same pets.</li>
  <li><strong>Care card:</strong> a web link that shows a pet’s daily care to anyone who has the link.</li>
  <li><strong>Your content:</strong> everything you enter, such as pets, routines, health entries, notes and contact details.</li>
</ul>

<h2>2a. Licence to use the app</h2>
<p>We give you a personal, non-exclusive, non-transferable, revocable licence to install and use the app on your own devices, for your own household’s pet care, under these terms.</p>

<h2>3. The beta</h2>
<p>HealthyPaw is an invite-only test version and is free. Features will change, some things may break, and we may pause or end the beta. We’ll tell you in advance when we can. Please keep important health records, such as vaccination certificates, with your vet too.</p>

<h2>4. Your account</h2>
<ul>
  <li>You must be at least 16 years old.</li>
  <li>One account per person. Keep your sign-in safe and tell us if you think someone else is using it.</li>
  <li>Give us correct details, such as a working email address.</li>
</ul>

<h2>5. Your content and your household</h2>
<p>Your content stays yours. You allow us to store it and show it to the members of your household and to anyone you share a care card with, only so that HealthyPaw can work. You are responsible for what you add, including other people’s names and phone numbers: please ask them first.</p>
<p>The household owner invites and removes members. Every member can see and edit the household’s pets, routines and history.</p>

<h2>6. Care cards</h2>
<p>A care card is a link that anyone who has it can open. Share it only with people you trust, don’t put door codes or your address on it, and turn it off when you no longer need it.</p>

<h2>7. What you may not do</h2>
<p>Don’t use HealthyPaw to break the law, to harass anyone, or to get at other households’ data. Don’t overload or attack the service, and don’t copy, resell, rent or sublicense it. Don’t reverse engineer or decompile the app or try to extract its source code, except where the law gives you that right. Don’t remove our copyright or brand notices. We may suspend accounts that break these rules.</p>

<h2>8. Not veterinary advice</h2>
<p>HealthyPaw helps you organise care. It does not give veterinary advice and does not replace your vet. Reminders depend on your phone’s settings and battery and may not always arrive. In an emergency, call your vet.</p>

<h2>9. Ideas and feedback</h2>
<p>If you send us suggestions, you allow us to use them to improve HealthyPaw without paying you or crediting you. You keep your own rights in them, and we won’t publish your personal details with them.</p>

<h2>10. Links to other services</h2>
<p>The app can link to other services, such as a pet food shop or a groomer booking site. They are run by others and have their own terms and privacy policies. Nothing is bought or booked inside HealthyPaw, and we are not responsible for those services.</p>

<h2>11. Apple and Google</h2>
<p>If you get the app from the App Store or Google Play, their terms apply to the download too. Apple and Google are not responsible for HealthyPaw, its support or any claims about it. These terms are between you and us.</p>

<h2>12. Updates and changes to the service</h2>
<p>We may update the app with fixes and improvements, and add, change or remove features. Updates are part of the app and fall under these terms. We’ll try to give you notice before we remove something you rely on.</p>

<h2>13. Our rights</h2>
<p>The app, the HealthyPaw name and logo, the design and the software belong to us or our licensors and are protected by copyright and trademark law. These terms give you no ownership of them. If you believe something in HealthyPaw infringes your copyright, write to <a href="mailto:${c.supportEmail}">${c.supportEmail}</a> with what the material is, where you saw it, your contact details and a statement that you are the owner or act for the owner, and we’ll look into it.</p>

<h2>14. Ending</h2>
<p>You can stop using HealthyPaw and <a href="${c.deleteAccountPath}">delete your account</a> at any time. We may suspend or close an account that seriously or repeatedly breaks these terms, and we’ll tell you why unless the law stops us. We may also end the Service; if we do, we’ll give you reasonable notice and a chance to take what matters to you.</p>

<h2>15. Our responsibility</h2>
<p>We provide HealthyPaw with reasonable care and skill, but during the beta it comes “as is” and “as available”. We can’t promise that it will always be available, error-free or fit for a particular purpose. As far as the law allows, we are not liable for indirect or consequential losses, such as lost profits, or for data lost during the beta. We are fully liable where the law doesn’t let us limit liability, for example for intent or gross negligence, or for death or personal injury caused by our fault. Nothing in these terms takes away your rights as a consumer.</p>

<h2>16. Changes to these terms</h2>
<p>We may update these terms, for example when the Service changes. If a change matters, we’ll tell you in the app at least 14 days before it applies. If you keep using HealthyPaw after that, you accept the new terms. If you don’t agree, you can delete your account.</p>

<h2>17. The rest</h2>
<p>If a part of these terms turns out to be invalid, the rest still applies. If we don’t enforce a right straight away, we haven’t given it up. These terms and our privacy notice are the whole agreement between you and us about the Service.</p>

<h2>18. Law, complaints and contact</h2>
<p>Polish law applies. If you are a consumer, you also keep the protection of the mandatory laws of the country where you live, and you can bring a claim in the courts of that country or of Poland. If something goes wrong, please write to us first at <a href="mailto:${c.supportEmail}">${c.supportEmail}</a> and we’ll try to fix it. Consumers in Poland can also get free help from a municipal or county consumer ombudsman (rzecznik konsumentów) and from the Office of Competition and Consumer Protection (UOKiK).</p>`,
};
